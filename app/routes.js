var controllers = require('./controllers');

module.exports.bind = function (app) {
  controllers.bindRoutesTo(app);
};
