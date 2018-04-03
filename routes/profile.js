var http = require('http');

var utils = require('./utils');
var models = require('../models');

module.exports = function(app, passport) {
  app.get('/profile', utils.isLoggedIn, function(req, res) {
    res.render("profile");
  });
};