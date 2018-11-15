var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cors = require('cors');
require('dotenv').config();

var app = express();
app.set('port', (process.env.PORT || 7000));
app.use(bodyParser.json());
app.use(cors());

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

//const API_URL = "https://stuckwanyah.herokuapp.com/api/v1";
const API_URL = "http://localhost:5000/api/v1";

app.get("/", function(req, res) {
    res.send("Deployed");
});

app.get("/get", function(req, res) {
    var limit = req.query.limit ? req.query.limit : {};
    var random = req.query.random ? req.query.random : {};
    var params = {
        limit: limit,
        random: random
    };

    request.get(API_URL + "/photos/twophotos", {data: params}, function(error, response, body) {
        if (error) {
            console.log("Error calling function: " + error);
        }
        res.send(response);
    });
});

app.post("/vote", function(req, res) {
    var winner = req.query.winner;
    var loser = req.query.loser;
    var options = {
        url: API_URL + '/photos/twophotos',
        qs: {
            winner: winner,
            loser: loser
        },
        json: true
    };

    request.post(options, function(error, response, body) {
        if (error) {
            console.log("Error invoking request: " + response.error);
        }
    });
});