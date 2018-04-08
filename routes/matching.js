var http = require('http');
var convertTime = require('convert-time');
var Sequelize = require('sequelize');

var utils = require('./utils');
var tm = utils.tm;
var models = require('../models');
var User = models.User;
var UAE = models.User_Attending_Event;
var Liked_Users = models.Liked_Users;
var Next_User = models.Next_User;
var Matches = models.Matches;

module.exports = function(app, passport) {
  app.get('/matching', utils.isLoggedIn, function(req, res) {
    if (req.query.event_id == null) {
      res.json("Error: please specifiy an event_id");
      return;
    }

    var options = {
      host: tm.host,
      path: tm.event_info_api + req.query.event_id + tm.api_key
    };
    utils.getJSON(options, function(status, tm_res) {
      if (tm_res.dates == null) {
        res.json("Error: ticketmaster timed out");
        return;
      }
      var time = '';
      if (tm_res.dates.start.localTime != null) {
        time = convertTime(
          tm_res.dates.start.localTime.slice(0, -3)
        );
      }
      var pic = '';
      if (tm_res.images != null && tm_res.images.length > 2) {
        pic = tm_res.images[1].url;
      }
      var venue = tm_res._embedded.venues[0];
      var location = venue.city.name + ", "
        + (venue.state != null ? venue.state.name : venue.country.name);


      UAE.findOne({
        where: {
          user_id: req.user.id,
          event_id: req.query.event_id
        }
      }).then(user => {
        var has_joined = (user != null);
        res.render('matching', {
          concert_title: tm_res.name,
          venue: venue.name,
          location: location,
          date: tm_res.dates.start.localDate,
          time: time,
          tm_url: tm_res.url,
          tm_pic: pic,
          has_joined: has_joined
        });
      });
    });
  });

  // *******
  // * API *
  // *******


  app.get('/api/matching/get_potential_matches', utils.isLoggedIn,
    function(req, res) {
      Next_User.findOne({
        attributes: ['next_seq_id'],
        where: {
          user_id: req.user.id,
          event_id: req.query.event_id
        }
      }).then(next_user => {
        if (next_user != null) {
          return UAE.findAll({
            attributes: ['user_id'],
            where: { 
              user_id: {
                [Sequelize.Op.not]: req.user.id
              },
              event_id: req.query.event_id,
              seq_id: {
                [Sequelize.Op.gte]: next_user.next_seq_id
              },
            },
            order: [
              ['seq_id', 'ASC'],
            ],
            limit: 5
          });
        } else {
          throw new Error('Error: no next_user entry found for the event-user'
            + 'pair. Has this user joined the event?');
        }
      }).then(uaes => {
        if (uaes.length != 0) {
          var user_ids = [];
          uaes.forEach(function(uae) {
            user_ids.push(uae.user_id);
          });
          User.findAll({
            attributes: {
              exclude: ['password', 'createdAt', 'updatedAt']
            },
            where: {
              id: user_ids
            }
          }).then(users => {
            res.json(users);
          });
        } else {
          res.json("{}");
        }
      }).catch(err => {
        res.json({
          message: err.message,
          req: req.params
        });
      });
    });


  /* VOTE ON A PROFILE via POST
   **/
  app.post('/api/matching/like', utils.isLoggedIn, function(req, res) {
    var self_seq_id;
    // the next_user instance to update for the next time the user likes
    var next_user;

    UAE.findOne({
      where: {
        user_id: req.user.id,
        event_id: req.body.event_id
      }
    }).then(uae => {
      if (uae != null) {
        self_seq_id = +uae.seq_id;
        Next_User.findOne({
          where: {
            user_id: req.user.id,
            event_id: req.body.event_id
          }
        }).then(next_user_res => {
          next_user = next_user_res;
          if (next_user != null) {
            var target_seq_id = +next_user.next_seq_id;
            var next_seq_id = target_seq_id + 1;
            if (target_seq_id == self_seq_id || target_seq_id+1 == self_seq_id) {
              next_seq_id += 1;
            }
            next_user.next_seq_id = next_seq_id;
            return UAE.findOne({
              attributes: ['user_id', 'seq_id'],
              where: { 
                user_id: {
                  [Sequelize.Op.not]: req.user.id
                },
                event_id: req.body.event_id,
                seq_id: {
                  [Sequelize.Op.gte]: target_seq_id 
                },
              }
            });
          } else {
            throw new Error('Error: no next_user entry found for the event-user'
              + 'pair. Has this user joined the event?');
          }
        }).then(liked_uae => {
          if (liked_uae != null) {
            if (+liked_uae.seq_id >= next_user.next_seq_id) {
              var target_seq_id = +liked_uae.seq_id;
              var next_seq_id = target_seq_id + 1;
              if (target_seq_id == self_seq_id
                || target_seq_id+1 == self_seq_id) {
                next_seq_id += 1;
              }
              next_user.next_seq_id = next_seq_id;
            }
            next_user.save().then(() => {
              if (req.body.like == true) {
                Liked_Users.create({
                  user_id: req.user.id,
                  event_id: req.body.event_id,
                  liked_user_id: liked_uae.user_id
                }).then(liked_user => {
                  return Liked_Users.findOne({
                    where: {
                      user_id: liked_user.liked_user_id,
                      event_id: req.body.event_id,
                      liked_user_id: req.user.id
                    }
                  });
                }).then(liked_user => {
                  // they match
                  if (liked_user != null) {
                    Matches.bulkCreate([
                      { 
                        user_id: req.user.id, 
                        matched_user_id: liked_user.user_id 
                      },
                      {
                        user_id: liked_user.user_id, 
                        matched_user_id: req.user.id 
                      }
                    ]).then(() => {
                      res.json({
                        message: 'Success, user \'' + req.user.id
                          + '\' liked the next user in the queue',
                        match: 'true'
                      });
                    });

                  } else {
                    res.json({
                      message: 'Success, user \'' + req.user.id
                        + '\' liked the next user in the queue',
                      match: 'false'
                    });
                  }
                });

              } else {
                res.json({
                  message: 'Success, user \'' + req.user.id
                    + '\' disliked the next user in the queue', 
                  req: req.body
                });
              }
            });
          } else {
            res.json({
              message: 'Error: there are no more users in the concert queue to like!',
              req: req.body
            });
          }
        }).catch(err => {
          res.json({
            message: err.message,
            req: req.params
          });
        });
      } else {
        throw new Error('Error: no uae entry found for the event-user'
          + 'pair. Has this user joined the event?');
      }
    }).catch(err => {
      res.json({
        message: err.message,
        req: req.params
      });
    });
  });

  /* get matches via GET, aggregates events in-case a user has matched
   * with another across multiple events.
   **/
  app.get('/api/matching/get_matches', utils.isLoggedIn, function(req, res) {
    Matches.findAll({
      attributes: {
        include: [
          [Sequelize.fn('ARRAY_AGG', Sequelize.col('event_id')), 'event_ids']
        ],
        exclude: ['id', 'event_id', 'createdAt', 'updatedAt']
      },
      group: ['user_id', 'matched_user_id'],
      where: {
        user_id: req.user.id
      }
    }).then(matches => {
      res.json(matches);
    });
  });

};
