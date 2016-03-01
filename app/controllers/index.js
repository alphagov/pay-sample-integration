var controllers = [
  require('./root_controller'),
  require('./proceed_controller'),
  require('./pay_controller'),
  require('./return_controller')
];

module.exports.bindRoutesTo = (app) => {
  controllers.forEach( (controller) => controller.bindRoutesTo(app) );
};
