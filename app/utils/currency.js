var formatPrice = require('format-price').format;

var format = function (amount) {
  return formatPrice('en-GB', 'GBP', `${ (amount || 0) / 100 } `);
}


module.exports = {
  format: format
};
