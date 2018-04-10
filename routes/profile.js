var http = require('http');

var utils = require('./utils');
var models = require('../models');
var User = models.User;

module.exports = function(app, passport) {
  app.get('/profile', utils.isLoggedIn, function(req, res) {
    res.render("profile");
  });
    
  /* FETCH PROFILE PICS FOR USER via GET
   * example url: /api/profile/pics?user_id=12341
   **/
  app.get('/api/profile/pics', function(req, res) {
    var id = req.query.user_id;
    if (id == null) {
      id = req.user.id;
    }
    User.findById(id, {}).then(user => {
      res.json(user.pictures);
    });
  });
    
  app.post('/api/profile/upload_pic', function(req, res) {
    var id = req.user.id;
    User.findById(id, {}).then(user => {
        if(!user.pictures) {
            user.pictures = [];
        }
        user.pictures.push(req.body.img);
        console.log(req.body.img);
        user.update({
            pictures: user.pictures
        },{
            where: {
                id: req.user.id
            }
        }).then(user => {
            res.json(user);
        });
    });
  });
    
};
