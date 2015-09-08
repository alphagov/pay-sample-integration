var response_to = require(__dirname + '/utils/test_helpers.js').response_to;
var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

portfinder.getPort(function(err, publicApiPort) {
  var localServer = 'http://localhost:' + publicApiPort;
  var chargeId = '23144323';
  var frontendCardDetailsPath = '/charge/' + chargeId;
  var publicApiPaymentsUrl = '/v1/payments';
  var publicApiMock = nock(localServer);

  process.env.PUBLICAPI_URL = localServer;

  describe('Proceed payment scenario', function () {
      it('should respond with redirect URL for payment card capture view',function (done) {
             publicApiMock
                .post(
                    publicApiPaymentsUrl,
                    {
                        'amount': 5000,
                        'gateway_account_id': '12345'
                    },
                    {
                        'Content-Type': 'application/json'
                    }
                ).reply(
                    201,
                    {
                        'links': [
                            {
                                'href': frontendCardDetailsPath,
                                'rel' : 'next_url',
                                'method' : 'GET'
                            }
                        ]
                    },
                    {
                        'Content-Type': 'application/json'
                    }
                );

                request(app)
                    .post('/proceed-to-payment')
                    .send({
                       'amount': '5000',
                       'gatewayAccountId': '12345'
                    })
                    .expect('Location', frontendCardDetailsPath)
                    .expect(303)
                    .end(done);
      });
  });
});
