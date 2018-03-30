var http = require("http");
var https = require("https");

module.exports = {
  tm: {
    api_key: "?apikey=etiKzCoqnYu3LmsKbArqF6uxdAJGaENS",
    host: "app.ticketmaster.com",
    event_info_api: "/discovery/v2/events/"
  },

  isLoggedIn: function(req, res, next) {
    if (req.isAuthenticated())
      return next();

    res.redirect('/');
  },

  /**
   * getJSON:  REST get request returning JSON object(s)
   * @param options: http options object
   * @param callback: callback to pass the results JSON object(s) back
   */
  getJSON: function getJSON(options, onResult, attempts=0) {
    var port = options.port == 443 ? https : http;
    var req = port.request(options, function(res)
      {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
          output += chunk;
        });

        res.on('end', function() {
          var obj = JSON.parse(output);
          console.log(obj);
          onResult(res.statusCode, obj);
        });
      });

    req.on('error', function(err) {
      console.log('error: ' + err.message);
      if (attempts == 0) {
        getJSON(options, onResult, 1);
      }
      //res.send('error: ' + err.message);
    });

    req.end();
  }
}
