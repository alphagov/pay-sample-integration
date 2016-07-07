process.env.SESSION_ENCRYPTION_KEY = "secret";

var app = require(__dirname + '/../server.js').getApp;
var http = require('http');
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');
var cheerio = require('cheerio');

portfinder.getPort(function (err, payApiPort) {
    var payApiMockUrl = 'http://localhost:' + payApiPort;
    var paymentId = '23144323';
    var paymentReference = '54321';
    var frontendCardDetailsPath = '/charge/' + paymentId;
    var payApiPaymentsUrl = '/v1/payments';
    var payApiMock = nock(payApiMockUrl);

    function withTestAppServer(done) {
        var server = http.createServer(app);
        server.listen(function() {
          done(server);
        });
    }

    function whenPayApiReceivesPost(data, token) {
        return payApiMock.matchHeader('Content-Type', 'application/json')
                            .matchHeader('Authorization', 'Bearer ' + token)
                            .post(payApiPaymentsUrl, data);
    }

    function postProceedResponseWith(testServer, data, token) {
        process.env.PAY_API_KEY = token;
        return request(testServer).post('/pay')
                           .set('Accept', 'application/json')
                           .send(data);
    }

    describe('Proceed to payment failures', function () {
        it('should error if gateway account is invalid', function (done) {
            withTestAppServer(function(server) {
              var localServerUrl = 'http://127.0.0.1:' + server.address().port;
              var description = 'payment description for failure';
              process.env.PAY_API_URL = payApiMockUrl;

              whenPayApiReceivesPost({
                  'amount': 4000,
                  'description': description,
                  'reference': paymentReference,
                  'return_url': localServerUrl + '/return/' + paymentReference
              }, '12345-67890-12345-67890').reply( 400, {
                  'message': 'Unknown gateway account: 11111'
              });

              postProceedResponseWith(server, {
                      'amount': 4000,
                      'description': description,
                      'reference': paymentReference
              }, '12345-67890-12345-67890').expect(400, {
                  'message': 'Sample service failed to create charge'
              }).end(done);
            });
        });

        it('should error if authorization token is invalid', function (done) {
            withTestAppServer(function(server) {
              var localServerUrl = 'http://127.0.0.1:' + server.address().port;
              var description = 'payment description for failure';
              process.env.PAY_API_URL = payApiMockUrl;
              
              whenPayApiReceivesPost({
                  'amount': 4000,
                  'description': description,
                  'reference': paymentReference,
                  'return_url': localServerUrl + '/return/' + paymentReference
              }, '12345-67890-12345-67890').reply(401, {
                  'message': 'Credentials are required to access this resource.'
              });
              
              postProceedResponseWith(server, {
                      'amount': 4000,
                      'description': description,
                      'reference': paymentReference
              }, '12345-67890-12345-67890').expect(401, {
                  'message': 'Credentials are required to access this resource'
              }).end(done);
            });
        });
    });

    describe('Proceed payment scenario', function () {
        it('should respond with Proceed page when payment is created', function (done) {
            withTestAppServer(function(server) {
                var localServerUrl = 'http://127.0.0.1:' + server.address().port;
                var description = 'payment description for success';
                var tokenId = 'this-is-an-ott-to-pay';
                process.env.PAY_API_URL = payApiMockUrl;

                whenPayApiReceivesPost({
                    'amount': 5000,
                    'description': description,
                    'reference': paymentReference,
                    'return_url': localServerUrl + '/return/' + paymentReference
                }, '12345-67890-12345-67890').reply(201, {
                    'amount': 5000,
                    'description': description,
                    'reference': paymentReference,
                    '_links': {
                        "next_url_post": {
                            'href': frontendCardDetailsPath,
                            'method': 'POST',
                            'params': { 
                                'chargeTokenId': tokenId
                            }
                        },
                        'payment_id': "paymentId1234567890"
                    }
                });

                postProceedResponseWith(server, {
                    'description': description,
                    'amount': 5000,
                    'reference': paymentReference,
                    'integration': 'POST'
                },'12345-67890-12345-67890')
                    .expect(200)
                    .expect('Content-Type', 'text/html; charset=utf-8')
                    .expect(function(res) {
                        var $ = cheerio.load(res.text);
                        $('#payment-description').text().should.equal(description);
                        $('#payment-reference').text().should.equal(paymentReference);
                        $('#submit-payment-form').attr('action').should.equal(frontendCardDetailsPath);
                        $('#charge-token-id').val().should.equal(tokenId);
                        $('#amount').text().should.equal('£50.00');
                    })
                    .end(done);
            });
        });
    });
});
