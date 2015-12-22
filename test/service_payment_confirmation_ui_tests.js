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
    'formattedAmount': expectedAmountFormat,
    'paymentDescription': 'some description'
  };

  function renderSuccessPage(templateData, checkFunction) {
    renderer('success', templateData, function(htmlOutput) {
      var $ = cheerio.load(htmlOutput);
      checkFunction($);
    });
  }

  it('should render the page correctly', function(done) {
    renderSuccessPage(templateData, function($) {
      $('#amount').text().should.equal(expectedAmountFormat);
      $('#payment-reference').text().should.equal('Reference number: 100-2');
      $('#confirmation-message').text().should.equal('Your payment has been successful');
      // $('#payment-description').text().should.equal('some description');
      done();
    });
  });
});

describe('The payment error view', function(){

  var templateData = {
    'title': 'Payment error',
    'message': 'Sorry, your payment has failed. Please contact us with following reference number.',
    'paymentReference': 100 + '-' + 2,
  };

  it('should display an error message ', function(done){
    renderer('error', templateData, function(htmlOutput) {
      var $ = cheerio.load(htmlOutput);
      $('#error-msg').text().should.equal('Sorry, your payment has failed. Please contact us with following reference number.');
      $('#payment-reference').text().should.equal('100-2');
      done();
    });
  });
});
