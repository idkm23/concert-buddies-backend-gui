var models  = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {

  var logged_in = false; 
  if (logged_in) {
    // TODO: redirect user to event search page if they are logged in
  } else {
    res.sendfile('public/welcome.html');
  }

/* print table of users to index.jade view */
//  models.User.findAll({}).then(function(users) {
//    console.log(users);
//    res.render('index', {
//      title: 'Printing current users',
//      users: users
//    });
//  });
});

module.exports = router;
