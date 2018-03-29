var utils = require('./utils');
var models = require('../models');

module.exports = function(app, passport) {
  app.get('/matching', utils.isLoggedIn, function(req, res) {
    res.render('matching', {});
  });
};
