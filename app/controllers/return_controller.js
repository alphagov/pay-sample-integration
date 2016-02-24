var api = require(__dirname + '/../utils/api.js');
var response = require(__dirname + '/../utils/response.js').response;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.bindRoutesTo = (app) => {
  var RETURN_PATH = "/return/";
  var PAY_API_PAYMENTS_PATH = '/v1/payments/';
  
  app.get(RETURN_PATH + ':paymentReference', (req, res) => {
    var paymentReference = req.params.paymentReference;
    var paymentId = req.state[paymentReference].pid;
    var payApiUrl = api.getUrl(req) + PAY_API_PAYMENTS_PATH + paymentId;
    var paymentRequest = {
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + api.getKey(req)
      }
    };
    
    client.get(payApiUrl, paymentRequest, (data, payApiResponse) => {
      if (payApiResponse.statusCode == 200 && data.status === "SUCCEEDED") {
        var responseData = {
          'title': 'Payment confirmation',
          'confirmationMessage': 'Your payment has been successful',
          'paymentReference': data.reference,
          'paymentDescription': data.description,
          'formattedAmount': ("" + (data.amount / 100)).currency(),
        };
        response(req, res, 'return', responseData);
        return;
      }
      response(req, res, 'error', {
        'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
        'paymentReference': paymentReference + '-' + paymentId
      });
    });
  });
}