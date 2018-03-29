var models  = require('../models');

module.exports = function(app, passport) {

  /* GET home page. */
  app.get('/', function(req, res) {
    var logged_in = false; 
    if (logged_in) {
      // TODO: redirect user to event search page if they are logged in
    } else {
      res.render('welcome', {});
    }
  });
};
