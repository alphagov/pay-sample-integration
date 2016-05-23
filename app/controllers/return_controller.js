var api = require(__dirname + '/../utils/api.js');
var response = require(__dirname + '/../utils/response.js').response;
var currency = require(__dirname + '/../utils/currency.js');

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.bindRoutesTo = (app) => {
  var RETURN_PATH = "/return/";
  var PAY_API_PAYMENTS_PATH = '/v1/payments/';
  
  app.get(RETURN_PATH + ':paymentReference', (req, res) => {
    var paymentReference = req.params.paymentReference;
    if (req.state[paymentReference] && req.state[paymentReference].pid) {
      var paymentId = req.state[paymentReference].pid;
      var payApiUrl = api.getUrl(req) + PAY_API_PAYMENTS_PATH + paymentId;
      var paymentRequest = {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + api.getKey(req)
        }
      };
    
      client.get(payApiUrl, paymentRequest, (data, payApiResponse) => {
        if ((payApiResponse.statusCode) == 200 && (data.state.status === "success")) {
          var responseData = {
            'title': 'Payment confirmation',
            'confirmationMessage': 'Your payment has been successful',
            'paymentReference': data.reference,
            'paymentDescription': data.description,
            'formattedAmount': currency.format(data.amount),
          };
          response(req, res, 'return', responseData);
          return;
        }
        response(req, res, 'error', {
          'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
          'paymentReference': paymentReference + '-' + paymentId
        });
      });
    }
    else {
      response(req, res, 'error', {
        'message': 'GOV.UK Pay returned an invalid payment reference.',
        'paymentReference': paymentReference
      });
    }
  });
}