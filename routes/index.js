var utils = require('./utils');
var models  = require('../models');

module.exports = function(app, passport) {

  /* GET home page. */
  app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/events');
    } else {
      res.render('welcome', {});
    }
  });
};
