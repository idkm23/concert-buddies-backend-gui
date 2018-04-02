$(document).ready(function() {
  scrollToBottom();
});

function loadChat(user_id) {
}

function showMessage(msg) {
  var chat = $("#chat-log");
  var isScrolledToBottom = chat.scrollHeight - chat.clientHeight
    <= chat.scrollTop + 1;
  //TODO: do some nonsense
  if (isScrolledToBottom) {
    scrollToBottom();
  }
}

function scrollToBottom() {
  console.log("weouthere");
  var chat = $("#chat-log");
  chat.scrollTop(chat.height() + 100000000);
}
