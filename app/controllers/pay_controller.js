var logger = require('winston');
var _ = require('lodash');
var api = require(__dirname + '/../utils/api.js');
var response = require(__dirname + '/../utils/response.js').response;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.bindRoutesTo = (app) => {
  var PAY_PATH = "/pay";
  var RETURN_PATH = "/return/";
  var PAY_API_PAYMENTS_PATH = '/v1/payments/';
  
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
  
  app.post(PAY_PATH, (req, res) => {
    var paymentReference = req.body.reference;
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
    
    client.post(payApiUrl, paymentRequest, (data, payApiResponse) => {
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
    }).on('error', (err) => {
      logger.error('Exception raised calling pay api: ' + err);
      response(req, res, 'error', {
          'message': 'Sample service failed to create charge'
      });
    });
  });
}