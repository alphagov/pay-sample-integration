var api = require(__dirname + '/../utils/api.js');
var response = require(__dirname + '/../utils/response.js').response;

module.exports.bindRoutesTo = (app) => {
  var PAY_PATH = "/pay";
  var SERVICE_PATH = "/proceed/";
  
  app.get(SERVICE_PATH, (req, res) => {
    var data = {
      'auth_token': api.getKey(req),
      'proceed_to_payment_path': PAY_PATH
    };
    
    res.render('proceed', data);
  });
}