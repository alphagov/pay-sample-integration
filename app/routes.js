require('array.prototype.find');
var logger = require('winston');
var _ = require('lodash');
var api = require(__dirname + '/utils/api.js');
var response = require(__dirname + '/utils/response.js').response;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports = {
  bind: function (app) {
    var SERVICE_PATH = "/service/";
    var PAYMENT_PATH = "/proceed-to-payment";
    var RETURN_PATH = "/return/";
    var PAY_API_PAYMENTS_PATH = '/v1/payments/';
    
    app.get(SERVICE_PATH, function (req, res) {
      var data = {
        'auth_token': api.getKey(req),
        'proceed_to_payment_path': PAYMENT_PATH
      };
      
      res.render('service', data);
    });
    
    app.post(PAYMENT_PATH, function (req, res) {
      var paymentReference = req.body.paymentReference;
      var returnPage = getSelfUrl(req)  + RETURN_PATH + paymentReference;
      var payApiUrl = api.getUrl(req) + PAY_API_PAYMENTS_PATH;
      var paymentRequest = {
        headers: {
          "Content-Type": "application/json",
          'Authorization' : 'Bearer ' + api.getKey(req)
        },
        data: {
          'amount': parseInt(req.body.amount),
          'reference': req.body.reference,
          'description': req.body.description,
          'return_url': returnPage
        }
      };
      
      client.post(payApiUrl, paymentRequest, function (data, payApiResponse) {
        logger.info('pay api response: ', data);

        if (payApiResponse.statusCode == 201) {
          var frontendCardDetailsUrl = findNextUrl(data);
          req.state[paymentReference] = { pid: data.payment_id };
          res.redirect(303, frontendCardDetailsUrl.href);
          return;
        }

        if (payApiResponse.statusCode == 401) {
          res.statusCode = 401;
          response(req, res, 'error', {
            'message': 'Credentials are required to access this resource'
          });
        }
        else {
          res.statusCode = 400;
          response(req, res, 'error', {
            'message': 'Sample service failed to create charge'
          }); 
        }
      }).on('error', function (err) {
        logger.error('Exception raised calling pay api: ' + err);
        response(req, res, 'error', {
            'message': 'Sample service failed to create charge'
        });
      });
    });

    app.get(RETURN_PATH + ':paymentReference', function (req, res) {
      var paymentReference = req.params.paymentReference;
      var paymentId = req.state[paymentReference].pid;
      var payApiUrl = api.getUrl(req) + PAY_API_PAYMENTS_PATH + paymentId;
      var paymentRequest = {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + api.getKey(req)
        }
      };

      client.get(payApiUrl, paymentRequest, function (data, payApiResponse) {
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
    
    function getSelfUrl(req) {
      return req.protocol + '://' + req.get('host');
    }
    
    function findNextUrl(data) {
      var next_url = _.get(data, "_links.next_url");
      if (typeof next_url === 'undefined') {
        throw Error("Resource doesn't provide a 'next_url' relational link: " + JSON.stringify(data));
      }
      return next_url;
    }
  }
};
