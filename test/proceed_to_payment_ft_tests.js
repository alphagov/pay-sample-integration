process.env.SESSION_ENCRYPTION_KEY = "Demo Service Key";

var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

// session mocking
var AUTH_TOKEN_PREFIX = "t_";
var clientSessions = require("client-sessions");
var sessionConfig = {
  'cookieName': 'demoservice_state',
  'secret':     process.env.SESSION_ENCRYPTION_KEY
};

portfinder.getPort(function (err, publicApiPort) {
    var publicApiMockUrl = 'http://localhost:' + publicApiPort;
    var chargeId = '23144323';
    var paymentReference = '54321';
    var frontendCardDetailsPath = '/charge/' + chargeId;
    var publicApiPaymentsUrl = '/v1/payments/';
    var publicApiMock = nock(publicApiMockUrl);

    function whenPublicApiReceivesPost(data, token) {
        return publicApiMock.matchHeader('Content-Type', 'application/json')
                            .matchHeader('Authorization', 'Bearer ' + token)
                            .post(publicApiPaymentsUrl, data);
    }

    function postProceedResponseWith(data, token) {
        var sessionData = {};
        sessionData[AUTH_TOKEN_PREFIX + data.paymentReference] = token;
        var encryptedSession = clientSessions.util.encode(sessionConfig, sessionData);

        return request(app).post('/proceed-to-payment')
                           .set('Accept', 'application/json')
                           .set('Cookie','demoservice_state=' + encryptedSession)
                           .send(data);
    }

    describe('Proceed to payment failures', function () {
        it('should error if gateway account is invalid', function (done) {
            var localServerUrl = 'http://this.server.url:3000';
            var description = 'payment description for failure';

            process.env.PUBLICAPI_URL = publicApiMockUrl;
            process.env.DEMOSERVICE_PAYSTART_URL = localServerUrl;

            whenPublicApiReceivesPost({
                'amount': 4000,
                'description': description,
                'return_url': localServerUrl + '/success/' + paymentReference
            }, '12345-67890-12345-67890').reply( 400, {
                'message': 'Unknown gateway account: 11111'
            });

            postProceedResponseWith( {
                    'amount': '4000',
                    'description': description,
                    'paymentReference': paymentReference
            }, '12345-67890-12345-67890').expect(400, {
                'message': 'Demo service failed to create charge'
            }).end(done);
        });

        it('should error if authorization token is invalid', function (done) {
            var localServerUrl = 'http://this.server.url:3000';
            var description = 'payment description for failure';

            process.env.PUBLICAPI_URL = publicApiMockUrl;
            process.env.DEMOSERVICE_PAYSTART_URL = localServerUrl;

            whenPublicApiReceivesPost({
                'amount': 4000,
                'description': description,
                'return_url': localServerUrl + '/success/' + paymentReference
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

            process.env.PUBLICAPI_URL = publicApiMockUrl;
            process.env.DEMOSERVICE_PAYSTART_URL = localServerUrl;

            whenPublicApiReceivesPost( {
                'amount': 5000,
                'description': description,
                'return_url': localServerUrl + '/success/' + paymentReference
            },'12345-67890-12345-67890').reply( 201, {
                    'links': [ {
                        'href': frontendCardDetailsPath,
                        'rel': 'next_url',
                        'method': 'GET'
                        } ]
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
