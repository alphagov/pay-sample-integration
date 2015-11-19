process.env.SESSION_ENCRYPTION_KEY = "Demo Service Key";

var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

portfinder.getPort(function (err, publicApiPort) {
    var publicApiMockUrl = 'http://localhost:' + publicApiPort;
    var chargeId = '23144323';
    var paymentReference = '54321';
    var frontendCardDetailsPath = '/charge/' + chargeId;
    var publicApiPaymentsUrl = '/v1/payments/';
    var publicApiMock = nock(publicApiMockUrl);

    function whenPublicApiReceivesPost(data) {
        return publicApiMock.matchHeader('Content-Type', 'application/json')
                            .post(publicApiPaymentsUrl, data);
    }

    function postProceedResponseWith(data) {
        return request(app).post('/proceed-to-payment')
                           .set('Accept', 'application/json')
                           .send(data);
    }

    describe('Proceed to payment failures', function () {
        it('should error if gateway account is invalid', function (done) {
            var localServerUrl = 'http://this.server.url:3000';
            var description = 'payment description for failure';

            process.env.PUBLICAPI_URL = publicApiMockUrl;
            process.env.DEMO_SERVER_URL = localServerUrl;

            whenPublicApiReceivesPost({
                'amount': 4000,
                'description': description,
                'return_url': localServerUrl + '/success/' + paymentReference
            }).reply( 400, {
                'message': 'Unknown gateway account: 11111'
            }, {
                'Content-Type': 'application/json'
            });

            postProceedResponseWith( {
                    'amount': '4000',
                    'description': description,
                    'paymentReference': paymentReference
            }).expect(400, {
                'message': 'Demo service failed to create charge'
            }, {
                'Content-Type': 'application/json'
            }).end(done);
        });

    });

    describe('Proceed payment scenario', function () {
        it('should respond with redirect URL for payment card capture view', function (done) {
            var localServerUrl = 'http://this.server.url:3000';
            var description = 'payment description for success';

            process.env.PUBLICAPI_URL = publicApiMockUrl;
            process.env.DEMO_SERVER_URL = localServerUrl;

            whenPublicApiReceivesPost( {
                'amount': 5000,
                'description': description,
                'return_url': localServerUrl + '/success/' + paymentReference
            }).reply( 201, {
                    'links': [ {
                        'href': frontendCardDetailsPath,
                        'rel': 'next_url',
                        'method': 'GET'
                        } ]
                    }, {
                        'Content-Type': 'application/json'
                    }
                );

            postProceedResponseWith( {
                'description': description,
                'amount': '5000',
                'paymentReference': paymentReference
            }).expect('Location', frontendCardDetailsPath)
              .expect(303)
              .end(done);
        });
    });
});