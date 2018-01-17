
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

//additional setup to allow CORS requests
var allowCrossDomain = function(req, response, next) {
	response.header('Access-Control-Allow-Origin', "*");
	response.header('Access-Control-Allow-Methods', 'OPTIONS, GET,PUT,POST,DELETE');
	response.header('Access-Control-Allow-Headers', 'Content-Type');
	if ('OPTIONS' == req.method) {
		response.send(200);
	}else {
		next();
	}
};
router.use(allowCrossDomain);


//Server index page
app.get("/", function(req, res) {
	res.sendFile("index.html");
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
	var query = {FB_UID = userId};
	Sweetlips.findOne({user_id: userId}, function(err) {
		if (err) {
			sendMessage(userId, {text: "Something went wrong. Try again"});
		} else {
			sendMessage(userId, {text: "Your photo has been blocked. You will not be able to be voted nor vote again in the future."})
		}
	})

	return true;
}
function processUnblock(userId) {
	var query = {FB_UID = userId};
	Sweetlips.findOne({user_id: user_id}, function(err, response) {
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


function findPhoto(id, array){
	for(var i =0; i<array.length; i++){
		if(photos[i].id === id){
			return array[i];
		}
	}
	return null;
}

function deletePhoto(id, array){
	var arrayIndex = 0;
	for(var i=0; i<array.length; i++){
 		if(array[i].user_id === id){
 			arrayIndex = i;
 		}
 	}
 	array.splice(photoIndex, 1);
 	return array;
}

function blockPhoto(id, array) {
 	for (var i=0; i<array.length; i++) {
 		if (array[i].user_id === id) {
 			if (array[i].is_blocked === false) {
 				array[i].is_blocked === true;
 				return res.send("You are blocked.");
 			} else {
 				return res.send("You are already been blocked.");
 			}
 		}
 		return res.send("User with the ID: ${id} cannot be found.");
 	}
 	return array;
 }

 function unblockPhoto(id, array) {
 	for (var i=0; i<array.length; i++) {
 		if (array[i].user_id === id) {
 			if (array[i].is_blocked === false) {
 				return res.send("You are unblocked.");
 			} else {
 				return res.send("You can't be unblocked unless you're blocked.");
 			}
 		} else {
 			return res.send("User with the ID: ${id} cannot be found.");
 		}
 	}
 	return array;
 }

function filterPhotosGender(gender, array){
  var specPhotos = [];
	for (var i=0; i<array.length; i++) {
		if(array[i].sex === gender){
      specPhotos.push(array[i]);
			return specPhotos;
		}
	}
	return null;
}

var getDate = function(){
	date = new Date();
	hour = date.getHours();
	period = "AM";
	if (hour > 12){
		hour = hour%12;
		period = "PM";
	}
	form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
	return form_date;
}

function rateBoys(argument) {
	// body...
}

function rateGirls(argument) {
	// body...
}


/**
 * User/Sender -> is the person doing the voting
 * Candidate -> is the person being voted for his/her hotness
 * Candidate/s is/are the sender's friend/s
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

// Girls rating girls, boys rating boys not really a exciting
// Get voter's gender so 
// if user is a female she rates her friends that are boys
// if user is a male he rates his friends that are girls

function processVoterSex(event) {
	var senderId = event.sender.id;

	request({
		url: "https://graph.facebook.com/v2.6/" + senderId,
		qs: {
			access_token: process.env.PAGE_ACCESS_TOKEN,
			fields: gender;
		},
		method: "GET"
	}, function(error, response, body) {
		var greeting = "";
		if (error) {
			console.log("Error getting user gender: " + error);
		}else{
			var bodyObj = JSON.parse(body);
			gender = bodyObj.gender;
			if (gender === "male") {
				rateGirls();
			}else if (gender === "female") {}{
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
	else if (senderGender === "Female") {
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


var router = module.exports = require('express').Router();
var bodyParser=require('body-parser');

var bookId = 100;

//Parses the JSON object given in the body request
router.use(bodyParser.json());

var books = [
	{id: 96, author: "Theodore Roosevelt", title: "The Rough Riders"},
	{id: 97, author: "Scheherazade", title: "One Thousand and One Nights"},
	{id: 98, author: 'Stephen King', title: 'The Shining', year: 1977},
	{id: 99, author: 'George Orwell', title: 1949}
];

function findBook(id){
	for(var i =0; i<books.length; i++){
		if(books[i].id === id){
			return books[i];
		}
	}
	return null;
}

function removeBook(id){
	var bookIndex = 0;
	for(var i=0; i<books.length; i++){
 		if(books[i].id === id){
 				bookIndex = i;
 		}
 	}
 	books.splice(bookIndex, 1);
 }

/**
* HTTP GET /books
* Should return a list of books
*/
router.get('/', function (request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	console.log('In GET function ');
	response.json(books);
});

/**
* HTTP GET /books/:id
* id is the unique identifier of the book you want to retrieve
* Should return the task with the specified id, or else 404
*/
router.get('/:id', function(request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	console.log('Getting a book with id ' + request.params.id);
	
	var book = findBook(parseInt(request.params.id,10));
	if(book === null){
		response.send(404);
	}else{
		response.json(book);
	}
});

/**
* HTTP POST /books/
* The body of this request contains the book you are creating.
* Returns 200 on success
*/
router.post('/', function (request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	
	var book = request.body;
	console.log('Saving book with the following structure ' + JSON.stringify(book));
	book.id = bookId++;
	books.push(book);
	response.send(book);
});

/**
* HTTP PUT /books/
* The id is the unique identifier of the book you wish to update.
* Returns 404 if the book with this id doesn't exist.
*/
router.put('/:id', function (request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	
	var book = request.body;
	console.log('Updating Book ' + JSON.stringify(book));
	
	var currentBook = findBook(parseInt(request.params.id,10));
	if(currentBook === null){
		response.send(404);
	}else{
		//save the book locally
		currentBook.title = book.title;
		currentBook.year = book.year;
		currentBook.author = book.author;
		response.send(book);
	}
});

/**
* HTTP DELETE /books/
* The id is the unique identifier of the book you wish to delete.
* Returns 404 if the book with this id doesn't exist.
*/
router.delete('/:id', function (request, response) {
	console.log('calling delete');
	response.header('Access-Control-Allow-Origin', '*');
	
	var book = findBook(parseInt(request.params.id,10));
	if(book === null){
		console.log('Could not find book');
		response.send(404);
	}else{
		console.log('Deleting ' + request.params.id);
		removeBook(parseInt(request.params.id, 10));
		response.send(200);
	}
	response.send(200);
});

