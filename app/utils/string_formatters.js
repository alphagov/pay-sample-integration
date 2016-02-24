var Price = require('format-price');

String.prototype.capitalise = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.currency = function() {
  return Price.format('en-GB', 'GBP', this);
};
