var modules = require('../models');
var express = require('express');
var router = express.Router();

/* GET event page. */
router.get('/', function(req, res) {
  res.sendfile('public/matching.html');
});

module.exports = router;
