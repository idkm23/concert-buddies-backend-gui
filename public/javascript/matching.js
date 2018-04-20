var HASNT_JOINED = 0;
var JOINED = 1;
var event_id;
var last_active;
$(document).ready(function() {
  var url = new URL(window.location.href);
  event_id = url.searchParams.get('event_id');
  if (event_id == null) {
    $('body').html("Error: please provide an event_id");
    return;
  }

  $('#join_event_btn').click(function() {
    join_event();
  });
  $('#leave_event_btn').click(function() {
    leave_event();
  });

  $("#vote-up").click(function() {
    like_user(true);
  });
  $("#vote-down").click(function() {
    like_user(false);
  });

  $('#img-left-nav').click(function() {
    cycle_pic(-1);
  });
  $('#img-right-nav').click(function() {
    cycle_pic(1);
  });

  if (has_joined == 'true') {
    set_layout(JOINED);
  } else {
    set_layout(HASNT_JOINED);
  }
});

function set_layout(layout_id) {
  if (layout_id == JOINED) {
    if (candidate == null) {
      load_next_match();
    }
    $("#matching-subpanel-joined").show();
    $("#leave_event_btn").show();
    $("#matching-subpanel-1").hide();
  } else if (layout_id == HASNT_JOINED) {
    $("#matching-subpanel-joined").hide();
    $("#leave_event_btn").hide();
    $("#matching-subpanel-1").show();
  }
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
      console.log(JSON.parse(xhr.responseText));
      if (callback != null) {
        callback(JSON.parse(xhr.responseText));
      }
    }
  };
  return xhr.send(JSON.stringify(data));
}

function join_event() {
  send_post('/api/event/join', {
    event_id: event_id
  }, function(result) {
    if (result.status == 0) {
      set_layout(JOINED);
    }
  });
}

function leave_event() {
  send_post('/api/event/leave', {
    event_id: event_id
  }, function(result) {
    if (result.status == 0) {
      set_layout(HASNT_JOINED);
    }
  });
}

function like_user(vote) {
  send_post('/api/matching/like', {
    event_id: event_id,
    like: vote
  }, load_next_match);
}

var candidate_queue = [];
function fetch_candidates(callback) {
  send_get('/api/matching/get_potential_matches', {
    event_id: event_id
  }, function(candidates) {
    if (candidates != '{}') {
      candidate_queue = candidates;
    }
    callback();
  });
}

var candidate;
function load_next_match() {
  candidate = null;
  if (candidate_queue.length == 0) {
    $('#matching-subpanel-2').hide();
    $('.lds-css.ng-scope').show();
    fetch_candidates(function() {
      if (candidate_queue.length == 0) {
        load_empty_message();
      } else {
        load_next_match_cont();
      }
    });
  } else {
    load_next_match_cont();
  }
}

function load_next_match_cont() {
  candidate = candidate_queue[0];
  candidate_queue.shift();
  var prof_pic;
  img_index = 0;
  $("#img-left-nav").hide();
  if (candidate.pictures != null) {
    for (let i = 0; i < candidate.pictures.length; i++) {
      candidate.pictures[i] =
        _arrayBufferToBase64(candidate.pictures[i].data);
    }
    prof_pic = candidate.pictures[0];
    if (candidate.pictures.length > 1) {
      $("#img-right-nav").show();
    } else {
      $("#img-right-nav").hide();
    }
    
  } else {
    prof_pic = 'images/default-profile.png';
    $("#img-right-nav").hide();
  }
  var age;
  age = candidate.dob;
  $('#active-profile-img').attr('src', prof_pic);
  $('#active-profile-about').html(candidate.about);
  $('#active-profile-name').html(candidate.first_name);
  $('#active-profile-age').html(candidate.age);
  $('#no-users-left').hide();
  $('.lds-css.ng-scope').hide();
  $('#matching-subpanel-2').show();
}

function load_empty_message() {
  $('#matching-subpanel-2').hide();
  $('.lds-css.ng-scope').hide();
  $('#no-users-left').show();
}

/*  Take the byte array from the database and convert it back to a string
    Credit: https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string */
function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    
    return binary;
    
    // btoa is not needed when original string sent to the DB was already base64
    //return window.btoa( binary );
}

var img_index = 0;
function cycle_pic(shift) {
  var final_index = img_index + shift;
  if (final_index >= 0 && final_index < candidate.pictures.length) {
    $('#active-profile-img').attr('src', candidate.pictures[final_index]);
    if (final_index == 0) {
      $('#img-left-nav').hide();
    } else {
      $('#img-left-nav').show();
    }
    if (final_index == candidate.pictures.length-1) {
      $('#img-right-nav').hide();
    } else {
      $('#img-right-nav').show();
    }
    img_index = final_index;
  }
}
