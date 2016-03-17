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
    renderer('return', templateData, function(htmlOutput) {
      var $ = cheerio.load(htmlOutput);
      checkFunction($);
    });
  }

  it('should render the page correctly', function(done) {
    renderSuccessPage(templateData, function($) {
      $('#amount').text().should.equal(expectedAmountFormat);
      $('#payment-reference').text().should.equal('100-2');
      $('#confirmation-message').text().should.equal('Your payment has been successful');
      $('#payment-description').text().should.equal('some description');
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

describe('The sample service', function(){

  var templateData = {
    'auth_token': '7430b010-4dcc-412e-bd77-a19377bc8e30',
    'reference': 'test-reference',
    'description': 'test-description',
    'proceed_to_payment_path': '/pay',
    'invalidAmountMsg': 'Invalid amount value. Only integer values allowed'
  };

  it('should validate the amount value ', function(done){
    renderer('proceed', templateData, function(htmlOutput) {
      var $ = cheerio.load(htmlOutput);
      $('#error-msg').text().should.equal('Invalid amount value. Only integer values allowed');
      $('#description').val().should.equal('test-description');
      $('#reference').val().should.equal('test-reference');
      done();
    });
  });
});
