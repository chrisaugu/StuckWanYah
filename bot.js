var express = require('express');
var bodyParser = require('body-parser');
var request = require("request")

var app = express();
var port = process.env.PORT || 3000;

var mongoose = require('mongoose');
mongoose.connect('mongodb://#@ds013911.mlab.com:13911/wyrdbot');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("We're connceted")
});

// body parser middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, function () {
    console.log('Listening on port ' + port);
});

app.get('/', function (req, res) {
    if (req.query['hub.verify_token'] === '<myToken>') {
        res.send(req.query['hub.challenge']);
        console.log("app.get ran")
        res.sendStatus(200)
    }

    res.send(req.query['hub.challenge']);
})

app.post('/', function (req, res) {
    console.log("app.post ran")
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;

            if (text === 'Generic') {
                sendGenericMessage(sender);
                continue;
            }

            sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));

        }
    }

    res.sendStatus(200);
});

var token = "<myToken>";

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
        "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com/",
                        "title": "Web url"
                    },{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                },{
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
          recipient: {id:sender},
          message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
          console.log('Error sending message: ', error);
        } else if (response.body.error) {
          console.log('Error: ', response.body.error);
        }
    });
}