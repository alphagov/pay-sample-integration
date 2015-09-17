var renderer = require(__dirname + '/utils/renderer.js').renderer;
var cheerio = require('cheerio');
var assert = require('chai').assert;


describe('The payment success view', function() {
  var expectedAmountFormat = '£50.00'
  var templateData = {
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

  it('should render the example service name', function(done) {
    renderSuccessPage(templateData, function($) {
      $('#service-name').text().should.equal('Example Service');
      done();
    });
  });
});
