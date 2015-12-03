process.env.SESSION_ENCRYPTION_KEY = "Demo Service Key";

var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

var clientSessions = require("client-sessions");
var sessionConfig = {
  'cookieName': 'demoservice_state',
  'secret':     process.env.SESSION_ENCRYPTION_KEY
};

portfinder.getPort(function (err, publicApiPort) {
    var publicApiMockUrl = 'http://localhost:' + publicApiPort;
    var chargeReferenceId = 98765;
    var chargeId = '112233';
    var publicApiGetPaymentsUrl = '/v1/payments/' + chargeId;
    var publicApiMock = nock(publicApiMockUrl);

    var successPath = "/success/" + chargeReferenceId;

    function whenPublicApiReceivesGetPayment() {
        return publicApiMock.matchHeader('Accept', 'application/json')
                            .get(publicApiGetPaymentsUrl);
    }

    function getSuccessPageResponse() {
      var sessionData = {};
      sessionData['t_'+chargeReferenceId] = 'a-auth-token';
      sessionData['c_'+chargeReferenceId] = chargeId;

      var encryptedSession = clientSessions.util.encode(sessionConfig, sessionData);

        return request(app).get(successPath)
          .set('Cookie','demoservice_state=' + encryptedSession)
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
                    'reference': 'Test reference',
                    'description': 'Test description',
                    'status': 'SUCCEEDED',
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

            getSuccessPageResponse()
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
            process.env.PUBLICAPI_URL = publicApiMockUrl;

            whenPublicApiReceivesGetPayment()
                .reply(404, { 'message': 'some backend error' },
                            { 'Content-Type': 'application/json' }
            );

            getSuccessPageResponse()
                .expect(200, {
                    'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
                    'paymentReference': chargeReferenceId + '-' + chargeId
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

            getSuccessPageResponse()
                .expect(200, {
                  'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
                  'paymentReference': chargeReferenceId + '-' + chargeId
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .end(done);
        });
    });
});