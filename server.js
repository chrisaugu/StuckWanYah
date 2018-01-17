'use strict';
var path = require("path"),
	restful = require('node-restful'),
	mongoose = restful.mongoose,
	colors = require('colors'),
	express = require("express"),
	bodyParser = require("body-parser"),
	request = require("request"),
	async = require("async"),
	//xml2js = require("xml2js");
	//lwip = require('lwip'),
	fs = require('fs'),
	_ = require('underscore'),
	co = require("co");

var dir = require('node-dir');

var app = module.exports = express();

app.set('port', (process.env.PORT || 5000));

app.set('views', path.resolve(__dirname + '/'));
app.set('view engine', 'ejs');
app.use(express.static(path.join('./')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen(app.get('port'), function() {
	// Create new server
	console.log("Server running on port %d", app.get('port'));
});

// MongoDB
var db = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sweetlipsdb');
mongoose.connection.on("open", function() {
	console.log("Connected: Successfully connect to mongo server".green);
});
mongoose.connection.on('error', function() {
	console.log("Error: Could not connect to MongoDB. Did you forget to run 'mongod'?".error);
});

// Model
var Sweetlips = require("./models/sweetlips.model");
// Register photos model
Sweetlips.photos.methods(['get', 'put','post', 'delete']);
Sweetlips.photos.register(app, '/api/photos/list');
// Register site hits model
//Sweetlips.page_hits.methods(['get','put','delete','post']);
//Sweetlips.page_hits.register(app, "/api/hits");

var PHOTOS_COLLECTION = "photos";
var sourceDirectory = "photos/";
var photosCDN = require("./photos");
var photoId = 100000000;
var localPhotos = photosCDN;

//installImages();


var expectedScore = function (Rb, Ra) {
    return parseFloat((1 / (1 + Math.pow(10, (Rb - Ra) / 400))).toFixed(4));
};

var winnerScore = function (score, expected) {
    return score + 24 * (1 - expected);
};

var loserScore = function (score, expected) {
  return score + 24 * (0 - expected);
};

// Server index page
app.get("/", function (req, res) {
	var randomImages;
	var choices = ['female', 'male'];

	var randomGender = _.sample(choices);

	Sweetlips.photos
		.find({})
        //.find({ random: {$near: [Math.random(), 0] } })
        //.where("voted", false)
        .where("gender", randomGender)
        .limit(2)
        .exec(function(err, photos){
            if (err) return next(err);

        	randomImages = photos;

        	Sweetlips.photos.update({}, { 
            	$set: {voted: false } }, {multi: true}, 
            	function(err) {
            		if (err) return next(err);
            		//res.redirect('/');
            	});

        })
        .then(function(topRatings) {

        	if (randomImages.length === 2) {

        		res.render("index",{
        			images: randomImages,
        			expected: expectedScore,
        			//topRatings: topRatings[0]
                });
            }
        });
});

app.get("/rate", function(req, res, next) {

	var winnerID = req.query.winner || '';
	var loserID = req.query.loser || '';

	if (!winnerID || !loserID) {
		return res.status(400).send({ message: 'Voting requires two photos.' });
	}
	if (winnerID === loserID) {
		return res.status(400).send({ message: 'Cannot vote for and against the same photo.' });
	}

	async.parallel([
		function(callback) {
			Sweetlips.photos.findOne({ image_id: winnerID }, function(err, winner) {
				callback(err, winner);
			});
		},
		function(callback) {
			Sweetlips.photos.findOne({ image_id: loserID }, function(err, loser) {
				callback(err, loser);
			});
		}
	],
	function(err, results) {
		if (err) return next(err);

		var winner = results[0];
		var loser =results[1];

		if (!winner || !loser) {
			return res.status(404).send({ message: 'One of the photos no longer exists.' });
		}

		if (winner.voted || loser.voted) {
			res.status(200).end();
		}

		var winnerExpected = expectedScore(loser.scores, winner.scores);
        var winnerNewScore = winnerScore(winner.scores, winnerExpected);
        var loserExpected = expectedScore(winner.scores, loser.scores);
        var loserNewScore = loserScore(loser.scores, loserExpected);

		async.parallel([
			function(callback) {
				winner.wins++;
				winner.voted = true;
				winner.scores = winnerNewScore;
				winner.random = [Math.random(), 0];
				winner.save(function(err) {
					callback(err);
				});
			},
			function(callback) {
				loser.losses++;
				loser.voted = true;
				loser.scores = loserNewScore;
				loser.random = [Math.random(), 0];
				loser.save(function(err) {
					callback(err);
				});
			}
		], function(err) {
			if (err) return next(err);
			//res.redirect("/");
		});
	});

	// refresh the page
	res.redirect("/");


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
	if (req.body.object === "page") {
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
 * API Functions
 */
/**
 * HTTP GET /photos
 * Should return a list of photos
 */
app.get('/api/photos/list', function (req, res, next) {
	var params = req.query;

	//.collection(PHOTOS_COLLECTION)
	Sweetlips.photos
		.find(params, function(err, photos) {
		if (err) return next(err);
		res.send({photos: photos });
	});
});

/**
 * GET /api/photos
 * Returns 2 random photos of the same gender that have not been voted yet.
 */
app.get("/api/photos", function(req, res, next) {
	var choices = ['female', 'male'];
	var randomGender = _.sample(choices);

	Sweetlips.photos
		.find({ random: {$near: [Math.random(), 0] } })
		.where("voted", false)
		.where("gender", randomGender)
		.limit(2)
		.exec(function(err, photos){
			if (err) return next(err);

			if (photos.length === 2) {
				return res.send(photos);
			}

			var oppositeGender = _.first(_.without(choices, randomGender));

			Sweetlips.photos
				.find({ random: {$near: [Math.random(), 0] } })
				.where("voted", false)
				.where("gender", oppositeGender)
				.limit(2)
				.exec(function(err, photos) {
					if (err) return next(err);

					if (photos.length === 2) {
						return res.send(photos);
					}

					Sweetlips.photos.update({}, { $set: {voted: false } }, {multi: true}, function(err) {
						if (err) return next(err);
						res.send([]);
					});
				});
		});
});

/**
* POST /api/photos
* Adds new photo to the database.
*/
app.post('/api/photos', function(req, res, next) {
	var query = req.body;
	Sweetlips.photos.create(query, function(err, photos) {
		if(err) res.json(err);
		else{
			res.send(200, {photos: photos});
		}
	});
});

/*
app.post('/api/photos', function(req, res, next) {
	var gender = req.body.gender;
	var characterName = req.body.name;
	var characterIdLookupUrl = 'https://api.eveonline.com/eve/CharacterID.xml.aspx?names=' + characterName;
	var parser = new xml2js.Parser();
	async.waterfall([
		function(callback) {
			request.get(characterIdLookupUrl, function(err, request, xml) {
				if (err) return next(err);
				parser.parseString(xml, function(err, parsedXml) {
					if (err) return next(err);
					try {
						var characterId = parsedXml.eveapi.result[0].rowset[0].row[0].$.characterID;
						Sweetlips.photos.findOne({ characterId: characterId }, function(err, character) {
							if (err) return next(err);
							if (character) {
								return res.status(409).send({ message: character.name + ' is already in the database.' });
							}
							callback(err, characterId);
						});
					} catch (e) {
						return res.status(400).send({ message: 'XML Parse Error' });
					}
				});
			});
		},
		function(characterId) {
			var characterInfoUrl = 'https://api.eveonline.com/eve/CharacterInfo.xml.aspx?characterID=' + characterId;
			request.get({ url: characterInfoUrl }, function(err, request, xml) {
				if (err) return next(err);
				parser.parseString(xml, function(err, parsedXml) {
					if (err) return res.send(err);
					try {
						var name = parsedXml.eveapi.result[0].characterName[0];
						var race = parsedXml.eveapi.result[0].race[0];
						var bloodline = parsedXml.eveapi.result[0].bloodline[0];
						var character = new Sweetlips({
							characterId: characterId,
							name: name,
							race: race,
							bloodline: bloodline,
							gender: gender,
							random: [Math.random(), 0]
						});
						character.save(function(err) {
							if (err) return next(err);
							res.send({ message: characterName + ' has been added successfully!' });
						});
					} catch (e) {
						res.status(404).send({ message: characterName + ' is not a registered citizen of New Eden.' });
					}
				});
			});
		}
		]);
});

/**
 * PUT /api/photos
 * Update winning and losing count for both photos.
 */
app.put("/api/photos", function(req, res, next) {
	var winner = req.body.winner;
	var loser = req.body.loser;

	if (!winner || !loser) {
		return res.status(400).send({ message: 'Voting requires two photos.' });
	}
	if (winner === loser) {
		return res.status(400).send({ message: 'Cannot vote for and against the same photo.' });
	}

	async.parallel([
		function(callback) {
			Sweetlips.photos.findOne({ c_uid: winner }, function(err, winner) {
				callback(err, winner);
			});
		},
		function(callback) {
			Sweetlips.photos.findOne({ c_uid: loser }, function(err, loser) {
				callback(err, loser);
			});
		}
	],
	function(err, results) {
		if (err) return next(err);

		var winner = results[0];
		var loser =results[1];

		if (!winner || !loser) {
			return res.status(404).send({ message: 'One of the photos no longer exists.' });
		}

		if (winner.voted || loser.voted) {
			res.status(200).end();
		}

		async.parallel([
			function(callback) {
				winner.wins++;
				winner.voted = true;
				winner.random = [Math.random(), 0];
				winner.save(function(err) {
					callback(err);
				});
			},
			function(callback) {
				loser.losses++;
				loser.voted = true;
				loser.random = [Math.random(), 0];
				loser.save(function(err) {
					callback(err);
				});
			}
		], function(err) {
			if (err) return next(err);
			res.status(200).end();
		});
	});
});

/**
 * PUT /api/photos/:id
 * Update photo by id
 */
app.put("/api/photos/:id", function(req, res, next) {
	var id = req.params.id;

	Sweetlips.photos.remove({_id: id}, function(err) {
		if (err) return next(err);

		res.send("success");
	});
});

/**
 * GET /api/photos/count
 * returns the total number of photos
 */
app.get("/api/photos/count", function(req, res, next) {
	Sweetlips.photos.count({}, function(err, count) {
		if (err) return next(err);

		res.send({ count: count });
	});
});

/** 
 * GET /api/photos/top
 * Return 100 highest ranked photos. Filter by gender
 * GET /api/characters/top?race=caldari&bloodline=civire&gender=male
 * go along with /rankings.html
 */
app.get("/api/photos/top", function(req, res, next) {
	// Query params object
	var params = req.query;
	var conditions = {};

	_.each(params, function(value, key) {
		conditions[key] = new RegExp('^' + value + '$', 'i');
	});

	Sweetlips.photos
		.find(conditions)
		.sort('-wins') // Sort in descending order (highest wins on top)
		.limit(10)
		.exec(function(err, photos) {
			if(err) return next(err);

			// Sort by winning percentage
			photos.sort(function(a, b) {
				if (a.wins / (a.wins + a.losses) < b.wins / (b.wins + b.losses)) { return 1; }
				if (a.wins / (a.wins + a.losses) < b.wins / (b.wins + b.losses)) { return -1; }
				return 0;		
			});

			res.send(photos);
		});
});

/**
* POST /api/report
* Reports a character. Character is removed after 4 reports.
*/
app.post('/api/report', function(req, res, next) {
	var characterId = req.body.characterId;
	Character.findOne({ characterId: characterId }, function(err, character) {
		if (err) return next(err);
		if (!character) {
			return res.status(404).send({ message: 'Character not found.' });
		}

		character.reports++;
		if (character.reports > 4) {
			character.remove();
			return res.send({ message: character.name + ' has been deleted.' });
		}
		character.save(function(err) {
			if (err) return next(err);
			res.send({ message: character.name + ' has been reported.' });
		});
	});
});

/**
 * GET /api/hits
 * Get site hits
 */
app.get("/api/hits", function(req, res, next) {
	Sweetlips.page_hits.find({}, function(err, pages) {
		if (err) return next(err);
		res.send(pages);
	});
});
/**
 * PUT /api/hits
 * Collects site hits
 */

app.put("/api/hits", function(req, res, next) {
	Sweetlips.page_hits.update({page_name: "dummy_hits"/*req.body.page_name*/},
		{$inc: {page_hits: 1}}, {upsert:true},
		function(err, hit) {
			if (err) return next(err);

			res.send({ hits: hit.page_hits});
		});
});

function getRating (winner, loser) {
	var K = 30,
		winnerExpected,
		loserExpected;

	winnerExpected = 1 / (1 + (Math.pow(10, (loser.rating - winner.rating) / 400)));
	loserExpected = 1 / (1 + (Math.pow(10, (winner.rating - loser.rating) / 400)));
	return {
		winner: Math.round(winner.rating + (K * (1 - winnerExpected))),
		loser: Math.round(loser.rating + (K * (0 - loserExpected)))
	};
};

function topTenRatings(req, res, next) {
	Sweetlips.photos
		.find({})
		.sort({'rating': -1})
		.limit(10)
		.exec(function(err, result) {
			if (err) next(err);

			res.locals.topTen = result;
			next();
		});
};

/** 
 * POST /api/photos/install
 * Installing all photos in /photos/ directory onto mongodb
 */
var installImages = function(req, res, next) {

	var images = [];

	fs.readdirSync(sourceDirectory).forEach(function(fileName, index) {
		images[index] = {filename: fileName}
	});


			var query = {
				"user_id": "1234567890123456",
				"name": "", // his/her name from facebook
				"age": 13, // is s/he old enough or young enough to be voted
				"gender": "female", // is s/he a male or female
				"image_src": "/photos/" + file,//
				"thumb_src": "https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/p200x200/"+file, // his/her facebook dp
				"profile_uri": "https://web.facebook.com/profile.php?id=", // his/her facebook 
				"is_blocked": false, // does she wanna play
				"rating": 0, // ratings of him/her
				"wins": 0, // number of wins s/he score
				"losses": 0, // number of losses s/he scores
				"random": 0, // random number for selection
				"voted": false, // has s/he been voted already
				"vote_counts": 0, // number of time has s/he been played
				"vote_timestamp": Date.now, // any given time s/he been voted
				"ranking": 0, // his/her hotness ranking
				"base_rating": 1400, // just a base rating for voting
			}

			Sweetlips.photos.insertMany(photosAll, function(err, photos) {
				if (err) return next(err);
				else {
					res.send(200)
					console.log("photo uploaded successfully");
				}
	});
};


/**
 * Processing Images
 */
fs.readdir(sourceDirectory, function (err, files) {
    if (err) console.log(err);
    //console.log(files);

    files.forEach(function(file) {
        scaleImage(file);
    });

});

function scaleImage(file) {
/*
	lwip.open(sourceDirectory + file, function(err, image) {
		if (err) console.log(err);
		if (image) {
			var width = 400,
				height = 400,
				imageHeight = image.height(),
				imageWidth = image.width(),
				ratio;
			ratio = Math.max(width / imageWidth, height / imageHeight);

			image.batch()
				.scale(ratio)
				.crop(400, 400)
				.writeFile(destinationDirectory + file, function(err) {
					if (err) console.log(err);
					console.log(file + ": has been processed");
				});
		} else {
			console.log('couldn\'t find no photo');
		}
	});
*/
}
