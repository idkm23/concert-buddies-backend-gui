var utils = require('./utils');
var models = require('../models');
var User = models.User;

module.exports = function(app, passport) {

  /* GET USER via GET
   * REQUIRES AUTHENTICATION
   * example url: /api/user/fetch?user_id=12341
   **/
  app.get('/api/user', function(req, res) {
    User.findById(req.query.user_id, {}).then(user => {
      delete user.dataValues.password;
      res.json(user);
    });
  });

  /* SIGN IN via POST
   * example url: /api/user/signup
   **/
  app.post('/api/user/signin', passport.authenticate('local-signin',  {
    successRedirect: '/event',
    failureRedirect: '/'
  }));

  /* SIGN UP via POST
   * example url: /api/user/signup
   **/
  app.post('/api/user/signup', passport.authenticate('local-signup', {
    successRedirect: '/event',
    failureRedirect: '/'
  }));

  /* SIGN OUT via GET 
   * example url: /api/user/signout
   **/
  app.get('/api/user/signout', function(req, res) {
    req.session.destroy(function(err) {
      res.redirect('/');
    });
  });

};
