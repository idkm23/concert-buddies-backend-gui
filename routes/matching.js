var models = require('../models');

module.exports = function(app, passport) {
  app.get('/matching', function(req, res) {
    res.render('matching', {});
  });
};
