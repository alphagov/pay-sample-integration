var response_to = require(__dirname + '/utils/test_helpers.js').response_to;
var renderer = require(__dirname + '/utils/renderer.js').renderer;
var cheerio = require('cheerio');
var assert = require('chai').assert;
var _ = require('lodash');


describe('Proceed view', function () {
  var templateData = {
    'auth_token': '12345-67890-12345-67890',
    'proceed_to_payment_path': '/pay',
    'lastPayment': {
      'paymentId': '112233',
      'description': 'Test description',
      'reference': 'Test reference',
      'amount': '£34.54'
    }
  };

  function renderSuccessPage(templateData, checkFunction) {
    renderer('proceed', templateData, function (htmlOutput) {
      var $ = cheerio.load(htmlOutput);
      checkFunction($);
    });
  }

  describe('when lastPayment.next_url is not available in the template data', function () {
    it('should render the page without showing the last payment details', function (done) {
      renderSuccessPage(templateData, function ($) {
        $('#last-payment-reference').length.should.equal(0);
        $('#last-payment-description').length.should.equal(0);
        $('#last-payment-amount').length.should.equal(0);
        $('#last-payment-resume').length.should.equal(0);
        done();
      });
    });
  });

  describe('when lastPayment.next_url is available in the template data', function () {
    it('should render the page showing the last payment details', function (done) {

      templateData.lastPayment['next_url'] = 'http://next.url';

      renderSuccessPage(templateData, function ($) {
        $('#last-payment-reference').text().should.equal('Test reference');
        $('#last-payment-description').text().should.equal('Test description');
        $('#last-payment-amount').text().should.equal('£34.54');
        $('#last-payment-resume').length.should.equal(1);
        done();
      });
    });
  });
})
;
