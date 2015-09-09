require('array.prototype.find');

var response = require(__dirname + '/utils/response.js').response;

var gatewayAccountId = process.env.TEST_GATEWAY_ACCOUNT_ID;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports = {
  bind : function (app) {
    var proceedToPaymentPath = "/proceed-to-payment";

    app.get('/', function(req, res) {
      var amount = "" + Math.floor(Math.random() * 2500) + 1;
      var data = {
        'title' : 'Proceed to payment',
        'amount': amount,
        'gateway_account_id': gatewayAccountId,
        'formattedAmount': ("" + (amount/100)).currency(),
        'proceed_to_payment_path' : proceedToPaymentPath
      };
      res.render('paystart', data);
    });

    app.get('/greeting', function (req, res) {
      var data = {'greeting': 'Hello', 'name': 'World'};
      response(req, res, 'greeting', data);
    });

    app.post(proceedToPaymentPath, function (req, res) {
      var publicApiUrl = process.env.PUBLICAPI_URL + '/v1/payments';

      var paymentData = {
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          'amount': parseInt(req.body.amount),
          'gateway_account_id': req.body.gatewayAccountId
        }
      };

      client.post(publicApiUrl, paymentData, function(data, publicApiResponse) {
        if(publicApiResponse.statusCode == 201) {
          var frontendCardDetailsUrl = findLinkForRelation(data.links, 'next_url');
          res.redirect(303, frontendCardDetailsUrl.href);
          return;
        }

        res.statusCode = 400;
        response(req, res, 'error', {
          'message': 'Example service failed to create charge'
        });
      });
    });

    function findLinkForRelation(links, rel) {
      return links.find(function(link) {
        return link.rel === rel;
      });
    }
  }
};
