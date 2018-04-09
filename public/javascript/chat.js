var tm_api_key = "?apikey=etiKzCoqnYu3LmsKbArqF6uxdAJGaENS";
var tm_url = "http://app.ticketmaster.com/discovery/v2/events/";

var socket;
$(document).ready(function() {
  socket = io();
  socket.on('new_msg', function(msg, callback){
    console.log(msg);
    var msg_obj = JSON.parse(msg);
    showMessage(
      msg_obj.content,
      isMe=false,
      receiver_id=msg_obj.sender_id);
    callback({
      status: 0,
      message: 'Success: message received'
    });
  });
  $('#chat-input').keydown(function(event) {
    if (event.keyCode == 13) {
      send_msg();
      return false;
    }
  });
  $('.remove_friend').click(function() {
    send_post('/api/matching/remove', {
      matched_user_id: active_chat
    }, function(res) {
      delete matches[active_chat];
      contacts[active_chat].remove();
      delete contacts[active_chat];
      chats[active_chat].remove();
      delete chats[active_chat];
      delete event_names[active_chat];
      showChat(-1);
    });
  });
  $('#chat-send-btn').click(send_msg);
  load();
});

function send_msg() {
  var content = $('#chat-input').val();
  if (is_space(content) || active_chat == -1) {
    return;
  }
  $('#chat-input').val('');
  if (active_chat == -1) {
    return;
  };
  var message_div = showMessage(
    content,
    isMe=true,
    receiver_id=active_chat,
    toBegin=true,
    delivered=false);
  send_post('/api/chat/send_msg', {
    receiver_id: active_chat,
    content: content
  }, function(res) {
    message_div.css('background-color', '#0084ff');
  });
}

var matches = [];
function load() {
  send_get('/api/matching/get_matches', {},
    function(res) {
      res.forEach(function(match) {
        matches[match.id] = match;
        if (matches[match.id].pictures == null) {
          matches[match.id].profile_pic = "url('/images/default-profile.png')";
        } else {
          matches[match.id].profile_pic =
            "url('data:image/png;base64," + matches[match.id].pictures[0] + "')";
        }

        //load left panel
        addMatchSelector(match.id);

        //load right panel
        loadChat(match.id);
        if (active_chat == -1) {
          showChat(match.id);
        }
      });
      if (active_chat == -1) {
        showChat(-1);
      }
    }); 
}

var contacts = [];
function addMatchSelector(match_id) {
  var match = matches[match_id];
  var contact = $('<div/>', {
    'class': 'contact'
  });
  var pic = $('<div/>', {
    'class': 'pic',
    'css': {
      'background-image': match.profile_pic
    }
  });
  var text_info = $('<div/>', {
    'class': 'text_info'
  });
  var name = $('<div/>', {
    'class': 'name',
    text: match.first_name
  });
  var last_msg = $('<div/>', {
    'class': 'last_msg'
  });
  contacts[match_id] = contact;

  contact.click(function() {
    showChat(match_id);
  });

  text_info.append(name);
  text_info.append(last_msg);
  contact.append(pic);
  contact.append(text_info);
  $('#contact-panel').append(contact);
}

var self_id;
var active_chat = -1;
var chats = [];
var event_names = [];
function loadChat(receiver_id) {
  chats[receiver_id] = $('<div/>', {
    'class': 'chat-log'
  });

  send_get('/api/chat/get_chat', {
    receiver_id: receiver_id
  },
    function(res) {
      self_id = res.self_id;
      chats[receiver_id].appendTo('#chat-log-holder');
      for (let i = res.msgs.length-1; i >= 0; i--) {
        var msg = res.msgs[i];
        console.log(msg);
        showMessage(
          msg.content,
          (msg.sender_id == self_id),
          receiver_id,
          false
        )
      }
    });
}

function showMessage(msg, isMe, receiver_id, toBegin=true, delivered=true) {
  var message_row = $('<div/>', {
    'class': 'message_row ' + (isMe ? 'to' : 'from'),
  });
  var spacer = $('<div/>', {
    'class': 'spacer'
  });
  var message = $('<div/>', {
    'class': 'message',
    text: msg,
  });
  if (isMe) {
    message.css('background-color', (delivered ? '#0084ff' : '#74a6d4'));
    message_row.append(spacer);
    message_row.append(message);
  } else {
    message_row.append(message);
    message_row.append(spacer);
  }

  var chat = chats[receiver_id];
  if (toBegin || chat.html() == '') {
    chat.append(message_row);
    var preview;
    if (isMe) {
      preview = 'You: ' + msg;
    } else {
      preview = msg;
    }
    if (preview.length > 21) {
      preview = preview.substring(0, 20) + '...';
    }
    contacts[receiver_id].find('.last_msg').html(preview);
  } else {
    chat.prepend(message_row);
  }
  scrollToBottom();
  return message;
}

function showChat(receiver_id) {
  if (receiver_id == active_chat && receiver_id != -1) {
    return;
  }

  contacts.forEach(function (contact) {
    contact.css('background-color', 'white');
  });

  if (chats[active_chat] != null) {
    chats[active_chat].hide();
  }
  if (receiver_id == -1) {
    active_chat = -1;
    $('#info-panel').children().hide();
    $('#active_events').children().hide();
    if (Object.keys(contacts).length == 0) {
      $('#no-matches-contact').show();
    }
    return;
  } else {
    contacts[receiver_id].css('background-color', 'rgb(245, 245, 245)');
    $('#info-panel').children().show();
    $('#no-matches-contact').hide();
  }

  var match = matches[receiver_id];
  $('#active_pic').css('background-image', match.profile_pic);
  $('#active_name').html(match.first_name);
  $('#active_age').html(calculate_age(match.dob));
  if (event_names[receiver_id] == null) {
    event_names[receiver_id] = '';
    if (match.events != null) {
      match.events.forEach(function(event_id) {
        var url =  tm_url + event_id + tm_api_key;
        $.ajax({
          type:"GET",
          url: url,
          async:true,
          dataType: "json",
          success: function(res) {
            var event_link = '/matching?event_id=' + event_id;
            var link = $('<a/>', {
              'class': 'active_event',
              text: res.name,
              href: event_link
            });
            event_names[receiver_id] += link[0].outerHTML;
            $('#active_events').html(event_names[receiver_id]);
            $('#active_events').children().show();
          },
          error: function(xhr, status, err) {}
        });
      });
    } else {
      event_names[receiver_id] = 'null';
    }
  } else {
    $('#active_events').html(event_names[receiver_id]);
  }

  active_chat = receiver_id;
  var chat = chats[active_chat];
  chat.show();
  $('#active_events').children().show();
  scrollToBottom();
}

function scrollToBottom() {
  if (active_chat == -1) {
    return;
  }

  var chat_log_holder = $('#chat-log-holder');
  var chat_log = chats[active_chat];
  chat_log_holder.scrollTop(chat_log[0].clientHeight);
}

function send_get(url, params, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url + "?" + jQuery.param(params), true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      console.log(JSON.parse(xhr.responseText));
      callback(JSON.parse(xhr.responseText));
    }
  };
  return xhr.send();
}

function send_post(url, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      console.log('hello');
      console.log(xhr.responseText);
      if (callback != null) {
        callback(JSON.parse(xhr.responseText));
      }
    }
  };
  return xhr.send(JSON.stringify(data));
}

function calculate_age(_birthday) {
  var birthday = new Date(_birthday);
  var ageDifMs = Date.now() - birthday.getTime();
  var ageDate = new Date(ageDifMs); // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function is_space(str) {
  return (str.replace(/\s/g, '').length == 0);
}
