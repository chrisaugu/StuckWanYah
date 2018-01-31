// Invoke JavaScript Strict mode
'use strict';
// Initializing main Dependency modules
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

// Creating instance for express
var app = module.exports = express();
// configure the instance
app.set('port', (process.env.PORT || 5000));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Parse POST request data. It will be available in the req.body object
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Invoke instance to listen to port
app.listen(app.get('port'), function() {
    // Create new server
    console.log("Server running on port %d", app.get('port'));
});
// Creating an instance for MongoDB
var db = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sweetlipsdb');
mongoose.connection.on("open", function() {
    console.log("Connected: Successfully connect to mongo server");
});
mongoose.connection.on('error', function() {
    console.log("Error: Could not connect to MongoDB. Did you forget to run 'mongod'?");
});
var Sweetlips = require("./models/sweetlips.model");

//Server index page
app.get("/", function(req, res) {
	res.render("index");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function(req, res) {
	if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
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
 * Process postback for payloads
 */
function processPostback(event) {
	var senderId = event.sender.id;
	var payload = event.postback.payload;

	if (payload === "GET_STARTED") {

		// voter is the sender
		processVoterSex(senderId);
		
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
			var message = greeting + "Welcome to StuckWanYah!, the app that lets you put your taste in your friends' hotness";
			sendMessage(senderId, {text: message});
		});
	} else if (payload === "Block Me") {
		processBlock(senderId);
		sendMessage(senderId, {text: "Your photos has been blocked. You will not be able to be voted or vote."});
	} else if (payload === "Unblock Me") {
		processUnblock(senderId);
		sendMessage(senderId, {text: "Your photos has been restored and you can be able to be voted or vote"});
	}
}

/**
 * Process message from user for any matching keyword and perform actions
 */
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
				case "block me":
					processBlock(senderId);
					break;
				case "unblock me":
					processUnblock(senderId);
				default:
					findMovie(senderId, formattedMsg);
			}
		} else if (message.attachments) {
			sendMessage(senderId, {text: "Sorry, I don\'t understand your request."});
		}
	}
}

/**
 * Block and Unblock
 */
function processBlock(userId) {
	var query = {image_id: userId};
	var attempts = 0;
	Sweetlips.findOne({user_id: userId}, function(err, user) {
		if (err) {
			attempts++;
			if (attempts>2) sendMessage(userId, {text: "Sorry it's my fault. Try again later."}); attempts=0;
			sendMessage(userId, {text: "Something went wrong. Try again"});
		} else {
			user.is_blocked = true;
			sendMessage(userId, {text: "Your photo has been blocked. You will not be able to be voted nor vote again in the future."})
		}
	});
	return true;
}
function processUnblock(userId) {
	var query = {image_id: userId};
	Sweetlips.findOne(query, function(err, response) {
		if (err) {
			sendMessage(user_id, {text: "Something went wrong. Try again"});
		} else {
			sendMessage(userId, {text: "Your photo has been unblocked. You can now vote for your friends hotness."});
		}
	})
}

/**
 * Sends message to user
 */
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

var getContenderDetail = function(userId, field) {
	Movie.findOne({image_id: userId}, function(err, movie) {
		if (err) {
			sendMessage(userId, {text: "Something went wrong. Try again"});
		} else {
			sendMessage(userId, {text: movie[field]});
		}
	});
}

