var models = require('../models');
var utils = require('./utils');
var UAE = models.User_Attending_Event;

module.exports = function(app, passport) {

  app.get('/event', utils.isLoggedIn, function(req, res) {
    console.log(req);
    res.render('event', {});
  });

  /* FETCH JOINED EVENTS FOR USER via GET
   * example url: /api/event/get_joined?user_id=12341
   **/
  app.get('/api/event/get_joined', function(req, res) {
    UAE.findAll({
      attributes: ['event_id'],
      where: { user_id: req.params.user_id }
    }).then(events => {
      var extracted_events = [];
      events.forEach(function(event) {
        extracted_events.push(event["event_id"]);
      });
      res.json(extracted_events);
    });
  });

  /* JOIN EVENT via POST
   * example url: /api/event/join/
   **/
  app.post('/api/event/join', utils.isLoggedIn, function(req, res) {
    var next_seq_id = 0;

    // first check if the user is already in the event
    UAE.findAll({
      where: {
        user_id: req.user.id,
        event_id: req.body.event_id
      }
    }).then(user_attending_events => {
      if (user_attending_events.length != 0) {
        res.json({
          message: 'Error: user \''
            + req.body.user_id + '\' is already in event \''
            + req.body.event_id + '\'',
          req: req.body
        });

      // find the next seq_id and add it to the table
      } else {
        UAE.findOne({
          attributes: ['seq_id'],
          order: [ ['seq_id', 'DESC'] ],
          where: { event_id: req.body.event_id },
        }).then(user_attending_event => {
          if (user_attending_event != null) {
            next_seq_id = +user_attending_event[0]["seq_id"];
            next_seq_id += 1;
          }

          createUAE(res, req, next_seq_id);
        });
      }
    });

  });

  function createUAE(res, req, seq_id) {
    UAE.create({
      user_id: req.user.id,
      event_id: req.body.event_id,
      seq_id: seq_id,
    }).then(user_attending_event => {
      res.json({
        message: 'Sucess: user \'' + req.user.id
          + '\' joined event \'' + req.body.event_id + '\'',
        req: req.body,
        user_attending_event: user_attending_event });
    });
  }

  /* LEAVE EVENT via POST
   * example url: /api/event/leave/
   **/
  app.post('/api/event/leave', utils.isLoggedIn, function(req, res) {

    // find user-event pair
    UAE.findAll({
      where: {
        event_id: req.user.id,
        user_id: req.body.user_id
      }
    }).then(user_attending_events => {
      if (user_attending_events.length == 0) {
        res.json({
          message: 'Error: user \''
            + req.user.id+ '\' is not in event \''
            + req.body.event_id + '\'',
          req: req.body
        });

      // remove it
      } else {
        user_attending_events.forEach(function(uae) {
          uae.destroy();
        });
        res.json({
          message: 'Success: user \''
            + req.user.id+ '\' has left event \''
            + req.body.event_id + '\'',
          req: req.body
        });
      }
    });
  });
};
