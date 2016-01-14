require('array.prototype.find');
var logger = require('winston');
var response = require(__dirname + '/utils/response.js').response;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports = {
  bind: function (app) {
    var SERVICE_PATH = "/service/";
    var PAYMENT_PATH = "/proceed-to-payment";
    var RETURN_PATH = "/return/";
    var PAY_API_PAYMENTS_PATH = '/v1/payments/';

    app.get('/', function (req, res) {
      var data = {
        'service_path': SERVICE_PATH
      };

      if (req.query.invalidAuthToken) {
        data.invalidAuthTokenMsg = 'Please enter a valid Authorization Token';
      }

      res.render('paystart', data);
    });

    app.get(SERVICE_PATH, function (req, res) {
      req.state.count = (req.state.count || 0) + 1;
      var paymentReference = req.state.count;

      if (req.query.authToken) {
        req.state[paymentReference] = { 'at': req.query.authToken };
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
      if (req.body.authToken) {
        res.redirect(303, SERVICE_PATH + '?authToken=' + req.body.authToken);
      } else {
        res.redirect(303, '/?invalidAuthToken=true');
      }
      return;
    });

    app.post(PAYMENT_PATH, function (req, res) {
      var paymentReference = req.body.paymentReference;
      var returnPage = process.env.SERVICE_URL + RETURN_PATH + paymentReference;

      var paymentData = {
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          'amount': parseInt(req.body.amount),
          'reference': req.body.reference,
          'description': req.body.description,
          'return_url': returnPage
        }
      };

      paymentData.headers.Authorization = "Bearer " + req.state[paymentReference].at;

      var payApiUrl = process.env.PAY_API_URL + PAY_API_PAYMENTS_PATH;
      var errorMessage = 'Sample service failed to create charge';
      client.post(payApiUrl, paymentData, function (data, payApiResponse) {

        logger.info('pay api response: ', data);

        if (payApiResponse.statusCode == 201) {
          var frontendCardDetailsUrl = findLinkForRelation(data.links, 'next_url');

          req.state[paymentReference].pid = data.payment_id;

          res.redirect(303, frontendCardDetailsUrl.href);
          return;
        }

        res.statusCode = 400;
        if (payApiResponse.statusCode == 401) {
            errorMessage = 'Credentials are required to access this resource';
            res.statusCode = 401;
        }

        response(req, res, 'error', {
          'message': errorMessage
        });
      }).on('error', function (err) {
        logger.error('Exception raised calling pay api: ' + err);
        response(req, res, 'error', {
            'message': errorMessage
        });
      });
    });

    app.get(RETURN_PATH + ':paymentReference', function (req, res) {
      var paymentReference = req.params.paymentReference;
      var paymentId = req.state[paymentReference].pid;

      var payApiUrl = process.env.PAY_API_URL + PAY_API_PAYMENTS_PATH + paymentId;
      var args = {
        headers: {'Accept': 'application/json',
                  'Authorization': 'Bearer ' + req.state[paymentReference].at }
      };

      client.get(payApiUrl, args, function (data, payApiResponse) {
        if (payApiResponse.statusCode == 200 && data.status === "SUCCEEDED") {
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
          'paymentReference': paymentReference + '-' + paymentId
        });
      });
    });

    function findLinkForRelation(links, rel) {
      return links.find(function (link) {
        return link.rel === rel;
      });
    }
  }
};
