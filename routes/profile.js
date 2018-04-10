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
    
  /* ADD PROFILE PIC TO USER
   * request body must contain 'img' field with 
   * base64 string representation of picture
   **/
  app.post('/api/profile/upload_pic', function(req, res) {
    var id = req.user.id;
    User.findById(id, {}).then(user => {
        if(!user.pictures) {
            user.pictures = [];
        }
        user.pictures.push(req.body.img);
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
    
  /* REMOVE PROFILE PIC FROM USER
   * request body must contain 'index' field with 
   * the index of the picture to remove from the array
   **/
  app.post('/api/profile/delete_pic', function(req, res) {
      var id = req.user.id;
      User.findById(id, {}).then(user => {
          if(user.pictures) {
              var index = req.body.index;
              if(index >= 0 && index < user.pictures.length) {
                  var removed = user.pictures.splice(index, 1);
                  //console.log("Removed: " + removed);
              }
              user.update({
                  pictures: user.pictures
              }, {
                  where: {
                      id: req.user.id
                  }
              }).then(user => {
                  res.json(user);
              });
          } else {
              res.json({
                  status: 1,
                  message: 'Error: attempted to remove picture from empty array',
                  req: req.body
              });
          }
      });
  });
    
};
