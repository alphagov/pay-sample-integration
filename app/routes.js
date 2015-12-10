require('array.prototype.find');
var logger = require('winston');
var response = require(__dirname + '/utils/response.js').response;

var Client = require('node-rest-client').Client;
var client = new Client();
var AUTH_TOKEN_PREFIX = "t_";
var CHARGE_ID_PREFIX = "c_";

module.exports = {
  bind: function (app) {
    var SERVICE_PATH = "/service/";
    var PAYMENT_PATH = "/proceed-to-payment";
    var SUCCESS_PATH = "/success/";
    var PUBLIC_API_PAYMENTS_PATH = '/v1/payments/';

    function extractChargeId(frontEndRedirectionUrl) {
      var chargeIdWithOneTimeToken = frontEndRedirectionUrl.split('/').pop();
      return chargeIdWithOneTimeToken.split('?')[0];
    }

    app.get('/', function (req, res) {
      logger.info('GET /');

      var data = {
        'service_path': SERVICE_PATH
      };

      if (req.query.invalidAuthToken) {
        data.invalidAuthTokenMsg = 'Please enter a valid Authorization Token';
      }

      res.render('paystart', data);
    });

    app.get(SERVICE_PATH, function (req, res) {
      logger.info('GET ' + SERVICE_PATH);

      var paymentReference = randomIntNotInSession(req);

      if (req.query.authToken) {
        req.demoservice_state[AUTH_TOKEN_PREFIX + paymentReference] = req.query.authToken;
      } else {
        res.redirect(303, '/?invalidAuthToken=true');
        return;
      }

      var data = {
        'proceed_to_payment_path': PAYMENT_PATH,
        'payment_reference': paymentReference
      };
      res.render('service', data);
    });

    app.post(SERVICE_PATH, function (req, res) {
      logger.info('POST ' + SERVICE_PATH);

      if (req.body.authToken) {
        res.redirect(303, SERVICE_PATH + '?authToken=' + req.body.authToken);
      } else {
        res.redirect(303, '/?invalidAuthToken=true');
      }
      return;
    });

    app.post(PAYMENT_PATH, function (req, res) {
      logger.info('POST ' + PAYMENT_PATH);
      var paymentReference = req.body.paymentReference;
      var successPage = process.env.DEMOSERVICE_PAYSTART_URL + SUCCESS_PATH + paymentReference;

      var paymentData = {
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          'amount': parseInt(req.body.amount),
          'reference': req.body.reference,
          'description': req.body.description,
          'return_url': successPage
        }
      };

      if (req.demoservice_state[AUTH_TOKEN_PREFIX + paymentReference]) {
        paymentData.headers.Authorization = "Bearer " + req.demoservice_state[AUTH_TOKEN_PREFIX + paymentReference];
      }

      var publicApiUrl = process.env.PUBLICAPI_URL + PUBLIC_API_PAYMENTS_PATH;
      var errorMessage = 'Demo service failed to create charge';
      client.post(publicApiUrl, paymentData, function (data, publicApiResponse) {

        logger.info('Publicapi response: ' + data);

        if (publicApiResponse.statusCode == 201) {
          var frontendCardDetailsUrl = findLinkForRelation(data.links, 'next_url');
          var chargeId = extractChargeId(frontendCardDetailsUrl.href);

          req.demoservice_state[CHARGE_ID_PREFIX + paymentReference] = chargeId;
          logger.info('Redirecting user to: ' + frontendCardDetailsUrl.href);
          res.redirect(303, frontendCardDetailsUrl.href);
          return;
        }

        res.statusCode = 400;
        if (publicApiResponse.statusCode == 401) {
            errorMessage = 'Credentials are required to access this resource';
            res.statusCode = 401;
        }

        response(req, res, 'error', {
          'message': errorMessage
        });
      }).on('error', function (err) {
        logger.error('Exception raised calling publicapi: ' + err);
        response(req, res, 'error', {
            'message': errorMessage
        });
      });
    });

    app.get(SUCCESS_PATH + ':paymentReference', function (req, res) {
      var paymentReference = req.params.paymentReference;
      var chargeId = req.demoservice_state[CHARGE_ID_PREFIX + paymentReference];

      var publicApiUrl = process.env.PUBLICAPI_URL + PUBLIC_API_PAYMENTS_PATH + chargeId;
      var args = {
        headers: {'Accept': 'application/json',
                  'Authorization': 'Bearer ' + req.demoservice_state[AUTH_TOKEN_PREFIX + paymentReference] }
      };

      client.get(publicApiUrl, args, function (data, publicApiResponse) {
        if (publicApiResponse.statusCode == 200 && data.status === "SUCCEEDED") {
          var responseData = {
            'title': 'Payment confirmation',
            'confirmationMessage': 'Your payment has been successful',
            'paymentReference': data.reference,
            'paymentDescription': data.description,
            'formattedAmount': ("" + (data.amount / 100)).currency(),
          };
          response(req, res, 'success', responseData);
          return;
        }
        response(req, res, 'error', {
          'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
          'paymentReference': paymentReference + '-' + chargeId
        });
      });
    });

    function findLinkForRelation(links, rel) {
      return links.find(function (link) {
        return link.rel === rel;
      });
    }

    function randomIntNotInSession(req) {
      var theInt = -1;
      while (theInt < 0) {
        theInt = Math.floor(Math.random() * (1000 - 1) + 1);
        if (req.demoservice_state[AUTH_TOKEN_PREFIX + theInt]) {
          theInt = -1;
        }
      }
      return theInt;
    }

  }
};
