var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

portfinder.getPort(function (err, publicApiPort) {
    var publicApiMockUrl = 'http://localhost:' + publicApiPort;
    var chargeId = '23144323';
    var publicApiGetPaymentsUrl = '/v1/payments/' + chargeId;
    var publicApiMock = nock(publicApiMockUrl);

    var successPath = "/success/" + chargeId;

    function whenPublicApiReceivesGetPayment() {
        return publicApiMock.matchHeader('Accept', 'application/json')
                            .get(publicApiGetPaymentsUrl);
    }

    function getSuccessPageResponse() {
        return request(app).get(successPath)
                           .set('Accept', 'application/json');
    }

    describe('Payment workflow complete', function () {
        it('should show a success page when payment captured', function (done) {
            process.env.PUBLICAPI_URL = publicApiMockUrl;
            var amount = 3454;

            whenPublicApiReceivesGetPayment()
                .reply(200, {
                    'payment_id': chargeId,
                    'amount': amount,
                    'status': 'SUCCEEDED',
                    'return_url': 'http://not.used.in/this/test',
                    'links': [ {
                                'href': 'http://also.irrelevant.com/',
                                'rel': 'self',
                                'method': 'GET'
                            } ]
                    }, {
                        'Content-Type': 'application/json'
                    }
                );

            getSuccessPageResponse()
                .expect(200, {
                    'title': 'Payment successful',
                    'formattedAmount': '£34.54'
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(done);
        });
    });

    describe('Payment workflow error', function () {
        it('should show an error page when payment-id invalid', function (done) {
            process.env.PUBLICAPI_URL = publicApiMockUrl;

            whenPublicApiReceivesGetPayment()
                .reply(404, { 'message': 'some backend error' },
                            { 'Content-Type': 'application/json' }
            );

            getSuccessPageResponse()
                .expect(200, {
                    'message': 'Invalid payment.'
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(done);
        });

        it('should show an error page when status not "SUCCEEDED"', function (done) {
            process.env.PUBLICAPI_URL = publicApiMockUrl;
            var amount = 3454;

            whenPublicApiReceivesGetPayment()
                .reply(200, {
                    'payment_id': chargeId,
                    'amount': amount,
                    'status': 'BLA_BLA',
                    'return_url': 'http://not.used.in/this/test',
                    'links': [ {
                                'href': 'http://also.irrelevant.com/',
                                'rel': 'self',
                                'method': 'GET'
                            } ]
                    }, {
                        'Content-Type': 'application/json'
                    }
                );

            getSuccessPageResponse()
                .expect(200, {
                    'message': 'Invalid payment.'
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(done);
        });
    });
});