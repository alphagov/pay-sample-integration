process.env.SESSION_ENCRYPTION_KEY = "secret";

var app = require(__dirname + '/../server.js').getApp;
var request = require('supertest');
var nock = require('nock');
var portfinder = require('portfinder');

var _ = require('lodash');

var clientSessions = require("client-sessions");
var sessionConfig = {
  'cookieName': 'state',
  'secret': process.env.SESSION_ENCRYPTION_KEY
};

portfinder.getPort(function (err, payApiPort) {
  var payApiMockUrl = 'http://localhost:' + payApiPort;
  var chargeReferenceId = 98765;
  var paymentId = '112233';
  var payApiGetPaymentsUrl = '/v1/payments/' + paymentId;
  var payApiMock = nock(payApiMockUrl);

  var completedPath = "/proceed";

  function whenPayApiReceivesGetPayment() {
    return payApiMock.matchHeader('Accept', 'application/json')
      .get(payApiGetPaymentsUrl);
  }

  function getProceedPageResponse(extendedSessionData) {
    var sessionData = {};
    sessionData[chargeReferenceId] = {'at': 'a-auth-token', 'pid': paymentId};
    _.extend(sessionData, extendedSessionData);
    var encryptedSession = clientSessions.util.encode(sessionConfig, sessionData);

    return request(app).get(completedPath)
      .set('Cookie', 'state=' + encryptedSession)
      .set('Accept', 'application/json');
  }

  describe('Proceed page', function () {

    before(function() {
      process.env.PAY_API_URL = payApiMockUrl;
    })

    it('should show the last payment resumable', function (done) {
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
          'return_url': 'http://not.used.in/this/' + chargeReferenceId,
          '_links': {
            "self": {
              'href': 'http://also.irrelevant.com/',
              'rel': 'self',
              'method': 'GET'
            },
            "next_url": {
              "href": "http://next.url",
              "method": "GET"
            }
          }
        }, {
          'Content-Type': 'application/json'
        }
      );

      var extendedSessionData = {'lastPayment': {'payment_id': paymentId}};
      getProceedPageResponse(extendedSessionData)
        .expect(200, {
          'auth_token': '12345-67890-12345-67890',
          'proceed_to_payment_path': '/pay',
          "lastPayment": {
            'paymentId': '112233',
            'description': 'Test description',
            'reference': 'Test reference',
            'amount': '£34.54',
            'next_url': 'http://next.url'
          }
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(done);
    });

    it('should not show the last payment when the last payment data cannot be retrieved', function (done) {
      whenPayApiReceivesGetPayment()
        .reply(400);

      var extendedSessionData = {'lastPayment': {'payment_id': paymentId}};
      getProceedPageResponse(extendedSessionData)
        .expect(200, {
          'auth_token': '12345-67890-12345-67890',
          'proceed_to_payment_path': '/pay'
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(done);
    });

    it('should not show the last payment when no payment has been made yet', function (done) {
      whenPayApiReceivesGetPayment()
        .reply(400);

      getProceedPageResponse()
        .expect(200, {
          'auth_token': '12345-67890-12345-67890',
          'proceed_to_payment_path': '/pay'
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(done);
    });
  });
});
