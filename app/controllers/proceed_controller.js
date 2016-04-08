var logger = require('winston');
var _ = require('lodash');
var api = require(__dirname + '/../utils/api.js');
var response = require(__dirname + '/../utils/response.js').response;
var currency = require(__dirname + '/../utils/currency.js');
var Client = require('node-rest-client').Client;
var client = new Client();
var response = require(__dirname + '/../utils/response.js').response;

module.exports.bindRoutesTo = (app) => {
  var PAY_PATH = "/pay";
  var PROCEED_PATH = "/proceed/";
  var PAY_API_PAYMENTS_PATH = '/v1/payments/';

  app.get(PROCEED_PATH, (req, res) => {
    var PAY_API_URL = api.getUrl(req) + PAY_API_PAYMENTS_PATH;

    function getPayment(paymentId, callback) {
      var paymentRequest = {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + api.getKey(req)
        }
      };

      client.get(PAY_API_URL + paymentId, paymentRequest, (data, response) => {

        if (response.statusCode == 200) {
          callback({
            paymentId: data.payment_id,
            description: data.description,
            reference: data.reference,
            amount: currency.format(data.amount),
            next_url: _.get(data, '_links.next_url.href')
          });
          return;
        }

        logger.error('Cannot retrieve payment information for payment id: ' + paymentId);
        callback();
      });
    }

    var data = {
      'auth_token': api.getKey(req),
      'proceed_to_payment_path': PAY_PATH
    };

    var lastPaymentId = _.get(req.state, 'lastPayment.payment_id');

    if (lastPaymentId) {
      getPayment(lastPaymentId, (lastPayment) => {
        response(req, res, 'proceed', _.extend(data, {lastPayment: lastPayment}));
      });
    } else {
      response(req, res, 'proceed', data);
    }
  });
};