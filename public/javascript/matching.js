$(document).ready(function() {
  var url = new URL(window.location.href);
  var event_id = url.searchParams.get('event_id');
  if (event_id == null) {
    $('body').html("Error: please provide an event_id");
    return;
  }

  $('#join_event_btn').click(function() {
    join_event(event_id);
    set_joined_layout(true);
  });

  $('#leave_event_btn').click(function() {
    leave_event(event_id);
    set_joined_layout(false);
  });

  set_joined_layout(has_joined == "true");
});

function set_joined_layout(has_joined) {
  if (has_joined) {
    $("#matching-subpanel-1").hide();
    $("#matching-subpanel-2").show()
    $("#leave_event_btn").show();
  } else {
    $("#matching-subpanel-2").hide();
    $("#leave_event_btn").hide();
    $("#matching-subpanel-1").show();
  }
}

function send_post(url, data) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  return xhr.send(JSON.stringify(data));
}

function join_event(event_id) {
  send_post('/api/event/join', {
    event_id: event_id
  });
}

function leave_event(event_id) {
  send_post('/api/event/leave', {
    event_id: event_id
  });
}
