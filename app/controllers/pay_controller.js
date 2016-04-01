var logger = require('winston');
var _ = require('lodash');
var api = require(__dirname + '/../utils/api.js');
var util = require(__dirname + '/../utils/util.js');
var response = require(__dirname + '/../utils/response.js').response;
var formatPrice = require('format-price').format;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.bindRoutesTo = (app) => {
  var PAY_PATH = "/pay";
  var RETURN_PATH = "/return/";
  var PAY_API_PAYMENTS_PATH = '/v1/payments/';
  
  function getSelfUrl(req) {
    return req.protocol + '://' + req.get('host');
  }

  function findNextUrlPost(data) {
    var next_url_post = _.get(data, "_links.next_url_post");
    if (typeof next_url_post === 'undefined') {
      throw Error("Resource doesn't provide a 'next_url_post' relational link: " + JSON.stringify(data));
    }
    return next_url_post;
  }
  
  app.post(PAY_PATH, (req, res) => {
    var paymentReference = req.body.reference;
    var returnPage = getSelfUrl(req)  + RETURN_PATH + paymentReference;
    var payApiUrl = api.getUrl(req) + PAY_API_PAYMENTS_PATH;
    if (!util.isNumeric(req.body.amount)) {
      var data = {
        'auth_token': req.query.authToken,
        'reference': req.body.reference,
        'description': req.body.description,
        'proceed_to_payment_path': PAY_PATH,
        'invalidAmountMsg': 'Invalid amount value. Only integer values allowed'};
      res.render("proceed", data);
      return;
    }
    var paymentRequest = {
      headers: {
        "Content-Type": "application/json",
        'Authorization' : 'Bearer ' + api.getKey(req)
      },
      data: {
        'amount': req.body.amount,
        'reference': req.body.reference,
        'description': req.body.description,
        'return_url': returnPage
      }
    };

  console.log('Making a payment to: ' + payApiUrl);
    client.post(payApiUrl, paymentRequest, (data, payApiResponse) => {
      logger.info('pay api response: ', data);
      if (payApiResponse.statusCode == 201) {
        req.state[paymentReference] = { pid: data.payment_id };
        var frontendCardDetailsUrlPost = findNextUrlPost(data);
        var responseData = {
          'reference': data.reference,
          'description': data.description,
          'formattedAmount': formatPrice('en-GB', 'GBP', `${ (data.amount || 0) / 100 } `),
          'submit_payment_url': frontendCardDetailsUrlPost.href,
          'token_id': frontendCardDetailsUrlPost.params.chargeTokenId
        };
        res.render('submit', responseData);
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