// Retrieve all friends from facebook
// and save them in database
var retrievePlayerFriends = function(userId) {
	request({
		url:"https://graph.facebook.com/v.2.6/me/friends",
		qs: {
			access_token: process.env.PAGE_ACCESS_TOKEN,
			//fields: ""
		},
		method: "GET"
	}, function(error, friend) {
		if (error) {
			sendMessage(userId, {text: "Error retrieving your Facebook friends."});
		}
		var query = {image_id: userId}
		var update = {
			image_id: friend.cuid,
			name: friend.name,
			age: friend.age,
			gender: friend.gender,
			image_url: friend.thumSrc,
			uri: friend.uri,
			//is_blocked: false,
			ratings: { type: Number, default: 0},
			wins: { type: Number, default: 0},
			losses: { type: Number, default: 0},
			score: { type: Number, default: 0},
			random: { type: [Number], index: '2d' },
			voted: { type: Boolean, default: false },
			vote_timestamp: { type: Date, default: Date.now() },
			joinedAt: { type: Date, default: Date.now() },
		}
		var options = {upsert: true}
		Sweetlips.photos.findOneAndUpdate(query, update, options, function(err, friend) {
			if (err) {
				console.error("Database error: " + err);
			} else {
				console.log("Successfully retrieve friends from Facebook.")
			}
		})
	})
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

function findPhotoById(id){
	Sweetlips.photos.find({
		image_id: id
	}, function(err, photo){
		if (err) throw err;
		return photo;
	});
}

function deletePhotoById(id, array){
	var arrayIndex = 0;
	for(var i=0; i<array.length; i++){
 		if(array[i].user_id === id){
 			arrayIndex = i;
 		}
 	}
 	array.splice(photoIndex, 1);
 	return array;
}

function blockPhotoById(id) {
	Sweetlips.photos.update({image_id: id},
		{$set: {'$is_blocked': true}},
		function(err){
			if(err) throw err;
			return true;
		});
}

function unblockPhotoById(id) {
	Sweetlips.photos.update({
		image_id: id
	}, {
		$set: {
			'$is_blocked': false
		}
	}, function(err){
		if (err) throw err;
	});
}

function processGender(gender){
	return (gender == 'female' ? 'female' : 'male');
}

function filterPhotosGender(gender, array){
	var temp = [];
	for (var i=0; i<array.length; i++) {
		if(array[i].sex === gender){
			temp.push(array[i]);
			return temp;
		}
	}
	return null;
}

var getDate = function(){
	var date = new Date();
	var hour = date.getHours();
	var period = "AM";
	var monthNames;
	if (hour > 12){
		hour = hour % 12;
		period = "PM";
	}
	var form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
	return form_date;
}

/**
 * User/Sender/Voter -> is the person doing the voting
 * Candidate -> is the person being voted for his/her hotness
 * Candidate/s is/are the sender's friend/s within the 13-21 age group
 **/

// Retrieve all female friends from age 14 - 23 
function processContenderSex(event) {
	var senderId = event.sender.id;
	request({
		url: "https://graph.facebook.com/v2.6/" + senderId + "/friends?gender=female&sex=female",
		qs: {
			access_token: process.env.PAGE_ACCESS_TOKEN,
			fields: "gender || sex"
		},
		method: "GET"
	}, function(error, response, body) {

	});
}

// Girls rating girls, boys rating boys not really a exciting thing
// Get voter's gender so 
// if user is a female she rates her friends that are boys
// if user is a male he rates his friends that are girls

function processVoterSex(event) {
	var senderId = event.sender.id;

	request({
		url: "https://graph.facebook.com/v2.6/" + senderId,
		qs: {
			access_token: process.env.PAGE_ACCESS_TOKEN,
			fields: "gender"
		},
		method: "GET"
	}, function(error, response, body) {
		var greeting = "";
		if (error) {
			console.log("Error getting user gender: " + error);
		} else {
			var bodyObj = JSON.parse(body);
			gender = bodyObj.gender;
			if (gender === "male") {
				rateGirls();
			} else if (gender === "female") {
				rateBoys();
			}
		}
	});
}

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
	else if (senderGender === "female") {
		// girls vote for boys hotness
	} else {
		// boys vote for girls hotness
	}
}
/*
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
FB.api('/me/friends', {fields: 'name,id,location,birthday'}, function(response) {
  //...
});
*/

function processCandidateProfilePicture(event) {
	//request({
	//	url: "https://graph.facebook.com/v2.6/" + senderId + "/friends/pictures"
	//})
}

/*
https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/p32x32/25299066_1427075520736791_7895762141614959026_n.jpg?oh=7059898388703004036bbc566659f38a&oe=5A8B3CA6
https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/c0.0.32.32/p32x32/25395848_328134744329406_8742747643512503740_n.jpg?oh=27936e7f8acd73b3c471dabc5d16cd26&oe=5AB7B45A
https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/p200x200/25398952_508400639544802_1868320785980351014_n.png?oh=44580410770e140865a10d5866c2272a&oe=5AB72B4B
*/


// Auto Publish top ten hottest friends in carousel post
function publishPost(pageId, article){
	request({
		url: "https://www.facebook.com/Stuck-Wan-Yah-508382589546607/",
		qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
		method: "POST",
		json: {
			recipient: {id: pageId},
			message: article
		}
	}, function(error, response, body) {
		if (err) console.error("Error posting article: " + response.error);
	});
}

function getSenderGender(userId) {
	request({
		url: "https://graph.facebook.com/v2.6/" + userId,
		qs: {
			access_token: process.env.PAGE_ACCESS_TOKEN,
			fields: "gender"
		},
		method: "POST"
	}, function(error, response, body) {
		var gender;
		if (err) {
			console.error("Error getting user gender: ", err);
		} else {
			var bodyObj = JSON.parse(body);
			gender = bodyObj.gender;
		}
		shimOrhim(gender);
	})
}

function getUserDetails(event) {
	var senderId = event.sender.id;

	async.waterfall([
		function(callback) {
			callback(null, 'one', 'two');
		},
		function(arg1, arg2, callback) {
			// arg1 now equals 'one' and arg2 now equals 'two'
			callback(null, 'three');
		},
		function(arg1, callback) {
			// arg1 now equals 'three'
			callback(null, 'done');
		}
	], function (err, result) {
		if (err) console.error(err);
		console.log(result);// result now equals 'done'
	});

	/*request({
		url: "https://graph.facebook.com/v2.6/" + senderId,
		fields: "",
		method: "GET"
	}, function(error, response, body) {
		var name, gender, age, image_url, friends
	})*/

}



// Process gender
function shimOrhim(gender) {
    return (gender === 'female' ? 'female' : 'male');
}

