var express = require("express");
var cors = require("cors");
var request = require("request");

var app = express();

app.listen(5000, function(req, res) {
  console.log("server running on port 5000")
});

// enables cors
app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false
}));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/randomToken.html");
});

app.get("/data", function(req, res) {
  var code = req.query.code;

  var options = { method: 'POST',
    url: 'https://hotspot.dwu.ac.pg/',
    headers:
     { 'content-type': 'application/x-www-form-urlencoded' },
    form: 
     { url: 'https://www.google.com.pg',
       ip: '192.168.2.247',
       code: code } 
  };

  console.log(code)


  // request(options, function (error, response, body) {
  //   if (error) res.send(error);
  //   if (response) {
  //     // switch (body.toString().search(/<b>(.*)<\/b>/)) {
  //     //   case "exceeded":
  //     //     console.log("exceeded")
  //     //     break;
  //     //   case "login":
  //     //     console.log("login")
  //     //     break;
  //     //   case "expired":
  //     //     console.log("expired")
  //     //     break;
  //     //   case "not valid":
  //     //     console.log("not valid")
  //     //     break;
  //     //   default:
  //     //     console.log("login page")
  //     // }
      
  //     if (body.toString().search("exceeded") > -1) {
  //       console.log("exceeded");
  //       res.send("exceeded");
  //     }
  //     if (body.toString().search("login") > -1) {
  //       console.log("login");
  //       res.send("login");
  //     }
  //     if (body.toString().search("expired") > -1) {
  //       console.log("expired");
  //       res.send("expired");
  //     }
  //     if (body.toString().search("not valid") > -1) {
  //       console.log("not valid");
  //       res.send("not valid");
  //     }
  //   } else {
  //     console.log("no response: " + response)
  //   }
  // });
});