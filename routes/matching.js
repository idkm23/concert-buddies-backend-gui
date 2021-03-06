var http = require('http');
var convertTime = require('convert-time');
var Sequelize = require('sequelize');
var Op = Sequelize.Op;

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
        console.log(req.user);
        res.render('matching', {
          concert_title: tm_res.name,
          venue: venue.name,
          location: location,
          date: tm_res.dates.start.localDate,
          time: time,
          tm_url: tm_res.url,
          tm_pic: pic,
          has_joined: has_joined,
          has_notification: req.user.notify
        });
      });
    });
  });

  // *******
  // * API *
  // *******


  app.get('/api/matching/get_potential_matches', utils.isLoggedIn,
    function(req, res) {
      var _uaes;
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
                [Op.not]: req.user.id
              },
              event_id: req.query.event_id,
              seq_id: {
                [Op.gte]: next_user.next_seq_id
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
          _uaes = uaes;
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
            var ordered_users = [];
            for (let i = 0; i < uaes.length; i++) {
              for (let j = 0; j < users.length; j++) {
                if (uaes[i].user_id == users[j].id) {
                  ordered_users.push(users[j]);
                  break;
                }
              }
            }
            res.json(ordered_users);
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
                  [Op.not]: req.user.id
                },
                event_id: req.body.event_id,
                seq_id: {
                  [Op.gte]: target_seq_id 
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
                        event_id: req.body.event_id,
                        matched_user_id: liked_user.user_id 
                      },
                      {
                        user_id: liked_user.user_id, 
                        event_id: req.body.event_id,
                        matched_user_id: req.user.id 
                      }
                    ]).then(() => {
                      res.json({
                        message: 'Success, user \'' + req.user.id
                          + '\' liked the next user in the queue',
                        match: 'true'
                      });
                      User.update(
                        { notify: true },
                        { where: { id: liked_user.user_id } }
                      ).then(() => {});

                      // notify other user 
                      var receiver_sockets = app.socket_map[liked_user.user_id];
                      if (receiver_sockets != null) {
                        receiver_sockets.forEach(function(socket) {
                          socket.emit('new_match', JSON.stringify({}),
                            function(answer) {
                              if (answer.status == '0') {
                                User.update(
                                  { notify: false },
                                  { where: { id: liked_user.user_id } }
                                ).then(() => {});
                              }
                            }
                          );
                        });
                      }
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

  app.post('/api/matching/remove', utils.isLoggedIn, function(req, res) {
    //remove from matching, remove from liked_users
    Matches.destroy({
      where: {
        [Op.or]: [
          {[Op.and]: {
            user_id: req.user.id,
            matched_user_id: req.body.matched_user_id
          }},
          {[Op.and]: {
            user_id: req.body.matched_user_id,
            matched_user_id: req.user.id
          }}
        ]
      }
    }).then(() => {
      return Liked_Users.destroy({
        where: {
          user_id: req.user.id,
          liked_user_id: req.body.matched_user_id
        }
      });
    }).then(() => {
      res.json({
        status: 0,
        message: "Success, user removed.",
        req: req.body
      });
    }).catch(err => {
      console.log(err);
      res.json({
        status: 1,
        message: err.message,
        req: req.body
      });
    });
  });

  /* get matches via GET, aggregates events in-case a user has matched
   * with another across multiple events.
   **/
  app.get('/api/matching/get_matches', utils.isLoggedIn, function(req, res) {
    var matches_with_events = [];
    Matches.findAll({
      attributes: {
        include: [
          [Sequelize.fn('ARRAY_AGG', Sequelize.col('event_id')), 'event_ids'],
        ],
        exclude: ['id', 'user_id', 'event_id', 'createdAt', 'updatedAt']
      },
      group: ['user_id', 'matched_user_id'],
      where: {
        user_id: req.user.id
      },
    }).then(matches => {
      var matched_ids = [];
      matches.forEach(function(match) {
        var id = match.matched_user_id;
        matched_ids.push(+id);
        matches_with_events[id] = match.get('event_ids');
      });
      if (matched_ids.length != 0) {
        User.findAll({
          where: {
            id: {
              [Op.or]: matched_ids
            }
          },
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'password', 'last_name']
          }
        }).then(match_profiles => {
          for (let i = 0; i < match_profiles.length; i++) {
            match_profiles[i].dataValues.events = matches_with_events[match_profiles[i].id];
          }
          res.json(match_profiles);
        });
      } else {
        res.json([]);
      }
    })
  });
};
