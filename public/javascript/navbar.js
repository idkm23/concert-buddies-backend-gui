
var notify = true;
var socket;
$(document).ready(function() {
  socket = io();
  socket.on('new_match', function(msg, callback) {
    match_notify();
    callback({
      status: 1,
      message: 'success: message received, not read'
    });
  });
  socket.on('new_msg', msg_notify);
  if (has_notification == "true") {
    enable_match_bubble();
  }
});

var bubble_open = false;
function msg_notify() {
  if (notify == false) {
    return;
  }

  enable_match_bubble();

  if (bubble_open == true) {
    return
  }
  bubble_open = true;
  var notification = $('#new_msg');
  notification.css('opacity', 1);

  setTimeout(function() {
    notification.css('opacity', 0);
    bubble_open = false;
  }, 3000);
}

function match_notify() {
  if (notify == false) {
    return;
  }
  enable_match_bubble();

  if (bubble_open == true) {
    return
  }
  bubble_open = true;
  var notification = $('#new_match');
  notification.css('opacity', 1);

  setTimeout(function() {
    notification.css('opacity', 0);
    bubble_open = false;
  }, 3000);
}

function enable_match_bubble() {
  $('head').append(
    '<style>#chat-icon::after { background: #f55; }</style>');
}

function disable_notifications() {
  notify = false;
  $('head').append(
    '<style>#chat-icon::after { opacity: 1; }</style>');
}
