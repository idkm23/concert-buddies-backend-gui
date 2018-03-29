var http = require('http');
var convertTime = require('convert-time');

var utils = require('./utils');
var tm = utils.tm;
var models = require('../models');

module.exports = function(app, passport) {
  app.get('/matching', utils.isLoggedIn, function(req, res) {
    if (req.query.event_id == null) {
      res.json("Error: please specifiy an event_id");
    }

    var options = {
      host: tm.host,
      path: tm.event_info_api + req.query.event_id + tm.api_key
    };
    utils.getJSON(options, function(status, tm_res) {
      if (tm_res == null) {
        res.json("Error: ticketmaster timed out");
        return;
      }

      var time = convertTime(
        tm_res.dates.start.localTime.slice(0, -3),
        'HH:MM A'
      );
      var venue = tm_res._embedded.venues[0];
      var location = venue.city.name + ", "
        + (venue.state != null ? venue.state.name : venue.country.name);

      res.render('matching', {
        concert_title: tm_res.name,
        venue: venue.name,
        location: location,
        date: tm_res.dates.start.localDate,
        time: time,
        tm_url: tm_res.url
      });
    });
  });
};
