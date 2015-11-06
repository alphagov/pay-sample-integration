var response_to = require(__dirname + '/utils/test_helpers.js').response_to;
var renderer = require(__dirname + '/utils/renderer.js').renderer;
var cheerio = require('cheerio');
var assert = require('chai').assert;


describe('The payment success view', function() {
  var expectedAmountFormat = '£50.00'
  var templateData = {
    'title': 'Payment confirmation',
    'confirmationMessage': 'Your payment has been successful',
    'paymentReference': 100 + '-' + 2,
    'formattedAmount': expectedAmountFormat
  };

  function renderSuccessPage(templateData, checkFunction) {
    renderer('success', templateData, function(htmlOutput) {
      var $ = cheerio.load(htmlOutput);
      checkFunction($);
    });
  }

  it('should render the amount', function(done) {
    renderSuccessPage(templateData, function($) {
      $('.amount').text().should.equal(expectedAmountFormat);
      done();
    });
  });

  it('should render the payment reference', function(done) {
    renderSuccessPage(templateData, function($) {
      $('#payment-reference').text().should.equal('100-2');
      done();
    });
  });

  it('should render the a title', function(done) {
    renderSuccessPage(templateData, function($) {
      $('.form-title').text().should.equal('Your payment has been successful');
      done();
    });
  });
});
