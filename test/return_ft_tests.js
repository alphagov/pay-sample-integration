process.env.SESSION_ENCRYPTION_KEY = "secret";

var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

var clientSessions = require("client-sessions");
var sessionConfig = {
  'cookieName': 'state',
  'secret':     process.env.SESSION_ENCRYPTION_KEY
};

portfinder.getPort(function (err, payApiPort) {
    var payApiMockUrl = 'http://localhost:' + payApiPort;
    var chargeReferenceId = 98765;
    var paymentId = '112233';
    var payApiGetPaymentsUrl = '/v1/payments/' + paymentId;
    var payApiMock = nock(payApiMockUrl);

    var completedPath = "/return/" + chargeReferenceId;

    function whenPayApiReceivesGetPayment() {
        return payApiMock.matchHeader('Accept', 'application/json')
                            .get(payApiGetPaymentsUrl);
    }

    function getReturnPageResponse() {
      var sessionData = {};
      sessionData[chargeReferenceId] = { 'at': 'a-auth-token', 'pid' : paymentId };

      var encryptedSession = clientSessions.util.encode(sessionConfig, sessionData);

        return request(app).get(completedPath)
          .set('Cookie','state=' + encryptedSession)
          .set('Accept', 'application/json');
    }

    describe('Payment workflow complete', function () {
        it('should show a success page when payment captured', function (done) {
            process.env.PAY_API_URL = payApiMockUrl;
            var amount = 3454;

            whenPayApiReceivesGetPayment()
                .reply(200, {
                    'payment_id': paymentId,
                    'amount': amount,
                    'reference': 'Test reference',
                    'description': 'Test description',
                    'state': {
                      'status' : 'confirmed',
                      'finished': true
                    },
                    'return_url': 'http://not.used.in/this/'+ chargeReferenceId,
                    'links': [ {
                                'href': 'http://also.irrelevant.com/',
                                'rel': 'self',
                                'method': 'GET'
                            } ]
                    }, {
                        'Content-Type': 'application/json'
                    }
                );

            getReturnPageResponse()
                .expect(200, {
                    'title': 'Payment confirmation',
                    'confirmationMessage': 'Your payment has been successful',
                    'paymentReference': 'Test reference',
                    'paymentDescription': 'Test description',
                    'formattedAmount': '£34.54'
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(done);
        });
    });

    describe('Payment workflow error', function () {
        it('should show an error page when payment-id invalid', function (done) {
            process.env.PAY_API_URL = payApiMockUrl;

            whenPayApiReceivesGetPayment()
                .reply(404, { 'message': 'some backend error' },
                            { 'Content-Type': 'application/json' }
            );

            getReturnPageResponse()
                .expect(200, {
                    'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
                    'paymentReference': chargeReferenceId + '-' + paymentId
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(done);
        });

        it('should show an error page when status not "confirmed"', function (done) {
            process.env.PAY_API_URL = payApiMockUrl;
            var amount = 3454;

            whenPayApiReceivesGetPayment()
                .reply(200, {
                    'payment_id': paymentId,
                    'amount': amount,
                    'state': {
                      'status' : 'failed',
                      'finished': true
                    },
                    'return_url': 'http://not.used.in/this/2324523',
                    'links': [ {
                                'href': 'http://also.irrelevant.com/',
                                'rel': 'self',
                                'method': 'GET'
                            } ]
                    }, {
                        'Content-Type': 'application/json'
                    }
                );

            getReturnPageResponse()
                .expect(200, {
                  'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
                  'paymentReference': chargeReferenceId + '-' + paymentId
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(done);
        });
    });
});
