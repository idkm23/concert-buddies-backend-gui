var modules = require('../models');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('matching', {});
});

module.exports = router;
