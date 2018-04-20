var http = require('http');
var Sequelize = require('sequelize');

var utils = require('./utils');
var models = require('../models');
var Op = models.Sequelize.Op;
var Chat = models.Chat;
var User = models.User;

module.exports = function(app, passport) {
  app.get('/chat', utils.isLoggedIn, function(req, res) {
    res.render("chat", {
      has_notification: false
    });
    if (req.user.notify == true) {
      User.update(
        { notify: false },
        { where: { id: req.user.id } }
      ).then(() => {});
    }
  });

  app.get('/api/chat/get_chat', utils.isLoggedIn, function(req, res) {
    Chat.findAll({
      where: {
        [Op.or]: [
          {[Op.and]: {
            sender_id: req.user.id,
            receiver_id: req.query.receiver_id
          }},
          {[Op.and]: {
            sender_id: req.query.receiver_id,
            receiver_id: req.user.id
          }}
        ]
      }
    }).then(msgs => {
      res.json({
        self_id: req.user.id,
        msgs: msgs
      });
    });
  });

  app.post('/api/chat/send_msg', utils.isLoggedIn, function(req, res) {
    Chat.create({
      sender_id: req.user.id,
      receiver_id: req.body.receiver_id,
      content: req.body.content,
      timestamp: Sequelize.fn('NOW')
    }).then(chat => {
     User.update(
       { notify: true },
       { where: { id: req.body.receiver_id } }
     ).then(() => {});

      var receiver_sockets = app.socket_map[req.body.receiver_id];
      if (receiver_sockets != null && receiver_sockets.length > 0) {
        receiver_sockets.forEach(function(receiver_socket) {
          receiver_socket.emit('new_msg', JSON.stringify({
            sender_id: req.user.id,
            content: req.body.content
          }), function(answer) {
            if (answer.status == '0') {
              User.update(
                { notify: false },
                { where: { id: req.body.receiver_id } }
              ).then(() => {});
            }
          });
        });
        res.json({
          status: 0,
          sent_via_socket: true,
          message: "Success, message delivered",
          req: req.body
        });
      } else {
        res.json({
          status: 0,
          sent_via_socket: false,
          message: "Success, message saved, not sent via socket",
          req: req.body
        });
      }
    });
  });
};
