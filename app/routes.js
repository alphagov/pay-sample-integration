require('array.prototype.find');
var logger = require('winston');

var response = require(__dirname + '/utils/response.js').response;

var Client = require('node-rest-client').Client;
var client = new Client();
var AUTH_TOKEN_PREFIX = "t_";
var CHARGE_ID_PREFIX = "c_";

module.exports = {
  bind: function (app) {
    var PAYMENT_PATH = "/proceed-to-payment";
    var SUCCESS_PATH = "/success/";
    var PUBLIC_API_PAYMENTS_PATH = '/v1/payments/';

    function extractChargeId(frontEndRedirectionUrl) {
      var chargeIdWithOneTimeToken = frontEndRedirectionUrl.split('/').pop();
      return chargeIdWithOneTimeToken.split('?')[0];
    }

    app.get('/', function (req, res) {
      logger.info('GET /');

      var paymentReference = randomIntNotInSession(req);
      if (req.query.authToken) {
        req.session_state[AUTH_TOKEN_PREFIX + paymentReference] = req.query.authToken;
      }

      var amount = "" + Math.floor(Math.random() * 2500) + 1;
      var data = {
        'title': 'Proceed to payment',
        'amount': amount,
        'formatted_amount': ("" + (amount / 100)).currency(),
        'proceed_to_payment_path': PAYMENT_PATH,
        'payment_reference': paymentReference
      };
      res.render('paystart', data);
    });

    app.post(PAYMENT_PATH, function (req, res) {
      logger.info('POST ' + PAYMENT_PATH);
      var paymentReference = req.body.paymentReference;
      var successPage = process.env.DEMO_SERVER_URL + SUCCESS_PATH + paymentReference;

      var paymentData = {
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          'amount': parseInt(req.body.amount),
          'account_id': req.body.accountId,
          'return_url': successPage
        }
      };

      if (req.session_state[AUTH_TOKEN_PREFIX + paymentReference]) {
        paymentData.headers.Authorization = "Bearer " + req.session_state[AUTH_TOKEN_PREFIX + paymentReference];
      }

      var publicApiUrl = process.env.PUBLICAPI_URL + PUBLIC_API_PAYMENTS_PATH;
      client.post(publicApiUrl, paymentData, function (data, publicApiResponse) {
        if (publicApiResponse.statusCode == 201) {
          var frontendCardDetailsUrl = findLinkForRelation(data.links, 'next_url');
          var chargeId = extractChargeId(frontendCardDetailsUrl.href);

          req.session_state[CHARGE_ID_PREFIX + paymentReference] = chargeId;
          logger.info('Redirecting user to: ' + frontendCardDetailsUrl.href);
          res.redirect(303, frontendCardDetailsUrl.href);
          return;
        }

        res.statusCode = 400;
        response(req, res, 'error', {
          'message': 'Example service failed to create charge'
        });
      });
    });

    app.get(SUCCESS_PATH + ':paymentReference', function (req, res) {
      var paymentReference = req.params.paymentReference;
      var chargeId = req.session_state[CHARGE_ID_PREFIX + paymentReference];

      var publicApiUrl = process.env.PUBLICAPI_URL + PUBLIC_API_PAYMENTS_PATH + chargeId;
      var args = {
        headers: {'Accept': 'application/json',
                  'Authorization': 'Bearer ' + req.session_state[AUTH_TOKEN_PREFIX + paymentReference] }
      };

      client.get(publicApiUrl, args, function (data, publicApiResponse) {
        if (publicApiResponse.statusCode == 200 && data.status === "SUCCEEDED") {
          var responseData = {
            'title': 'Payment confirmation',
            'confirmationMessage': 'Your payment has been successful',
            'paymentReference': paymentReference + '-' + chargeId,
            'paymentDescription': 'Demo Transaction',
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
        if (req.session_state[AUTH_TOKEN_PREFIX + theInt]) {
          theInt = -1;
        }
      }
      return theInt;
    }

  }
};
