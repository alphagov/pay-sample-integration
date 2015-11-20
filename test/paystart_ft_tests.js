process.env.SESSION_ENCRYPTION_KEY = "Demo Service Key";

var renderer = require(__dirname + '/utils/renderer.js').renderer;
var app = require(__dirname + '/../server.js').getApp;
var portfinder = require('portfinder');
var request = require('supertest');
var cheerio = require('cheerio');

var PAYMENT_CONFIRMATION_PATH = "/payment-confirmation/";
var INVALID_AUTH_TOKEN_MSG = "Please enter an Authorization Token";

portfinder.getPort(function (err, publicApiPort) {

    function getPaymentConfirmationWith(data) {
        return request(app).get(PAYMENT_CONFIRMATION_PATH + data);
    }

    function postToPaymentConfirmationWith(data) {
        return request(app).post(PAYMENT_CONFIRMATION_PATH)
                            .set('Accept', 'application/json')
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .send(data);
    }

    describe('Start a new payment without entering an auth token', function () {
        it('should redirect user back if authToken is missing on payment confirmation page', function (done) {
            postToPaymentConfirmationWith({})
            .expect(303)
            .expect('Location', '/?invalidAuthToken=true')
            .end(done);
        });

        it('should redirect user back to Demo Service starting page if authToken is missing', function (done) {
            getPaymentConfirmationWith('')
            .expect(303)
            .expect('Location', '/?invalidAuthToken=true')
            .end(done);
        });

        var templateData = {
            'title': 'Start a new payment',
            'proceed_to_confirmation_path': PAYMENT_CONFIRMATION_PATH,
            'invalidAuthTokenMsg': INVALID_AUTH_TOKEN_MSG
        };
        it('should display an error message', function(done){
            renderer('paystart', templateData, function(htmlOutput) {
              var $ = cheerio.load(htmlOutput);
              $('#errorMsg').text().should.equal(INVALID_AUTH_TOKEN_MSG);
              done();
            });
        });
    });

   describe('Start a new payment with an auth token', function () {
        it('should redirect user to GET /payment-confirmation page if authToken is not missing', function (done) {
            postToPaymentConfirmationWith({'authToken': '12312-312312-31231-1asd23'})
            .expect(303)
            .expect('Location', '/payment-confirmation/?authToken=12312-312312-31231-1asd23')
            .end(done);
        });

        it('should display payment-confirmation page if authToken is not missing', function (done) {
            getPaymentConfirmationWith("?authToken=12312-312312-31231-1asd23")
            .expect(200)
            .expect('Content-Type', 'text/html; charset=utf-8')
            .end(done);
        });

        var templateData = {
            'title': 'Start a new payment',
            'proceed_to_confirmation_path': PAYMENT_CONFIRMATION_PATH
        };
        it('should not display an error message ', function(done){
            renderer('paystart', templateData, function(htmlOutput) {
              var $ = cheerio.load(htmlOutput);
              $('#errorMsg').text().should.equal('');
              done();
            });
        });
    });
});