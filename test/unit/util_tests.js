var should = require('chai').should();
var assert = require('assert');
var util   = require(__dirname + '/../../app/utils/util.js');

describe('Asserting if variable is numeric', function () {

  it('should return true if value is a big integer', function(){
    assert.equal(true, util.isNumeric(999999999999999999));
  });

  it('should return true if value is a big decimal', function(){
    assert.equal(true, util.isNumeric(10000000000000000.00));
  });

  it('should return false if value hexadecimal', function(){
    assert.equal(false, util.isNumeric('0x1000'));
  });

  it('should return false if value is alphanumeric', function(){
    assert.equal(false, util.isNumeric('33mdsec44'));
  });

});

