var response = require(__dirname + '/utils/response.js').response;

module.exports = {
  bind : function (app) {
    app.get('/', function(req, res) {
      var amount = "" + Math.floor(Math.random() * 2500) + 1;
      var data = {
        'title' : 'Proceed to payment',
        'amount': amount,
        'formattedAmount': ("" + (amount/100)).currency()
      };
      res.render('paystart', data);
    });
    app.get('/greeting', function (req, res) {
      var data = {'greeting': 'Hello', 'name': 'World'};
      response(req, res, 'greeting', data);
    });

    app.get('/payment-type', function (req, res) {
      var payment = { 'serviceName': 'example service', 'amount': '12.56'};
      var paymentTypes = [ 'card', 'directdebit', 'cash'];
      var data = { 'title': 'Select how you want to pay',
                    'payment': payment,
                    'paymentTypes': paymentTypes
      };

      data.payment.serviceNameCapitalised = data.payment.serviceName.capitalise();
      data.payment.formattedAmount = data.payment.amount.currency();
      response(req, res, 'choosePaymentType', data);
    });

  }
};
