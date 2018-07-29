"use strict";
var request = require("request");

module.exports = function(app) {

	/** Server index page */
	//app.get("/", function (req, res) {
    //	res.send("Deployed!");
	//});

	/**
	 * GET /webhook
	 * Facebook Webhook Endpoints
	 * Used for messenger verification
	 */	
 	app.get("/webhook", function (req, res) {
    	if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        	console.log("Verified webhook");
        	res.status(200).send(req.query["hub.challenge"]);
    	} else {
        	console.error("Verification failed. The tokens do not match.");
        	res.sendStatus(403);
    	}
	});

	/** 
	 * POST /webhook
	 * All callbacks for Messenger will be POST-ed here 
	 */
	app.post("/webhook", function (req, res) {
		// Make sure this is a page subscription
		if (req.body.object === "page") {
			// Iterate over each entry
			// There may be multiple entries if batched
			req.body.entry.forEach(function(entry) {
				// Iterate over each messaging event
				entry.messaging.forEach(function(event) {
					if (event.postback) {
						processPostback(event);
					}
				});
			});
		
			res.sendStatus(200);
		}	
	});

	function processPostback(event) {
		var senderId = event.sender.id;
		var payload = event.postback.payload;
		if (payload === "GET_STARTED") {
			// Get user's first name from the User Profile API
			// and include it in the greeting
			request({
				url: "https://graph.facebook.com/v2.6/" + senderId,
				qs: {
					access_token: process.env.PAGE_ACCESS_TOKEN,
					fields: "first_name"
				},
				method: "GET"
			}, function (error, response, body) {
				var greeting = "", name;
				if (error) {
					console.log("Error getting user's name: " + error);
				} else {
					var bodyObj = JSON.parse(body);
					name = bodyObj.first_name;
					greeting = "Hi " + name + ". ";
				}
				var message = greeting + "";
				sendMessage(senderId, {text: message});
			});
		}
	}

	// sends message to user
	function sendMessage(recipientId, message) {
		request({
			url: "https://graph.facebook.com/v2.6/me/messages",
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
	
}