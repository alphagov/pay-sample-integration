require('array.prototype.find');
var logger = require('winston');

var response = require(__dirname + '/utils/response.js').response;

var Client = require('node-rest-client').Client;
var client = new Client();
var TOKENID_PREFIX = "t_";

module.exports = {
  bind: function (app) {
    var PAYMENT_PATH = "/proceed-to-payment";
    var SUCCESS_PATH = "/success/";
    var PUBLIC_API_PAYMENTS_PATH = '/v1/payments/';

    app.get('/', function (req, res) {
      logger.info('GET /');

      var uniqueSessionRef = TOKENID_PREFIX + randomIntNotInSession(req);
      if (req.query.authToken) {
        req.session_state[uniqueSessionRef] = req.query.authToken;
      }

      var amount = "" + Math.floor(Math.random() * 2500) + 1;
      var data = {
        'title': 'Proceed to payment',
        'amount': amount,
        'formattedAmount': ("" + (amount / 100)).currency(),
        'proceed_to_payment_path': PAYMENT_PATH,
        'token_id': uniqueSessionRef
      };
      res.render('paystart', data);
    });

    app.post(PAYMENT_PATH, function (req, res) {
      logger.info('POST ' + PAYMENT_PATH);
      var successPage = process.env.DEMO_SERVER_URL + SUCCESS_PATH + '{paymentId}';

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
      
      if (req.session_state[req.body.tokenId]) {
        paymentData.headers.Authorization = "Bearer " + req.session_state[req.body.tokenId];
      }

      var publicApiUrl = process.env.PUBLICAPI_URL + PUBLIC_API_PAYMENTS_PATH;
      client.post(publicApiUrl, paymentData, function (data, publicApiResponse) {
        if (publicApiResponse.statusCode == 201) {
          var frontendCardDetailsUrl = findLinkForRelation(data.links, 'next_url');
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

    app.get(SUCCESS_PATH + ':paymentId', function (req, res) {
      var paymentId = req.params.paymentId;
      var publicApiUrl = process.env.PUBLICAPI_URL + PUBLIC_API_PAYMENTS_PATH + paymentId;
      var args = {headers: {'Accept': 'application/json'}};

      if (req.session_state.authToken) {
        paymentData.headers.Authorization = "Bearer " + req.session_state.authToken;
      }

      client.get(publicApiUrl, args, function (data, publicApiResponse) {
        if (publicApiResponse.statusCode == 200 && data.status === "SUCCEEDED") {
          var responseData = {
            'title': 'Payment successful',
            'formattedAmount': ("" + (data.amount / 100)).currency(),
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
      return links.find(function (link) {
        return link.rel === rel;
      });
    }

    function randomIntNotInSession(req) {
      var theInt = -1;
      while (theInt < 0) {
        theInt = Math.floor(Math.random() * (1000 - 1) + 1);
        if (req.session_state[TOKENID_PREFIX + theInt]) {
          theInt = -1;
        }
      }
      return theInt;
    }

  }
};
