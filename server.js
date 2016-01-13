var express = require('express');
var initialize = require('express-init');
var path = require('path');
var favicon = require('serve-favicon');
var Price = require('format-price');
var routes = require(__dirname + '/app/routes.js');
var bodyParser = require('body-parser');
var express_enforces_ssl = require('express-enforces-ssl');
var helmet = require('helmet');
var port = (process.env.PORT || 3000);
var app = express();
var morgan = require('morgan')

var clientSessions = require("client-sessions");

app.engine('html', require(__dirname + '/lib/template-engine.js').__express);
app.set('view engine', 'html');
app.set('vendorViews', __dirname + '/govuk_modules/govuk_template/views/layouts');
app.set('views', __dirname + '/app/views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if(process.env.NODE_ENV == 'production') {
  app.enable('trust proxy');
  app.use(express_enforces_ssl()); //https 301 redirection
  app.use(helmet()); //order agent to stick to https
}

app.use('/public/javascripts', express.static(__dirname + '/public/assets/javascripts'));

app.use('/public', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_template/assets'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
app.use(favicon(path.join(__dirname, 'govuk_modules', 'govuk_template', 'assets', 'images','favicon.ico')));
app.use(function (req, res, next) {
  res.locals.assetPath = '/public/';
  next();
});

app.use(morgan(':method :url :status :res[location] :res[content-length] :response-time'))

app.use(clientSessions({
  cookieName: "state",
  secret: "secret"
}));


// Set up initialization middleware
var initMiddleware = function (req, res, next) {
  next();
};
initMiddleware.init = function(app, callback) {

  String.prototype.capitalise = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  String.prototype.currency = function() {
    return Price.format('en-GB', 'GBP', this);
  };

  callback();
};
app.use(initMiddleware);

routes.bind(app);

initialize(app, function(err) {
  if (err)
    throw new Error(err);

  app.listen(port);
  console.log('');
  console.log('Listening on port ' + port);
  console.log('');

});

module.exports.getApp = app;
