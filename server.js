var express = require('express');
var initialize = require('express-init');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var express_enforces_ssl = require('express-enforces-ssl');
var helmet = require('helmet');
var port = (process.env.PORT || 3000);
var app = express();
var morgan = require('morgan')
var clientSessions = require("client-sessions");
const nunjucks = require('nunjucks')

var routes = require(__dirname + '/app/routes.js');

const nunjucksEnvironment = nunjucks.configure([
  path.join(__dirname + '/govuk_modules/govuk_template/views/layouts'),
  path.join(__dirname, '/app/views')
], {
  express: app, // the express app that nunjucks should install to
  autoescape: true, // controls if output with dangerous characters are escaped automatically
  throwOnUndefined: false, // throw errors when outputting a null/undefined value
  trimBlocks: true, // automatically remove trailing newlines from a block/tag
  lstripBlocks: true // automatically remove leading whitespace from a block/tag
})

// Set view engine
app.set('view engine', 'njk')

app.use(morgan(':method :url :status :res[location] :res[content-length] :response-time'))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV == 'production') {
  app.enable('trust proxy');
  app.use(express_enforces_ssl()); // https 301 redirection
  app.use(helmet()); // order agent to stick to https
}

app.use('/public/javascripts', express.static(__dirname + '/public/assets/javascripts'));
app.use('/public', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_template/assets'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
app.use(favicon(path.join(__dirname, 'govuk_modules', 'govuk_template', 'assets', 'images','favicon.ico')));
app.use(function (req, res, next) {
  res.locals.asset_path = '/public/';
  next();
});

app.use(clientSessions({
  cookieName: "state",
  secret: "secret"
}));

routes.bind(app);

initialize(app, function(err) {
  if (err) {
    throw new Error(err);
  }

  app.listen(port);
  console.log('Listening on port ' + port);
});

module.exports.getApp = app;
