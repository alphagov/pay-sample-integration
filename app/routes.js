require('array.prototype.find');

var response = require(__dirname + '/utils/response.js').response;

var gatewayAccountId = process.env.TEST_GATEWAY_ACCOUNT_ID;

var Client = require('node-rest-client').Client;
var client = new Client();

module.exports = {
  bind : function (app) {
    var proceedToPaymentPath = "/proceed-to-payment";
    var successPath = "/success/";

    var publicApiPaymentsPath = '/v1/payments/';
    var paymentSuccessStatus = "SUCCEEDED";

    app.get('/', function(req, res) {
      var amount = "" + Math.floor(Math.random() * 2500) + 1;
      var data = {
        'title' : 'Proceed to payment',
        'amount': amount,
        'account_id': gatewayAccountId,
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
      var successPage = process.env.DEMO_SERVER_URL + successPath + '{paymentId}';
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

      var publicApiUrl = process.env.PUBLICAPI_URL + publicApiPaymentsPath;
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

    app.get(successPath + ':paymentId', function(req, res) {
      var paymentId = req.params.paymentId;
      var publicApiUrl = process.env.PUBLICAPI_URL + publicApiPaymentsPath + paymentId;
      var args = { headers: { 'Accept' : 'application/json' } };

      client.get(publicApiUrl, args, function(data, publicApiResponse) {
        if(publicApiResponse.statusCode == 200 && data.status === paymentSuccessStatus) {
          var responseData = {
                  'formattedAmount': ("" + (data.amount/100)).currency(),
            };
            response(req, res, 'success', responseData);
            return;
        }
        response(req, res, 'error', {
          'message': 'Invalid payment.'
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
