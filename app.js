
// Dependencies
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");

var db = mongoose.connect(process.env.MONGODB_URI);
var Movie = require("./models/sweetlipsdb");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

//Server index page
app.get("/", function(req, res) {
	res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function(req, res) {
	if (req.query["hub.verify_token"] === "this_is_my_token") {
		console.log("Verified webhook");
		res.status(200).send(req.query["hub.challenge"]);
	} else {
		console.error("Verification failed. The tokens do not match.");
		res.sendStatus(403);
	}
});

// All callbacks for Messenger will be Posted here
app.post("/webhook", function (req, res) {
	// Make sure this is a page subscribtion
	if (req.body.object == "page") {
		// Iterate over each entry
		// there may be multiple entries if batched
		req.body.entry.forEach(function(entry) {
			// Iterate over each messaging event
			entry.messaging.forEach(function(entry) {
				if (event.postback) {
					processPostback(event);
				} else if (event.message) {
					processMessage(event);
				}
			});
		});

		res.sendStatus(200);
	}
});


/**
 * User/Sender -> is the person doing the voting
 * Candidate -> is the person being voted for his/her hotness
 * Candidate/s is/are the sender's friend/s
 **/

// Retrieve all female friends from age 14 - 23 
function processCandidateSex(event) {
	var senderId = event.sender.id;

	request({
		url: "https://graph.facebook.com/v2.6/" + senderId + "/friends?gender=female&sex=female",
		qs: {
			access_token: process.env.PAGE_ACCESS_TOKEN,
			fields: "gender || sex"
		},
		method: "GET"
	}, function(error, response, body) {
		var 
	})
}

/*
// Getting user gender
function processUserSex(event){
	var senderId = event.sender.id;
	var payload = event.postback.payload;

	if (payload === "Greeting") {

		// Getting user's gender from user Profile API
		// and redirect to respective function
		request({
			url: "https://graph.facebook.com/v2.6/" + senderId + "/friendlists",
			qs: {
				access_token: process.env.PAGE_ACCESS_TOKEN,
				fields: "gender"
			},
			method: "GET"
		}, function(error, response, body) {
			var greeting = "";
			if (error) {
				console.log("Error getting user's gender: " + error);
			} else {
				var bodyObj = JSON.parse(body);
				gender = bodyObj.gender;

			}
		})
	}
	
	// Checking user's gender
	else if (senderGender === "Female") {
		// girls vote for boys hotness
	} else {
		// boys vote for girls hotness
	}
}

// $facebook->api("/{$user_id}/friends?fields=id,name,gender");
// /fql?q=select uid, name, sex from user where uid in(select uid2 from friend where uid1 = me()) and sex = "female"
// /{user-id}/photos?type=uploaded

FB.api(
  '/fql',
  'GET',
  {"q":"select uid, name, sex from user where uid in(select uid2 from friend where uid1 = me()) and sex = female "},
  function(response) {
      // Insert your code here
  }
);

/* make the API call /
FB.api(
    "/{friend-list-id/}",// /{user-id}/friendlists
    function (response) {
      if (response && !response.error) {
        /* handle the result /
      }
    }
);
*/

function processCandidateProfilePicture(event) {
	request({
		url: "https://graph.facebook.com/v2.6/" + senderId + "/friends/pictures"
	})
}

function processPostback(event) {
	var senderId = event.sender.id;
	var payload = event.postback.payload;

	if (payload === "Greeting") {
		
		// Getting user's first name from user Profile API
		// and include it in the greeting
		request({
			url: "https://graph.facebook.com/v2.6/" + senderId,
			qs: {
				access_token: process.env.PAGE_ACCESS_TOKEN,
				fields: "first_name"
			},
			method: "GET"
		}, function(error, response, body) {
			var greeting, name = "";
			if (error) {
				console.log("Error getting user's name: " + error);
			} else {
				var bodyObj = JSON.parse(body);
				name = bodyObj.first_name;
				greeting = "Hi " + name + ". ";
			}
			var message = greeting + "Welcome to StuckWanYah!, the app that put your taste in your friends' hotness";
			sendMessage(senderId, {text: message});
		});
	} else if (payload === "Correct") {
		sendMessage(senderId, {text: "Awesome! What would you like to find out? Enter anything."});
	} else if (payload === "Incorrect") {
		sendMessage(senderId, {text: "Oops! Sorry about that. Try using the exact title of the movie"});
	}
}

// sends message to user
function sendMessage(recipientId, message) {
	request({
		url: "https://graph.facebook.com/v.2.6/me/messages",
		qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
		method: "POST",
		json: {
			recipient: {id: recipientId},
			message: message,
		}
	}, function(error, response, body) {
		if (error) {
			console.log("Error sending message: " + response.error);
		}
	});
}

//
function processMessage(event) {
	if (!event.message.is_echo) {
		var message = event.message;
		var senderId = event.sender.id;

		console.log("Received message from senderId: " + senderId);
		console.log("Message is: " + JSON.stringify(message));

		// You may get a text or attachment but not both
		if (message.text) {
			var formattedMsg = message.text.toLowerCase().trim();

			// If we receive a text message, check to see if it matches any special
			// keywords and send back the corresponding movie detail.
			// Otherwise, search for the new movie.
			switch (formattedMsg) {
				case "plot":
				case "date": 
				case "runtime":
				case "director":
				case "cast":
				case "rating":
					getCandidateDetail(senderId, formattedMsg);
					break;

					default: 
						findMovie(senderId, formattedMsg);
			}
		} else if (message.attachments) {
			sendMessage(senderId, {text: "Sorry, I don\'t understand your request."});
		}
	}
}

function getCandidateDetail(userId, field) {
	Movie.findOne({candidate_id: userId}, function(err, movie) {
		if (err) {
			sendMessage(userId, {text: "Something went wrong. Try again"});
		} else {
			sendMessage(userId, {text: movie[field]});
		}
	});
}

function findMovie(userId, movieTitle) {
	request("http://www.omdbapi.com/?type=movie&amp;t=" + movieTitle, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var movieObj = JSON.parse(body);
			if (movieObj.Response == "True") {
				var query = {user_id: userId};
				var update = {
					user_id: userId,
					title: movieObj.Title,
					plot: movieObj.Plot,
					date: movieObj.Release,
					runtime: movieObj.Runtime,
					director: movieObj.Director,
					cast: movieObj.Actors,
					rating: movieObj.imgRating,
					poster_url: movieObj.Poster
				};

				var options = {upsert: true};
				Movie.findOneAndUpdate(query, update, options, function(error, movie) {
					if (error) {
						console.log("Database error: " + error);
					} else {
						message = {
							attachment: {
								type: "template", 
								payload: {
									template_type: "generic",
									elements: [{
										title: movieObj.Title,
										subtitle: "Is this the movie you are looking for?",
										image_url: movieObj.Poster === "N/A" ? "http://placehold.it/350x150" : movieObj.Poster,
										buttons: [{
											type: "postback",
											title: "Hot",
											payload: "Correct"
										}, {
											type: "postback",
											title: "Not",
											payload: "Incorrect"
										}]
									}]
								}
							}
						};
						sendMessage(userId, message);
					}
				});
			} else {
				console.log(movieObj.Error);
				sendMessage(userId, {text: movieObj});
			}
		} else {
			sendMessage(userId, {text: "Something went wrong. Try again."});
		}
	});
}