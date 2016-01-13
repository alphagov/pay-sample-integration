process.env.SESSION_ENCRYPTION_KEY = "secret";

var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

// session mocking
var clientSessions = require("client-sessions");
var sessionConfig = {
  'cookieName': 'state',
  'secret':     process.env.SESSION_ENCRYPTION_KEY
};

portfinder.getPort(function (err, payApiPort) {
    var payApiMockUrl = 'http://localhost:' + payApiPort;
    var paymentId = '23144323';
    var paymentReference = '54321';
    var frontendCardDetailsPath = '/charge/' + paymentId;
    var payApiPaymentsUrl = '/v1/payments/';
    var payApiMock = nock(payApiMockUrl);

    function whenPayApiReceivesPost(data, token) {
        return payApiMock.matchHeader('Content-Type', 'application/json')
                            .matchHeader('Authorization', 'Bearer ' + token)
                            .post(payApiPaymentsUrl, data);
    }

    function postProceedResponseWith(data, token) {
        var sessionData = {};
        sessionData[data.paymentReference] = { 'at': token };
        var encryptedSession = clientSessions.util.encode(sessionConfig, sessionData);

        return request(app).post('/proceed-to-payment')
                           .set('Accept', 'application/json')
                           .set('Cookie','state=' + encryptedSession)
                           .send(data);
    }

    describe('Proceed to payment failures', function () {
        it('should error if gateway account is invalid', function (done) {
            var localServerUrl = 'http://this.server.url:3000';
            var description = 'payment description for failure';

            process.env.PAY_API_URL = payApiMockUrl;
            process.env.SERVICE_URL = localServerUrl;

            whenPayApiReceivesPost({
                'amount': 4000,
                'description': description,
                'return_url': localServerUrl + '/return/' + paymentReference
            }, '12345-67890-12345-67890').reply( 400, {
                'message': 'Unknown gateway account: 11111'
            });

            postProceedResponseWith( {
                    'amount': '4000',
                    'description': description,
                    'paymentReference': paymentReference
            }, '12345-67890-12345-67890').expect(400, {
                'message': 'Sample service failed to create charge'
            }).end(done);
        });

        it('should error if authorization token is invalid', function (done) {
            var localServerUrl = 'http://this.server.url:3000';
            var description = 'payment description for failure';

            process.env.PUBLICAPI_URL = payApiMockUrl;
            process.env.SERVICE_URL = localServerUrl;

            whenPayApiReceivesPost({
                'amount': 4000,
                'description': description,
                'return_url': localServerUrl + '/return/' + paymentReference
            }, '12345-67890-12345-67890').reply(401, {
                'message': 'Credentials are required to access this resource.'
            });

            postProceedResponseWith( {
                    'amount': '4000',
                    'description': description,
                    'paymentReference': paymentReference
            }, '12345-67890-12345-67890').expect(401, {
                'message': 'Credentials are required to access this resource'
            }).end(done);
        });
    });

    describe('Proceed payment scenario', function () {
        it('should respond with redirect URL for payment card capture view', function (done) {
            var localServerUrl = 'http://this.server.url:3000';
            var description = 'payment description for success';

            process.env.PAY_API_URL = payApiMockUrl;
            process.env.SERVICE_URL = localServerUrl;

            whenPayApiReceivesPost( {
                'amount': 5000,
                'description': description,
                'return_url': localServerUrl + '/return/' + paymentReference
            },'12345-67890-12345-67890').reply( 201, {
                    'links': [ {
                        'href': frontendCardDetailsPath,
                        'rel': 'next_url',
                        'method': 'GET'
                      } ],
                    'payment_id': "paymentId1234567890",
                    });

            postProceedResponseWith( {
                'description': description,
                'amount': '5000',
                'paymentReference': paymentReference
            },'12345-67890-12345-67890').expect('Location', frontendCardDetailsPath)
              .expect(303)
              .end(done);
        });
    });
});
