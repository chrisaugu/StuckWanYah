// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
var express = require("express")
	, http = require("http")
	, https = require("https")
	, ejs = require('ejs')
	, session = require("express-session")
	, RedisStore = require('connect-redis')(session)
	, MongoDBStore = require('connect-mongodb-session')(session)
	, cookieParser = require('cookie-parser')
	, Redis = require('redis')
	, mongoose = require("mongoose")
	, morgan = require("morgan")
	, _ = require('underscore')
	, moment = require("moment")
	, bodyParser = require("body-parser")
	, path = require("path")
	, favicon = require('serve-favicon')
	, parseurl = require('parseurl')
	, request = require('request-promise')
	, passport = require('passport')
	, FacebookStrategy = require('passport-facebook').Strategy
	, jwt = require('jwt-simple')
	, CryptoJS = require('crypto-js')
	, crypto = require("crypto")
	// , expressJwt = require('express-jwt')
	, xml2js = require("xml2js")
	, fs = require('fs')
	, async = require("async")
	, colors = require('colors')
	, Elo = require('arpad')
	, dotenv = require('dotenv').config()
	, cors = require('cors')
	, logSymbols = require('log-symbols')
	, keys = require("./config/keys");

// Creating Global instance for express
const app = express();
let server;

server = http.createServer(app);

// server = https.createServer({
// 	key: fs.readFileSync('./ca-key.pem'),
// 	cert: fs.readFileSync('./ca-cert.pem')
// }, app);

const router = express.Router();

var sourceDirectory = "app/images/photos/";
// Invoke model
let Sweetlips = require("./models/sweetlips");
// Register photos model
// var Photos = Sweetlips.photos;
// var Hits = Sweetlips.hits;
// var BlockedPhotos = Sweetlips.blockedPhotos;
const Photos = mongoose.model('photos');
const Hits = mongoose.model('hits');
// const BlockedPhotos = mongoose.model('blockedPhotos');

// Express configuration
app.set('port', process.env.PORT);
app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'app')));
app.use('/photos', express.static(path.join(__dirname, 'app/images/photos')));
app.use('/instantgame', express.static(path.join(__dirname, 'instantgame')));

app.use(morgan('dev')); // log every request to the console.
app.use(favicon(path.join(__dirname, 'app', 'favicon.ico')));
// Parse POST request data. It will be available in the req.body object
app.use(bodyParser.urlencoded({ extended: true }));
// Check Facebook Signature
app.use(bodyParser.json({
	verify: check_fb_signature
}));

app.use(cors());

passport.use(new FacebookStrategy({
	// options for the facebook strat
	clientID: keys.facebook.appID,
	clientSecret: keys.facebook.appSecret,
	callbackURL: keys.facebook.callbackURL,
	profileFields: keys.facebook.profileFields,
	state: true
}, function verify(accessToken, refreshToken, profile, done) {
	// Photos.findOrCreate({ 'facebook.id': profile.id }, function(err, user) {
	// 	return done(err, user);
	// });

  // check if photo already exists in the db
  Photos.findOne({ 'facebook.id' : profile.id }, function(err, user) {
    if (err) throw err;

    if (user) {
			// already have the photo, update the photo, and accessToken
			console.log("user is:", user);

			user.picture = profile.photos[0].value;
			// user.profileUrl = profile.__json.link;
			user.facebook['accessToken'] = accessToken;
			
			user.save(function(error, result) {
				if (err) throw error;
				return done(null, result);
			});
		}
    else {
			// if not, create user in the db
			let photo = new Photos();

			photo.imageId = profile.id;
			
			// Full name
			if (profile._json.name) {
				photo.fullName = profile._json.name;
			}
			else if (profile._json.first_name || profile._json.last_name) {
				photo.fullName = `${profile._json.first_name} ${profile._json.last_name}`;
			}

			// First name
			if (profile._json.first_name) {
				photo.firstName = profile._json.first_name;
			}
			else if (profile.name.givenName) {
				photo.firstName = profile.name.givenName;
			}
			else {
				photo.firstName = profile._json.name.split(' ')[0];
			}
			
			// Last name
			if (profile._json.last_name) {
				photo.lastName = profile._json.last_name;
			}
			else if (profile.familyName) {
				photo.lastName = profile.familyName;
			}
			else {
				photo.lastName = profile._json.name.split(' ')[1];
			}

			// age
			if (profile._json.age_range) {
				if (profile._json.age_range.max && profile._json.age_range.min) {
					photo.age = (profile._json.age_range.max + profile._json.age_range.min) / 2;
				}
				if (profile._json.age_range.max) {
					photo.age = profile._json.age_range.max;
				}
				if (profile._json.age_range.min) {
					photo.age = profile._json.age_range.min;
				}
			}
			// profile.hasOwnProperty('birthday')
			else if (profile._json.birthday) {
				photo.age = (new Date().getYear() - new Date(profile._json.birthday).getYear());	
			}

			// gender
			if (profile._json.gender) {
				photo.gender = profile._json.gender;
			}

			// picture
			if (profile.picture) {
				photo.picture = profile._json.picture.data;
			}
			else {
				photo.picture = profile.photos[0].value;
			}

			// profile url
			if (profile._json.link) {
				photo.profileUrl = profile._json.link;
			}
			
			// fbid
			if (profile._json.id) {
				photo.facebook['id'] = profile._json.id;
			}
			
			// friends
			if (profile._json.friends) {
				photo.facebook['friends'] = profile._json.friends.data;
			}

			// access token
			photo.facebook['accessToken'] = accessToken;

			photo.save((error, newPhoto) => {
				if (error) throw error;
				console.log('new photo created:', newPhoto);
				done(null, newPhoto);
			});
		}
	});

	// done(null, profile);
}));

/** Registers a function used to serialize user objects into the session. */
passport.serializeUser((user, done) => {
	// done(null, user.facebook.id);
	process.nextTick(function() {
		done(null, user);
		// done(null, { id: user.id, username: user.username, name: user.name, gender: user.gender, link: user.profileUrl, picture: user.photos[0].value});
	});
});

/** Registers a function used to deserialize user objects out of the session. */
passport.deserializeUser((user, done) => {
	// Photos.findOne({'facebook.id': id}, function (err, user) {
	// 	done(err, user);
	// });
	process.nextTick(function() {
		return done(null, user);
	});
});

app.use(cookieParser());

var store = new MongoDBStore({
  uri: process.env.MONGODB_ADDON_URI,
  collection: 'sessions'
});
store.on('error', function(error) {
  console.log(error);
});
// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
	// key: 'user_sid',
	secret: keys.session.cookieSecret,
	resave: false,
	saveUninitialized: false,
	// store: new RedisStore({ client: new Redis() })
	// store: new RedisStore({
	// 	url: config.redisStore.url
	// }),
	store: store,
	// cookie: { maxAge: 3 * 24 * 60 * 60 * 1000, expires: 600000 } // 72 hours (3 days)
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));

// app.use((req, res, next) => {
// 	if (!req.session.views) req.session.views = {}
// 	// get the url pathname
// 	var pathname = parseurl(req).pathname;
// 	// count the views
// 	req.session.views[pathname] = (req.session.views[pathname] || 0) + 1;
//
// 	if (req.session.seenyou) {
// 		res.setHeader('X-Seen-You', true);
// 	} else {
// 		// setting a property will automatically cause a Set-Cookie response to be sent
// 		req.session.seenyou = true;
// 		res.setHeader('X-Seen-You', false);
// 	}
//
// 	res.locals.session = req.session;
// 	req.session.visitors = (req.session.visitors || 0) + 1;
// 	// req.session.gender = 'male';
//
// 	next();
// });

// app.use(async (req, res, next) => {
// 	try {
// 		// if (!req.headers.authorization) throw new Error('Authorization header is required');
// 		// const accessToken = req.headers.authorization.trim().split(' ')[1];
// 		// await oktaJwtVerifier.verifyAccessToken(accessToken);
// 		if (isAuthenticated(req, res, next)) {
// 			next()
// 		}
// 		// res.redirect('/');
// 		next();
// 	} catch (error) {
// 		next(error.message);
// 	}
// });

// Invoke instance to listen to port
// Create new server
server.listen(app.get('port'), function() {
	console.log("-------------------------------------------".blue);
	console.log(":".blue + " " + "StuckWanYah server running on port %d".magenta + " :".blue, app.get('port'));
	console.log("-------------------------------------------".blue);
});

var opts = {
	useNewUrlParser: true,
	useUnifiedTopology: true
};
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_ADDON_URI, opts);
mongoose.connection.on("connected", function() {
	console.log("-----------------------------------------------------".blue);
	console.log(":".blue + " " + logSymbols.success, "Connected: Successfully connect to mongo server".green + " :".blue);
	console.log("-----------------------------------------------------".blue);
});
mongoose.connection.on('error', function() {
	console.log(logSymbols.error, "Error: Could not connect to MongoDB. Did you forget to run 'mongod'?".red);
	console.log("----------------------------------------------------------------------------".blue);
});

// API namespace
app.use('/api', router);

/**
 * Routes
 */
// Server index page
app.get("/", isLoggedIn, function (req, res, next) {
	renderIndexPage({
		params: req,
		success: function(obj) {
			res.render("home.html", obj);
		},
		error: function(err) {
			console.error("Error occurred: ", err);
		}
	});
});

app.get("/rate", isLoggedIn, function(req, res, next) {
	rateImages({
		params: req,
		success: function(obj) {
			res.redirect('/');
		},
		error: function(err) {
			console.error("Error occurred while rating: ", err);
		}
	});
});

app.get("/tie", isLoggedIn, function(req, res, next) {
	tieBreaker({
		params: req,
		success: function(obj) {
			res.redirect('/');
		},
		error: function(err) {
			next(err);
		}
	});
});

// connect to facebook page
app.route('/foo')
	.get(function (req, res) {
		// if (req.user) {
		// 	Photos.findOne({"facebook.id": req.user.id}, (err, user) => {
		// 		if (err) {
		// 			throw err;
		// 		}
		// 		res.render('profile.html', { user: user });
		// 	});
		// }
		// else {
			res.render('connect.html', { user: req.user });
		// }
	})
	.post((req, res) => {
		let data = req.body;

		// console.log(data);
		// res.json(data);

		let query = {"facebook.id": req.user.facebook.id},
			// update = {
			// 	name: profile.displayName,
			// 	accessToken: accessToken
			// },
			options = {upsert: true, new: true, setDefaultsOnInsert: true};
		
		// Photos.findOneAndUpdate(query, photo, options, function (error, result) {
		// 	if (error) throw error;
		// 	// if (error) return;
		// 	res.send(result);

		// 	// res.redirect('/foo');
		// });

		Photos.findOne(query).exec((err, photo) => {
			if (err) {
				throw err;
			}

			if (photo) {
				if (!photo.fullName) {
					photo['fullName'] = `${data.first_name} ${data.last_name}`;	
				}
				
				if (!photo.firstName) {
					photo['fistName'] = data.first_name;
				}
				
				if (!photo.lastName) {
					photo['lastName'] = data.last_name;
				}

				if (!photo.age) {
					photo['age'] = (new Date().getYear() - new Date(data.birthday).getYear());	
				}

				if (!photo.gender) {
					photo['gender'] = data.gender;
				}

				photo.save(function(error, result) {
					if (error) { console.log(error); }
					console.log(result);
				})
			}
		});
	});

app.get('/bar', isLoggedIn, function (req, res, next) {
	// var session = req.session;
	// var someAttribute = session.someAttribute;

	// session.someAttribute = "foo";
	// session.seenyou = true;
	// session.user_id;
	// session.gender = "male";
	// session.authenticated = true;
	// session.access_token;

	// if (req.session.views) {
	// 	res.write(`<p>Welcome user: ${session.user_id} </p>\n`);
	// 	res.write('<p>Returning with some text: ' + session.someAttribute + '</p> \n');
	// 	res.write('<p>you viewed this page ' + req.session.views['/bar'] + ' times </p> \n');
	// 	res.write('<p>expires in: ' + (session.cookie.maxAge / 1000) + 's</p>');
	// 	res.write(`<p>This will print the attribute I set earlier: ${ someAttribute }</p>\n`);
	// 	res.end('done');
	// } else {
	// 	req.session.views = 1;
	// 	res.end('welcome to the session demo. refresh!');
	// }
	res.render("profile.html", { user: req.user });
});

/**
 * Route /perfectMatch
 */
app.route("/perfectMatch")
	.get(function(req, res, next) {
		async.parallel({
			female: function(callback) {
				Photos.findOneRandom({
					gender: "female",
					imageId: {$nin: [req.session.user_id]}
				}, function(error, female) {
					callback(error, female);
				});
			},
			male: function(callback) {
				Photos.findOneRandom({
					gender: "male",
					imageId: {$nin: [req.session.user_id, 100004177278169] }
				}, function(error, male) {
					callback(error, male);
				});
			}
		}, function(error, results) {
			if (error) return next(error);
			res.render("perfectMatch.html", {match: results});
		});
	})
	.post(function(req, res, next) {
		var maleId = req.query.male;
		var femaleId = req.query.female;
		async.parallel({
			female: function(callback) {
				Photos.findById(femaleId).then(function(response) {
					callback(null, response);
				}).catch(function(error) {
					callback(error);
				});
			},
			male: function(callback) {
				Photos.findById(maleId).then(function(response) {
					callback(null, response);
				}).catch(function(response) {
					callback(error);
				});
			}
		}, function(error, results) {
			if (error) return next(error);
			res.redirect("/perfectMatch");
		});
	});


/**
 * REST API Routes Endpoints
 */

/**
 * GET /api/photos
 * Get all photos
 */
router.get('/photos', function(req, res, next) {
	Photos.find({})
	.exec()
	.then(function(result) {
		res.json(result);
	})
	.catch(function(error) {
		res.send(error);
	})
})

/**
 * PUT /api/photos
 * Update winning and losing count for both photos.
 */
router.put('/photos', function(req, res, next) {
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
				Photos.findOne({
					imageId: winner
				}, function(err, winner) {
					callback(err, winner);
				});
			},
			function(callback) {
				Photos.findOne({
					imageId: loser
				}, function(err, loser) {
					callback(err, loser);
				});
			}
		],
		function(err, results) {
			if (err) return next(err);

			var winner = results[0];
			var loser = results[1];
			var rating;

			rating = getRating(winner, loser);

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
					winner.ratings = rating.winner;
					winner.random = [Math.random(), 0];
					winner.save(function(err) {
						callback(err);
					});
				},
				function(callback) {
					loser.losses++;
					loser.voted = true;
					loser.ratings = rating.loser;
					loser.random = [Math.random(), 0];
					loser.save(function(err) {
						callback(err);
					});
				}
			], function(err) {
				if (err) {
					return next(err);
				}
				res.status(200).end();
			});

		});
});

/**
 * GET /api/photos
 * For StuckWanYah Facebook InstantGame, runs on user Facebook feeds
 * Returns 2 random photos of the same gender that have not been voted yet.
 */
router.get("/photos/twophotos", function(req, res, next) {
	var uid = req.query.uid;
	var signature = req.query.signature;
	var gender = req.query.gender;

	var choices = ['female', 'male'];
	var randomGender;

	if (gender) {
		randomGender = shim(gender);
	}
	else {
		randomGender = _.first(_.shuffle(choices));
		// randomGender = _.sample(choices);
	}

	// request two photos that are friends of the uid
	Photos.findRandom({
		gender: randomGender,
		age: { $gt: 13 }
	}, {}, {
		limit: 2
	}, function(err, photos) {
		// Photos
		// .find({"random": {$near: [Math.random(), 0]}})
		// .where("voted", false)
		// .where("gender", randomGender)
		// .limit(2)
		// .exec(function(err, photos) {
		if (err) {
			return next(err);
		}

		if (photos.length === 2) {
			return res.send(photos);
		}

		var oppositeGender = _.first(_.without(choices, randomGender));

		Photos.find({"random": {$near: [Math.random(), 0]}})
			.where("voted", false).where("gender", oppositeGender).limit(2).exec(function(err, photos) {
			if (err) {
				return next(err);
			}

			if (photos.length === 2) {
				return res.send(photos);
			}

			Photos.update({}, {
				$set: {
					voted: false
				}
			}, {
				multi: true
			}, function(err) {
				if (err)
					return next(err);
				res.send([]);
			});
		});
	});
});

/**
 * GET /api/photos/top?gender=male
 * Return 10 highest ranked photos. Filter by gender
 */
router.get('/photos/top', isLoggedInApi, function(req, res, next) {
	console.log('674: ' + req.query);

	topTenRatings({
		params: req,
		success: function(obj) {
			res.locals.topTen = obj;
			res.send(obj);
		}
	});
});

/**
 * GET /api/photos/top/share
 * Share the top 10 highest ranked photos on Facebook
 */
router.get('/photos/top/share', function(req, res, next) {
	var userId = req.session.user_id;

	var content = {
		sender: userId,
		caption: "",
		url: ""
	};

	publishTopTenHottestPhotos(content);
});

/**
 * GET /api/photos/hottest
 */
router.get('/photos/hottest', function (req, res, next) {
	var gender = shim(req.session.gender);

	Photos.find({})
		.sort({'ratings': -1})
		.where({"gender": gender})
		.limit(1)
		.exec(function(err, result) {
			if (err) res.send(err);
			res.json(result);
		});
});

/**
 * GET /api/photos/me
 * display my profile
 */
router.get('/photos/me', function (req, res, next) {
	var userId = req.session.user_id;
	Photos.findOne({imageId: userId}).then((user) => {
		if (!user) console.log('user not found');
		res.json(user);
	});
});

router.get('/photos/me/block', function (req, res, next) {
	var userId = req.session.user_id; //req.query.userId;
	processBlockUnblock(userId);
});

// list all my facebook friends playing stuckwanyah
router.get('/photos/me/friends', isLoggedInApi, function(req, res, next) {
	var userId = req.user._id;

	Photos
		.find({"_id": userId})
		.lean()
		.populate('friends')
		// .select(['imageId'])
		.exec(function(err, friendslist) {
			if (err) {
				return new Error(err);
			}
			friendslist && res.json(_.uniq(friendslist[0].friends));
		});
});
// run an aggregate query that gets all the photos I voted for.
router.get('/photos/me/whoIvote', function(req, res) {
	Photos.aggregate(
		{$project: {imageId: 1, voted_by: 1}},
		{$unwind: '$voted_by'},
		{$group: {
				_id: '$voted_by',
				votes: {$addToSet: '$imageId'}
			}}, function(err, result) {
			if (err) throw err;
			res.send(result)
		});
});

// run an aggregate query that gets all the photos that voted me.
router.get('/photos/me/whovoteme', function(req, res) {
	Photos.aggregate(
		{$project: {imageId: 1, voted_by: 1}},
		{$unwind: '$voted_by'},
		{$group: {
				_id: '$voted_by',
				votes: {$addToSet: '$imageId'}
			}}, function(err, result) {
			if (err) throw err;
			res.send(result)
		});
});

// populate my facebook friends list with names
router.get('/photos/me/friends/populate', function (req, res, next) {
	var userId = req.user._id;
	//populateFriendsList('100004177278169');
	Photos.find({}, function(err, friendslist) {
		if (friendslist) {
			Photos.findOne({_id: userId}).then((user) => {
				if (!user) console.log('user not found');
				else {
					var i;
					for (i = 0; i < friendslist.length; i++) {
						if (friendslist[i]._id === user._id) {
							console.log("can't add yourself to your list");
							continue;
						}
						//user.facebookFriends.every(function(item) {
						//	console.log(item == friendslist[i].id)
						//	//console.log("can't add same person multiple times");
						//})

						if (user.friends) {
							if (!user.friends.includes(friendslist[i]._id)) {
								user.friends.push(friendslist[i]._id)
								// user.friends.push({
								// 	_id: friendslist[i].id,
								// 	facebook: {id: friendslist[i].imageId}
								// });
							}
						}
					};
					user.save(function (error, savedProfile) {
						if (error) console.log(error);
						else console.log('friends list updated');
					});
				}
			});
		}
	});
});

/**
 * GET /api/stats
 * GET /api/photos/count
 * Display Database statistics
 * Returns the total # of photos in the Database
 * total photos
 */
router.get('/stats', function(req, res, next) {
	async.parallel([
			function(callback) {
				Photos.count({}, function(err, count) {
					callback(err, count);
				});
			},
			function(callback) {
				// total females
				Photos.count({gender: "female"}, function(err, femaleCount) {
					callback(err, femaleCount);
				});
			},
			function(callback) {
				// total males
				Photos.count({gender:"male"}, function(err, maleCount) {
					callback(err, maleCount);
				});
			},
			function(callback) {
				// total votes cast
				Photos.aggregate([
					{$group: {_id: null, total: {$sum: '$wins' }}}],
					function(err, winsCount) {
						callback(err, winsCount[0].total);
					}
				)
			},
			function(callback) {
				// total page hits
				Hits.aggregate([
					{ $group: {_id: null, total: { $sum: '$hits' } } }],
					function(err, pageHits) {
						var pageHits = pageHits.length ? pageHits[0].total : 0;
						callback(err, pageHits);
					}
				)
			},
			function(callback) {
				// total blocked photos
				Photos.count({'is_blocked':true}, function(err, blocked) {
					callback(err, blocked);
				});
			},
			function(callback) {
				// total number of visitors per month
				Hits.count('monthly', function(err, visitors) {
					callback(err, visitors);
				});
			}
		],
		function(err, results) {
			if (err) return next(err);
			var totalCount = results[0];
			var femaleCount = results[1];
			var maleCount = results[2];
			var totalVotes = results[3];
			var pageHits = results[4];
			var blockedPhotos = results[5];
			var totalVisitors = results[6];

			res.send({
				totalPlayerCount: totalCount,
				femalePlayerCount: femaleCount,
				malePlayerCount: maleCount,
				blockedPhotos: blockedPhotos,
				totalVotes: totalVotes,
				totalPageHits: pageHits,
				totalVisitors: totalVisitors
			});
		});
});

/**
 * PUT /api/hits
 * Update site hits
 */
router.put("/hits", function(req, res, next) {
	processPageHits({
		params: req,
		success: function(obj) {
			res.send(obj);
		},
		error: function(err) {
			console.error("Error occurred: ", err);
		}
	});
});

router.get('/auth/me', (req, res) => {
  res.redirect(`https://www.facebook.com/v6.0/dialog/oauth?client_id=${keys.facebook.appID}&redirect_uri=${encodeURIComponent('https://stuckwanyah.herokuapp.com/api/oauth-redirect')}`);
});

/**
 * GET /api/auth
 * After loading has finished, show dialog asking for user gender. Gender is sent along with uid and signature to server
 * Server keeps stateless session using uid, identifies request using signature and make matches using gender.
 */
router.get("/auth", function(req, res, next) {
	var uid = req.query.uid;
	var signedRequest = /*req.query.signature; */ "uXSRy9L974TssLiqGW44CJwediE6hv1vxxPJeu-H_vo.eyJ1c2VyX2lkIjoiOTU0Mjc5MjUxMzg3OTc1IiwiY29kZSI6IkFRQW1vNEpsNkhGcE5VNzh1Vk0wd0RVNXF6bmRiVmF1VDFDV01NaG1GUXZMV25reFhkZDloQ0psQWpKVFh1NldKUEhweXdQdFJlZ1ZMamNHSno4Rk5SdS1kNFhGYkdmQjBtOWZMNjVMTHJ2LUx5WlpVTFBrRG9FYTRZbDg0SGMyNFdoNEw3NGtCd3RZdVJUczlJMy1vUlp5Z1RBeXpIT1k4aUFSY3g0TVpNQnpJNHpxMU9TM19wSE5tZUtxbEdKdVoyaTcxcWwwSHBTOUp6TWQzcm1qRGZGNXVEYVRLb01pcWUzVEMwOHhMRjlNNHp1ckdMNFQ2VEhhTmdIVW95bXJ2WWlqYWx4Nzhrcnl4a3dycnE2MWdYd3BVSUVzVDRxVVJiZ0VjMWhzVjNKSGVnR3BabUs5djJLZGI4bG5JdzA4QXZpWjhuZjUwOURnZHpsUWxHSUVuZ1JfTG1nUE1VVmpuLWJBd2JaREk2ODRQZyIsImFsZ29yaXRobSI6IkhNQUMtU0hBMjU2IiwiaXNzdWVkX2F0IjoxNTU0MTQyOTEyfQ";

	// Verify that the requests is indeed coming from Facebook
	var firstpart = signedRequest.split('.')[0];
	firstpart = firstpart.replace(/-/g, '+').replace(/_/g, '/');
	const signature = CryptoJS.enc.Base64.parse(firstpart).toString();
	const dataHash = CryptoJS.HmacSHA256(signedRequest.split('.')[1], keys.facebook.appSecret).toString();
	var isValid = signature === dataHash;

	const json = CryptoJS.enc.Base64.parse(signedRequest.split('.')[1]).toString(CryptoJS.enc.Utf8);
	const encodedData = JSON.parse(json);

	console.log(encodedData)

	// Example encodedData:
	// {
	//   algorithm: 'HMAC-SHA256',
	//   issued_at: 1555156987,
	//   player_id: '2102624973183477',
	//   request_payload: 'my_payload'
	//  }

	Photos.findOne({
		$or: [
			{"imageId": uid},
			{"facebook.id": uid}
		]}, function(error, result) {
		// if user id not found create user
		if (!result || result === null) {

			// create new user
			res.send("user not exists")
			// Query database for user using the stuckwanyah algorithm
			// checkUserExistance(encodedData.user_id || encodedData.player_id);

			console.log("creating user");
			var newPhoto = {
				imageId: uid,
				facebook: {
					ids: [uid]
				}
			};
			Photos.create(newPhoto, function(error, success) {
				if (error) console.error(error);
				Photos.findOne({$or: [
						{"imageId": uid},
						{"facebook.id": uid}
					]}).exec().then(function(result) {
					res.send(result);
				});
			});
		} else if (result !== null && result.length !== 0) {
			// Saves user uid, gender to session
			// Assign userid to session.user_id variables
			req.session.gender = result.gender;
			req.session.user_id = uid;
			res.status(200).json({
				igid: uid,
				imageId: result.imageId,
				gender: result.gender
			});
		}
	});
});

/**
 * POST /api/auth
 * Login with facebook in order to use user's pictures, friends list, etc...
 */
// {
// 	accessToken: "EAAZAdDi7fMz8BAFV3qbazv16xmvdZCwIjSmcIVFuAZCsizdtW…1MynFBjRK11IesKraPTTuB5EnpJ2W1eFG0DtsZA4eEVxgZDZD", 
// 	userID: "954279251387975", 
// 	expiresIn: 5869, 
// 	signedRequest: "D00FFH3VWbsnZtIiWpMvpEtRfRnzmdfFmYKAo_pp-Vg.eyJjb2…iSE1BQy1TSEEyNTYiLCJpc3N1ZWRfYXQiOjE1NTQzOTg1MzF9"
// }
router.post('/auth', function(req, res) {
	var session = req.session;
	var accessToken = req.body.accessToken;
	var userId = req.body.userID;
	var expires = req.body.expiresIn;
	var signedRequest = /*req.body.signedRequest*/ "uXSRy9L974TssLiqGW44CJwediE6hv1vxxPJeu-H_vo.eyJ1c2VyX2lkIjoiOTU0Mjc5MjUxMzg3OTc1IiwiY29kZSI6IkFRQW1vNEpsNkhGcE5VNzh1Vk0wd0RVNXF6bmRiVmF1VDFDV01NaG1GUXZMV25reFhkZDloQ0psQWpKVFh1NldKUEhweXdQdFJlZ1ZMamNHSno4Rk5SdS1kNFhGYkdmQjBtOWZMNjVMTHJ2LUx5WlpVTFBrRG9FYTRZbDg0SGMyNFdoNEw3NGtCd3RZdVJUczlJMy1vUlp5Z1RBeXpIT1k4aUFSY3g0TVpNQnpJNHpxMU9TM19wSE5tZUtxbEdKdVoyaTcxcWwwSHBTOUp6TWQzcm1qRGZGNXVEYVRLb01pcWUzVEMwOHhMRjlNNHp1ckdMNFQ2VEhhTmdIVW95bXJ2WWlqYWx4Nzhrcnl4a3dycnE2MWdYd3BVSUVzVDRxVVJiZ0VjMWhzVjNKSGVnR3BabUs5djJLZGI4bG5JdzA4QXZpWjhuZjUwOURnZHpsUWxHSUVuZ1JfTG1nUE1VVmpuLWJBd2JaREk2ODRQZyIsImFsZ29yaXRobSI6IkhNQUMtU0hBMjU2IiwiaXNzdWVkX2F0IjoxNTU0MTQyOTEyfQ";

	// Verify that the requests is indeed coming from Facebook
	var firstpart = signedRequest.split('.')[0];
	firstpart = firstpart.replace(/-/g, '+').replace(/_/g, '/');
	const signature = CryptoJS.enc.Base64.parse(firstpart).toString();
	const dataHash = CryptoJS.HmacSHA256(signedRequest.split('.')[1], keys.facebook.appSecret).toString();
	var isValid = signature === dataHash;

	const json = CryptoJS.enc.Base64.parse(signedRequest.split('.')[1]).toString(CryptoJS.enc.Utf8);
	const encodedData = JSON.parse(json);
	// console.log(encodedData)

	// Query database for user using the stuckwanyah algorithm
	// checkUserExistance(userId);
	// Query database with the userid
	Photos.findOne({$or: [{"imageId": userId},{"facebook.id": userId}]}, (err, user) => {
		if (!user) {
			// create new user
			res.sendStatus(200)
		} else if (user) {
			// Assign userid to session.user_id variables
			session.user_id = userId;
			res.setHeader('userId', session.user_id);
			res.sendStatus(200);
		}
	});

	// Photos.findOne({$or: [
	// 	{"imageId": uid},
	// 	{"facebook.id": uid}
	// ]})
	// .exec()
	// .then(function(user) {
	// 	// if user id not found create user
	// 	if (!user) {
	// 		// Query database for user using the stuckwanyah algorithm
	// 		// creates new user from facebook
	// 		// checkUserExistance(userId);
	// 	} else {
	// 		getUserFriends(userId);
	// 		// setSessionAttachHeaders({
	// 		// 	req: req, res: res,
	// 		// 	user: {
	// 		// 		id: userId,
	// 		// 		name: user.displayName,
	// 		// 		gender: user.gender
	// 		// 	},
	// 		// 	accessToken: {
	// 		// 		access_token: accessToken,
	// 		// 		expiry_date: expires
	// 		// 	}
	// 		// });
	// 		res.redirect('/');
	// 	}
	// });
});

// Route 2: Exchange auth code for access token
router.get('/oauth-redirect', (req, res) => {
  try {
	const authCode = req.query.code;

	request({
		url: `https://graph.facebook.com/v6.0/oauth/access_token`,
		qs: {
			'client_id': keys.facebook.appID,
			'client_secret': keys.facebook.appSecret,
			'redirect_uri': 'https://stuckwanyah.herokuapp.com/api/oauth-redirect',
			'code': encodeURIComponent(authCode)
		},
		method: "GET"
	})
	.then(response => JSON.parse(response))
	.then(async (response) => {
		const accessToken = response['access_token'];
		// Store the token in memory for now. Later we'll store it in the database.
		console.log('Access token is', accessToken);
		// await AccessToken.create({ _id: accessToken });

		// Set a cookie. Handy when working with a traditional web app.
		res.cookie('accessToken', accessToken, { maxAge: 900000, httpOnly: true });
		res.redirect('/api/me');
	})
	.catch(error => {
		res.send(error);
	})
  } catch (err) {
	console.log(err);
	return res.status(500).json({ message: err.response.data || err.message });
  }
});

// Route 3: Make requests to FB on behalf of the user
router.get('/me', async (req, res) => {
  try {
	const accessToken = String(req.cookies.accessToken);
	// const tokenFromDb = await AccessToken.findOne({ _id: accessToken });
	// if (tokenFromDb == null) {
	//   throw new Error(`Invalid access token "${accessToken}"`);
	// }

	// Get the name and user id of the Facebook user associated with the
	// access token.
	request({
		url: `https://graph.facebook.com/me`,
		qs: {
			access_token: accessToken,
			// fields: "gender"
		},
		method: "GET"
	})
	.then(function(body) {
		return res.send(`
		  <html>
			<body>Your name is ${JSON.parse(body).name}</body>
		  </html>
		`);
	})
	.catch(function(error) {
		console.log(error);
	});
  } catch (err) {
	console.log(err);
	return res.status(500).json({ message: err.response.data || err.message });
  }
});


/**
 * GET /api/auth/me/
 * Retrieve current user status
 */
router.get('/auth/mex', /*authenticate, getCurrentUser,*/ getOne);

/**
 * Facebook Endpoints
 * @Router /api/auth/facebook
 * Request will be redirected to Facebook
 */
router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
	// successRedirect: '/',
	successReturnToOrRedirect: '/bar',
	failureRedirect: '/',
	failureMessage: true
}), function(req, res) {
	// Successful authentication, redirect home
	console.log("success");
	res.redirect('/bar');
});

/**
 * GET /api/logout
 * Logout with facebook
 */
router.get('/logout', function (req, res, next) {
	//var url = req.session.reset() ? '/login' : '/';
	// if (req.session.user_id && req.cookies.user_sid) {
	// 	res.clearCookie('user_sid');
	// 	req.logout();

	// 	req.session.destroy(function (err) {
	// 		if (err) {
	// 			console.log(err);
	// 		}
	// 	});
	// }

	req.logout(function(err) {
		if (err) { return next(err); }
		res.redirect('/foo');
	});
});

// Global Functions
var renderIndexPage = function(config) {
	getTwoRandomPhotos(config);
};

function twoPhotos() {
	let i = 0;
	Photos.find().exec(function(err, photos) {
		async.each(photos, function(photo) {
			i++;
			console.log(`${i}: Checking user id ${photo._id} on the database`);
		});
	})
}
// twoPhotos()

var getTwoRandomPhotos = function(config) {
	console.log(config.params.query)

	if (config.params.query.right_photo_id && config.params.query.right_photo_id) {
		let right = config.params.query.right_photo_id;
		let left = config.params.query.left_photo_id;

		async.parallel([
			function(callback) {
				Photos.findOne({ imageId: left }, function(err, left) {
					callback(err, left);
				});
			},
			function(callback) {
				Photos.findOne({ imageId: right }, function(err, right) {
					callback(err, right);
				});
			}
		], function(err, results) {

			console.log(results)
				
			if (err) config.error.call(this, err);
			config.success.call(this, {
				images: results,
				// expected: expectedScore
			});
		
		});
	}
	else {

	var randomImages;
	var choices = ['female', 'male'];
	// var randomGender = _.sample(choices);
	var randomGender = _.first(_.shuffle(choices));
	// var gender = shim(config.params.session.gender);
	var gender = shim(config.params.user.gender);
	// var userId = config.params.session.user_id;
	var userId = config.params.user._id;

	var filter = {
		// age: {$gt: 13, $lt: 23 },
		age: { $gt: 13 },
		// gender: { $in: gender },
		gender: 'female',
		// is_blocked: false
	};

	var fields = {};
	var options = { limit: 2 };

	Photos.random(filter, fields, options, function(err, photos) {
	// Photos.findRandom(filter, fields, options, function(err, photos) {
		if (err) config.error.call(this, err);
		console.log(photos);

		// Photos
		// // .find()
		//  .where('random').near([Math.random(), 0])
		//  .where("facebook.id").ne(userId)
		// 	.where('age').gte(13).lte(24)
		// 	.where({gender: gender}) //randomGender)
		// 	.where({is_blocked: false})
		// 	.where({voted: false})
		// 	.lean()
		// 	.limit(2)
		// 	.exec()
		// 	.then(function(error, photos) {
		// Assign all 2 random pictures to randomPictures
		if (photos && photos[0] && photos[1]) {
			if (photos[0].imageId !== photos[1].imageId) {
				randomImages = photos;
			}
			else if (photos.length < 2 || photos.length !== 2 && photos[0].imageId === photos[1].imageId) {

				var oppositeGender = _.first(_.without(choices, randomGender));

				Photos
					.find({
						"random": {$near: [Math.random(), 0]},
						$or: [
							{"imageId": { $ne: userId }},
							{"facebook.id": { $ne: userId }}
						]
					})
					.where("is_blocked", false)
					.where("gender", gender) //randomGender)
					.where("voted", false)
					.limit(2)
					.exec()
					.then(function (photos) {
						if (photos.length === 2) {
							randomImages = photos;
						}
						// When there no more photo pairs left of either gender
						// reset the flags, and start the vote again
						else if (photos.length < 2) {
							Photos.update({}, { $set: {"voted": false } }, {multi: true}, function (err) {
								if (err) config.error.call(this, err);
							});
						}
					})
					.catch(function (err) {
						config.error.call(err);
					});
			}

			config.success.call(this, {
				images: randomImages,
				expected: expectedScore
			});
		}

	})
	// .catch(function(error) {
	// 	config.error.call(this, error);
	// });
	}
};

/**
 * rateImages
 * @param winner
 * @param loser
 * Rate images based on each image ratings
 */
var rateImages = async function(config) {
	var winnerID = config.params.query.winner;
	var loserID = config.params.query.loser;
	// getting the current user id from session
	// var voter = await getNativeIdFromImageId(config.params.user.imageId);
	let voter = config.params.user._id;

	console.log("User " + voter + " votes for " + winnerID)

	if (winnerID && loserID) {
		async.parallel([
			function(callback) {
				Photos.findOne({ imageId: winnerID }, function(err, winner) {
					callback(err, winner);
				});
			},
			function(callback) {
				Photos.findOne({ imageId: loserID }, function(err, loser) {
					callback(err, loser);
				});
			}
		], function(err, results) {

			// Perform the ELO Rating System
			var winner = results[0],
				  loser = results[1];

			var score = actualScore(winner, loser);

			// Odds and Expectations
			var winnerExpected = expectedScore(loser.ratings, winner.ratings);
			var winnerNewScore = winnerScore(winner.ratings, winnerExpected);
			var winnerNewRatings = newRating(winnerExpected, 1, winner.ratings);

			var loserExpected = expectedScore(winner.ratings, loser.ratings);
			var loserNewScore = loserScore(loser.ratings, loserExpected);
			var loserNewRatings = newRating(loserExpected, 0, loser.ratings);

			// Push the contestant to my friends lists
			Photos.findById(voter, function(err, doc) {
				if (doc.friends) {
					if (!doc.friends.includes(loser._id)) {
						doc.friends.push(loser._id)
					}
					if (!doc.friends.includes(winner._id)) {
						doc.friends.push(winner._id)
					}
					doc.save()
				}
			});

			async.parallel({
				winner: function(callback) {
					winner.wins++;
					winner.score = score.player1_actual_score;
					winner.ratings = winnerNewRatings; // winnerNewScore;
					winner.voted = true;
					winner.random = [Math.random(), 0];
					// keep record who voted who and who plays who
					winner.voted_by.push(voter);
					winner.challengers.push(loser._id); // loser.imageId

					winner.save(function(err) {
						callback(err);
					});
				},
				loser: function(callback) {
					loser.losses++;
					loser.score = score.player2_actual_score;
					loser.ratings = loserNewRatings; // loserNewScore;
					loser.voted = true;
					loser.random = [Math.random(), 0];
					// keep record who voted who and who plays who
					loser.voted_by.push(voter);
					loser.challengers.push(winner._id); // loser.imageId

					loser.save(function(err) {
						callback(err);
					});
				}
			},
			function(err, results) {
				if (err) config.error.call(this, err);
				config.success.call(this);
			});
		});
	} else {
		config.error.call(this, null, 'Voting requires two photos.' );
	}
};

var tieBreaker = async function(config) {
	var player_1 = config.params.query.player1;
	var player_2 = config.params.query.player2;
	// var voter = await getNativeIdFromImageId(config.params.user.id);
	let voter = config.params.user._id;

	if (player_1 && player_2) {
		async.parallel({
			player1: function(callback) {
				Photos.findOne({imageId: player_1}, function(err, player1) {
					callback(err, player1);
				});
			},
			player2: function(callback) {
				Photos.findOne({imageId: player_2}, function(err, player2) {
					callback(err, player2)
				});
			}
		}, function(err, results) {
			var player_1 = results['player1'];
			var player_2 = results['player2'];

			var score = actualScore(player_1, player_2);

			var player1ExpectedScore = expectedScore(player_1.ratings, player_2.ratings);
			var player2ExpectedScore = expectedScore(player_2.ratings, player_1.ratings);

			var player1NewRatings = elo.newRating(player1ExpectedScore, 0.5, player_1.ratings);
			var player2NewRatings = elo.newRating(player2ExpectedScore, 0.5, player_2.ratings);

			var player1NewScore = winnerScore(player_1.score, player1ExpectedScore);
			var player2NewScore = loserScore(player_2.score, player2ExpectedScore);

			async.parallel({
				player1: function(callback) {
					// increment the number of draws and push player2 id to challenger list
					player_1.draws++;
					player_1.score = score.player1_actual_score;
					player_1.ratings = player1NewRatings; //player1NewScore;
					player_1.challengers.push(player_2._id); // player_2.imageId
					player_1.voted_by.push(voter);
					player_1.save(function(err) {
						callback(err);
					});
				},
				player2: function(callback) {
					// increment the number of draws and push player1 id to challenger list
					player_2.draws++;
					player_2.score = score.player2_actual_score;
					player_2.ratings = player2NewRatings; //player2NewScore;
					player_2.challengers.push(player_1._id); // player_1.imageId
					player_2.voted_by.push(voter);
					player_2.save(function(err) {
						callback(err);
					});
				}
			}, function(err, results) {
				if (err) config.error.call(this, err);
				config.success.call(this);
			})
		});
	} else {
		config.error.call(this, null, "Voting requires two photos");
	}
};

/**
 * ELO Rating System Implementation
 */
var uscf = {
	default: 32,
	2100: 24,
	2400: 16
};

var min_score = 100;
var max_score = 10000;

const elo = new Elo(uscf, min_score, max_score);

/**
 * The calculated new rating based on the expected outcome, actual outcome, and previous score
 *
 * @param {Number} expected_score The expected score, e.g. 0.25
 * @param {Number} actual_score The actual score, e.g. 1
 * @param {Number} previous_rating The previous rating of the player, e.g. 1200
 * @return {Number} The new rating of the player, e.g. 1256
 */
function newRating(expected_score, actual_score, previous_rating) {
	var difference = actual_score - expected_score;
	return Math.round(previous_rating + 32 * difference);
};

function actualScore(player1, player2) {
	return {
		player1_actual_score: (player1.wins * 1) + (player1.losses * 0) + (player1.draws * 0.5),
		player2_actual_score: (player2.wins * 1) + (player2.losses * 0) + (player2.draws * 0.5)
	};
};

function simpleEloRating(rating, opponent_rating) {
	this.Ra = rating;
	this.Rb = opponent_rating;
	this.Qa = Math.pow(10, Ra / 400);
	this.Qb = Math.pow(10, Rb / 400);
	this.Ea = function(Qa, Qb) {
		return Qa / (Qa + Qb)
	};
	this.Eb = function(Qa, Qb) {
		return Qb / (Qa + Qb)
	};
	return {
		expectationOfPlayerA: this.Ea(Qa, Qb),
		expectationOfPlayerB: this.Eb(Qa, Qb)
	};
};
/**
 * Calculate the expected score outcome from to ratings
 *
 * Determines the expected "score" of a match
 *
 * @param {Number} Ra The rating of the person whose expected score we're looking for, e.g. 1200
 * @param {Number} Rb the rating of the challenging person, e.g. 1200
 * @return {Number} The score we expect the person to recieve, e.g. 0.5
 */
function expectedScore(Ra, Rb) {
	//return parseFloat((1 / (1 + Math.pow(10, (Rb - Ra) / 400))).toFixed(2));
	return (1 / (1 + Math.pow(10, (Rb - Ra) / 400)));
};

// Calculate the new winner score, K-factor = 32
function winnerScore(score, expected, k = 32) {
	return Math.round(score + k * (1 - expected));
};

// Calculate the new loser score, K-factor = 32
function loserScore(score, expected, k = 32) {
	return Math.round(score + k * (0 - expected));
};

function performanceRating(player1, player2) {
	var games = player1.wins + player1.losses + player1.draws;
	var performance_rating = (player2.ratings + 400 * (player1.wins - player1.losses) / games);
	return performance_rating;
};

function updateValue(id1, id2, score1, score2) {
	var Rpre1 = score1;
	var Rpre2 = score2;
	var K = 30;
	var S = 1;

	var E1 = E(Rpre1, Rpre2);
	var E2 = E(Rpre2, Rpre1);

	var R1 = parseInt(Rpre1 + (K*(S-E1)));
	var R2 = parseInt(Rpre2 - (K*(S-E2)));

	console.log("Rpre1: " + Rpre1 + " Rpre2: " + Rpre2 + " E1: " + E1 + " E2: " + E2 + " R1: " + R1 + " R2: " + R2);
	findAndUpdateDB(id1, id2, R1, R2);
};

function findAndUpdateDB(id1, id2, R1, R2) {
	Photos.update({ imageId: id1 }, { $set: { score: R1 }}, function(err, updated) {
		console.log(R1 + " " + R2);
	});
	Photos.update({ imageId: id2 }, { $set: { score: R2 }}, function(err, updated) {
	});
};

/**
 * Retrieving photos using query
 * @param config
 * Returns the top 10 highest ratings
 */
var topTenRatings = function(config) {
	console.log("1399: " + config.params.query.field);
	var query_field = config.params.query.field;
	var query_gender;
	if (config.params.query.gender) {
		query_gender = config.params.query.gender;
	} else {
		query_gender = shim(config.params.session.gender);
	}
	var query_limit = config.params.query.limit;

	Photos
		.find({"facebook.id": { $ne: config.params.session.user_id } })
		.sort({'ratings': -1})
		.where({"gender": query_gender})
		.limit(10)
		.exec()
		.then(function(ranks) {

			var rankCount = _.countBy(ranks, function(rank) { return rank });
			var max = _.max(rankCount, function(rank) { return rank });
			var inverted = _.invert(rankCount);
			var topRank = inverted[max];
			var topCount = rankCount[topRank];

			console.log(`1423:  ${ { rank: topRank, count: topCount } }`);

			config.success.call(this, ranks);
		}).catch(function(err) {
		console.log("1426: " + err);
		config.error.call(this, err);
	});
};

var topTenWinings = function(config) {
	// Query params object
	var params = config.params.query;
	var gender = shim(config.params.session.gender);
	var conditions = {};

	_.each(params, function(value, key) {
		conditions[key] = new RegExp('^' + value + '$', 'i');
	});

	Photos.find(conditions)
		.where({ "gender": gender })
		.sort('-wins') // Sort in descending order (highest wins on top)
		.limit(10)
		.exec()
		.then(function(photos) {
			// Sort by winning percentage
			photos.sort(function(a, b) {
				if (a.wins / (a.wins + a.losses) < b.wins / (b.wins + b.losses)) { return 1; }
				if (a.wins / (a.wins + a.losses) < b.wins / (b.wins + b.losses)) { return -1; }
				return 0;
			});
			config.success.call(this, photos);
		}).catch(function(err) {
		config.error.call(this, err);
	});
};

/*
// Sort the photos 

			all_photos.sort(function(p1, p2) {
				return (p2.likes - p2.dislikes) - (p1.likes - p1.dislikes);
			});

findId = function(obj) {
				return obj.id === vote.id;
			}
			elem = pending.filter(findId);
*/
/*Photos.find({
	gender: "female",
	$or: [ { loves:'apple' }, { weight:{ $lt: 500 } } ]
}, function(err, rankings{
	//if (err) config.error.call(this, err);
	//config.success.call(this, rankings);
	if (err) console.log("1126: " + err);
	console.log("1127: " + rankings);
});

Photos.aggregate([
	{ $match:{ weight:{ $lt:600 } } },
	{ $group:{
		_id:"$gender", total:{ $sum:1 }, avgVamp:{ $avg:"$vampires"}, unicorns:{ $addToSet:'$name' }
	} },
	{ $sort:{ total:-1 } },
	{ $limit:10 }
])*/


var processPageHits = function(config) {
	Hits.update({page: config.params.body.page},
		{ $inc: { hits: 1 } },{ upsert: true }
	).then(function(hit) {
		config.success.call(this, {hits: hit.hits});
	}).catch(function(err) {
		config.error.call(this, err);
	});
};

/**
 * User Authentication utils
 * Session, Cookies, Database
 */
var generateToken = function(req, res, next) {
	req.token = createToken(req.auth);
	next();
};
function createToken(auth) {
	return jwt.sign({
		id: auth.id
	}, 'stuckwanyah', {
		expiresIn: 60 * 120
	});
};
/*function createToken(user) {
	var payload = {
	exp: moment().add(14, 'days').unix(),
	iat: moment().unix(),
	sub: user._id
	};

	return jwt.encode(payload, keys.facebook.pageAccessToken);
};*/
function sendToken(req, res) {
	res.setHeader('x-auth-token', req.token);
	res.status(200).send(req.auth);
};
function authenticate(req, res) {
	generateToken(req, res);
};

/* var authenticate = expressJwt({
	secret: 'my-secret',
	requestProperty: 'auth',
	getToken: function(req) {
		if (req.headers['x-auth-token']) {
			return req.headers['x-auth-token'];
		}
		return null;
	}
}); */

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/foo');
}

// function isAuthenticated(req, res, next) {
// 	if (!(req.headers && req.headers.authorization)) {
// 		return res.status(400).send({ message: 'You did not provide a JSON Web Token in the Authorization header.' });
// 	}

// 	var header = req.headers.authorization.split(' ');
// 	var token = header[1];
// 	var payload = jwt.decode(token, keys.facebook.appSecret);
// 	var now = moment().unix();
// 	if (now && payload.exp) {
// 		return res.status(401).send({ message: 'Token has expired.' });
// 	}

// 	Photo.findById(payload.sub, function(err, user) {
// 		if (!user) {
// 			return res.status(400).send({ message: 'User no longer exists.' });
// 		}

// 		req.user = user;
// 		next();
// 	});
// };
function isLoggedInApi(req, res, next) {
	// req.loggedIn = !!req.user;
	if (req.isAuthenticated()) {
		return next();
	}
	res.json('Not Authenticated');
	//!req.session.user_id ? res.redirect('/api/auth/facebook/login') : next();
	//req.session.id ? res.redirect('/auth/facebook/login') : next();
	//return req.session.user_id ? true : false;
};
function getCurrentUser(req, res, next) {
	var userId = req.session.user_id;
	Photos.findOne({ imageId: userId }, (err, user) => { //req.auth.id
		if (err) {
			next(err);
		} else {
			req.user = user;
			req.session.user_id = user.imageId;
			next();
		}
	});
};

function getNativeIdFromImageId(userid) {
	return new Promise(function(resolve, reject) {
		// Photos.findOne({$or: [
		// 		{"imageId": userid},
		// 		{"facebook.id": userid}
		// 	]}, (err, user) => {
		// 	resolve(user._id);
		// });
		Photos.findOne({imageId: userid}, (err, user) => {
			if (user) {
				resolve(user._id);
			}
			else {
				reject(false);
			}
		})
	});
};

function getIdFromSession(id) {
	return new Promise(function(resolve, reject) {
		Photos.findOne({"imageId": id}, (err, user) => {
			resolve(user._id);
		})
	})
};

function getFacebookUser(userId) {
	return new Promise((resolve, reject) => {
		Photos.findOne({"facebook.id": userId}, (err, user) => {
			if (err) reject(err);
			resolve(user);
		});
	});
};

function getOne(req, res) {
	var user = req.user.toObject();

	delete user['facebook'];
	delete user['__v'];

	res.json(user);
};

function setSessionAttachHeaders(event) {
	// otherwise log user in and set session
	event.res.setHeader('userId', event.user.id);
	// Assign id to session.user_id variable
	event.req.session.user_id = event.user.id;
	event.req.session.gender = event.user.gender;
	event.req.session.authenticated = isAuthenticated(event.req, event.res);
	event.req.session.access_token = event.accessToken.access_token;
	event.req.session.expires = event.accessToken.expiry_date;
};

/**
 * Messenger API
 * Process postback for payloads
 * @param event
 */
// function processPostback(event) {
// 	var senderId = event.sender.id;
// 	var payload = event.postback.payload;

// 	if (payload === "GET_STARTED") {

// 		processUserSex(senderId);

// 		// Getting user's first name from user Profile API
// 		// and include it in the greeting
// 		request({
// 			url: "https://graph.facebook.com/v2.6/" + senderId,
// 			qs: {
// 				access_token: process.env.PAGE_ACCESS_TOKEN,
// 				fields: "first_name"
// 			},
// 			method: "GET"
// 		}, function(error, response, body) {
// 			var greeting, name = "";
// 			if (error) {
// 				console.log("1361: " + "Error getting user's name: " + error);
// 			} else {
// 				var bodyObj = JSON.parse(body);
// 				name = bodyObj.first_name;
// 				greeting = "Hi " + name + ". ";
// 			}
// 			var message = greeting + "Welcome to StuckWanYah!, the app that vars you put your taste in your friends' hotness";
// 			sendMessage(senderId, { text: message });
// 		});
// 	} else if (payload === "Block Me") {
// 		processBlockUnblock(senderId);
// 		sendMessage(senderId, { text: "Your photos has been blocked. You will not be able to be voted or vote." });
// 	} else if (payload === "Unblock Me") {
// 		processBlockUnblock(senderId);
// 		sendMessage(senderId, { text: "Your photos has been restored and you can be able to be voted or vote" });
// 	} else if (payload === "") {}
// };

/**
 * Messenger API
 * Process message from user for any matching keyword and perform actions
 * @param event
 */
// function processMessage(event) {
// 	if (!event.message.is_echo) {
// 		var message = event.message;
// 		var senderId = event.sender.id;

// 		console.log("1531: " + "Received message from senderId: " + senderId);
// 		console.log("1532: " + "Message is: " + JSON.stringify(message));

// 		// You may get a text or attachment but not both
// 		if (message.text) {
// 			var formattedMsg = message.text.toLowerCase().trim();

// 			// If we receive a text message, check to see if it matches any special
// 			// keywords and send back the corresponding movie detail.
// 			// Otherwise, search for the new movie.
// 			switch (formattedMsg) {
// 				case "rankings":
// 					getPlayerDetail(senderId, formattedMsg);
// 					break;
// 				case "block me":
// 					processBlockUnblock(senderId);
// 					break;
// 				case "unblock me":
// 					processBlockUnblock(senderId);
// 					break;
// 				case "share":
// 					publishTopTenHottestPhotos(senderId, null);
// 					break;
// 				case "publish":
// 					publishTopTenHottestPhotos(senderId, null);
// 				case "post":
// 					publishTopTenHottestPhotos(senderId, null);
// 				default:
// 					findMovie(senderId, formattedMsg);
// 			}
// 		} else if (message.attachments) {
// 			sendMessage(senderId, {text: "Sorry, I don\'t understand your request."});
// 		}
// 	}
// };

/**
 * Messenger API
 * Sends message to user
 * @param recipientId
 * @param message
 */
// function sendMessage(recipientId, message) {
// 	request({
// 		url: "https://graph.facebook.com/v.2.6/me/messages",
// 		qs: { access_token: keys.facebook.pageAccessToken },
// 		method: "POST",
// 		json: {
// 			recipient: { id: recipientId },
// 			message: message,
// 		}
// 	}, function(error, response, body) {
// 		if (error) {
// 			console.log("Error sending message: " + response.error);
// 		}
// 	});
// };

/**
 * Messenger API
 * Finds movie on OMDBAPI Database
 * @param userId
 * @param movieTitle
 */
function findMovie(userId, movieTitle) {
	var message;
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

				var options = { upsert: true };
				Photos.findOneAndUpdate(query, update, options, function(error, movie) {
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
										imageUrl: movieObj.Poster === "N/A" ? "http://placehold.it/350x150" : movieObj.Poster,
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
};

/**
 * Messenger API
 * Process blocking and unblocking user/photo
 * Check if the provide id is currently blocked then unblock it other wise block it
 * @param userId
 * @return {}
 */
function processBlockUnblock(userId) {
	var query = { "imageId": userId };
	var attempts = 0;
	Photos.findOne(query, function(err, photo) {
		if (photo) {
			if (photo.is_blocked)
				unblockPhoto(photo);
			else if (!photo.is_blocked)
				blockPhoto(photo);
		} else if (!photo)
			attempts++;
		if (attempts > 2) attempts = 0;
		sendMessage(userId, {text: "Something went wrong. Try again later"});
		console.log('no photo found');
	});
};

function blockPhoto(callback) {
	callback.is_blocked = true;
	callback.save(function(error, response) {
		if (error)
			throw error;
		else
			console.log("Your photo has been blocked. You will not be able to be voted nor vote again in the future.");
		sendMessage(callback.facebook.id, {text: "Your photo has been blocked. You will not be able to be voted nor vote again in the future."});
	});
	// new BlockedPhotos({id: callback.imageId,is_blocked: true}).save();
	return callback;
};

function unblockPhoto(callback) {
	callback.is_blocked = false;
	callback.save(function(error, response) {
		if (error) throw error;
		else
			console.log("Your photo has been unblocked. Your photo can be voted by your friends.");
		sendMessage(callback.facebook.id, {text: "Your photo has been unblocked. Your photo can be voted by your friends."});
	});
	// BlockedPhotos.remove({id: callback.imageId}).save();
	return callback;
};

/**
 * User/Sender/Voter -> is the person using the app and doing the ratings
 * Player -> is the person being voted/rated for it's hotness
 * Player/s is/are the sender's friend/s within the 13-21 age group range
 *
 * Girls rating girls, boys rating boys not really a exciting thing
 * Get voter's gender so
 * if user is a female, she rates her friends that are boys
 * if user is a male, he rates his friends that are girls
 */
function processUserGender(event) {
	var senderId = event.sender.id;
	// Getting user's gender from user Profile API
	// and redirect to respective function
	request({
		url: `https://graph.facebook.com/v3.0/${senderId}`,
		qs: {
			access_token: keys.facebook.pageAccessToken,
			fields: "gender"
		},
		method: "GET"
	}, function(error, response, body) {
		var greeting = "";
		if (error) {
			console.log('1815: ' + "Error getting user's gender: " + error);
		} else {
			var bodyObj = JSON.parse(body);
			var gender = bodyObj.gender;
			// Checking user's gender
			if (gender === "male") {
				// boys vote for girls hotness
				rateGirls();
			} else if (gender === "female") {
				// girls vote for boys hotness
				rateBoys();
			}
		}
	});
};

/**
 * Process and swap user gender so male votes female and vise versa
 * @param gender
 * @returns {string}
 */
function shim(gender) {
	return gender == 'female' ? 'male' : 'female';
};

function randomQuery(config) {
	var gender = 'male';
	var userId = 100004177278169;
	var filter = {
		"gender": gender,
		"voted": 'false',
		"is_blocked": 'false',
		"facebook.id": {$ne: userId}
	};
	var fields = {};
	var options = {"limit": 2};

	Photos.findRandom(filter, fields, options, function(err, results) {
		if (!err) {
			console.log("query 1: " + results); // 2 objects
		}
	});
	Photos.findOneRandom(function(err, result) {
		if (!err) {
			console.log("query 2: " + result);
		}
	});
};

// randomQuery();

/**
 * Algorithm for StuckWanYah
 * After user logged in with facebook using whatever technology,
 * these actions are invoked to gather more info about the user.
 *
 * Checks if user logging in is an existing user then @goto getUserFriends()
 * but if not then creates a new user by @goto getUserDetailsFromFacebook()
 * @params facebookId User's Facebook ID from Facebook
 */

// _usersFromList(require('./photos'));
// _usersFromList(require('./friendslist'));

function _usersFromList(data) {
	// create all of the dummy people
	async.each(data, function(profile) {
		console.log("Checking user id "+ profile.id + " on the database")
		// find each user by profile 
		// if the user with that id doesn't already exist then create it
		// checkUserExistance(profile.id);
		_populatePhotos(profile);
	});
};

function calcAge(obj) {
	let age = null;
	if (obj.min && obj.max) {
		age = (obj.min + obj.max)/2;
	}
	else if (obj.min && !obj.max) {
		age = obj.min;
	}
	else if (!obj.min && obj.max) {
		age = obj.max;
	}
	else {
		age = (obj.min + obj.max)/2;
	}
	return age;
}

function _populatePhotos(profile) {
	Photos.find({ imageId: profile.id }).then(function(res) {
		var p = new Photos({
			imageId: profile.id,
			fullName: profile.name,
			firstName: profile.first_name,
			lastName: profile.last_name,
			age: profile.age_range ? calcAge(profile.age_range) : 22,
			gender: profile.gender,
			picture: profile.photo,
			profileUrl: profile.photo
		});
		p.save(function(err, res) {
			if (err) {throw new Error(err);}
			console.log(res);
		});
	});
}



router.get('/populate', function (req, res, next) {
	console.log("Fetching friendlist...");
	request({
		url: `https://graph.facebook.com/v3.0/100004177278169/friends`,
		qs: {
			access_token: keys.facebook.pageAccessToken,
			limit: 5000,
			fields:"id,name,first_name,last_name,gender,age_range,picture",
			format: "json"
		},
		method: "GET",
		json: true
	}, (error, response, body) => {
		if (error) throw new Error(error);
		if (response && body) {
			console.log(body.data)
		// 	var bodyObj;
		// 	if ("string" == typeof body) {
		// 		bodyObj = JSON.parse(body);
		// 	}

		// 	bodyObj = new Object(body);

		// 	Photos.create({
		// 		imageId: "100004177278169",
		// 		fullName: "Christian Augustyn",
		// 		firstName: "Christian",
		// 		lastName: "Augustyn",
		// 		age: 21,
		// 		gender: "male",
		// 		picture: "https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/cp0/p50x50/31886521_997680883714478_7430056043532517376_n.jpg?_nc_cat=108&ccb=2&_nc_sid=dbb9e7&_nc_ohc=_bop2COlZSYAX8D_BgN&_nc_ht=scontent-syd2-1.xx&tp=27&oh=e70377d571ee3b428fbacb286a3b678e&oe=5FDEED37"
		// 	});

		// 	for (var i = 0; i < bodyObj.data.length; i++) {
		// 		// Photos.findOne({imageId: bodyObj.data[i].id}).then(function(res) {
		// 		// 	if (res) {
		// 		// 		console.info("User with the same id found");
		// 		// 	} else {
		// 		new Photos({
		// 			imageId: bodyObj.data[i].id,
		// 			fullName: bodyObj.data[i].name,
		// 			firstName: bodyObj.data[i].first_name,
		// 			lastName: bodyObj.data[i].last_name,
		// 			age: bodyObj.data[i].age_range ? calcAge(bodyObj.data[i].age_range) : 22,
		// 			gender: bodyObj.data[i].gender,
		// 			picture: bodyObj.data[i].picture.data.url,/*getUserProfilePicture(bodyObj.data[i].id),*/
		// 		})
		// 			.save(function(err, result) {
		// 				if (err) console.error(err);
		// 				// else {
		// 				// 	console.log(result);
		// 				// }
		// 			})
		// 		// }
		// 		// });
		// 	}

			res.send("finished");
		};
	});
	// };

})

/**
 * Prepares all the user's basic details
 * @param profile
 */
async function _prepareUserData(fbProfile) {
	var object = {};
	// imageId is the facebook id
	object['imageId'] = fbProfile.id;
	object['fullName'] = fbProfile.name;
	object['firstName'] = fbProfile.first_name;
	object['lastName'] = fbProfile.last_name;

	// determine the age by subtracting birth year from current year or calculating the average of age_range
	if (fbProfile.hasOwnProperty('birthday')) {
		object['age'] = new Date().getFullYear() - new Date(fbProfile.birthday).getFullYear();
	}
	else if (fbProfile.hasOwnProperty('age_range')) {
		object['age'] = (fbProfile.age_range.min + fbProfile.age_range.max) / 2;
	}

	// assign gender
	if (fbProfile.hasOwnProperty('gender')) {
		object['gender'] = fbProfile.gender ? fbProfile.gender : '';
	}

	// use photo url if it's a string but run down the tree to pick the url
	// if all fails scrape the photo using fbId
	if (fbProfile.photo && "string" == typeof fbProfile.photo) {
		object['picture'] = fbProfile.photo;
	}
	else if (fbProfile.picture && typeof fbProfile.picture == 'object') {
		if (fbProfile.picture.data && fbProfile.picture.data.url) {
			object['picture'] = fbProfile.picture.data.url;
		}
	}
	else {
		var pic = await getUserProfilePicture(fbProfile.id);
		object['picture'] = pic;
	}

	if (fbProfile.hasOwnProperty('birthday')) {
		object['profileUrl'] = fbProfile.link;
	}

	object['facebook'] = {
		ids: new Array()
	};
	if (fbProfile.ids_for_apps && fbProfile.ids_for_apps.data && Array.isArray(fbProfile.ids_for_apps.data)) {
		for (var i = 0; i < fbProfile.ids_for_apps.data.length; i++) {
			// switch (bodyObj.data[i].apps.id) {
			// 	case "1791165357568831":
			// 		// stuckwanyah web
			// 		fbProfile['facebook']['instantGameId'] = bodyObj.data[i].id;
			// 		break;
			// 	case "206200729983202":
			// 		// stuckwanyah instantgame
			// 		fbProfile['facebook']['instantGameId'] = bodyObj.data[i].id;
			// 		break;
			// }
			object['facebook']['ids'].push(fbProfile.ids_for_apps.data[i].id);
			// object['facebook'] = {
			// 	// id: fbProfile.id,
			// 	instantGameId: fbProfile.id
			// 	// webId: 
			// };

		}
	}

	// if (fbProfile.friends && fbProfile.friends.data && Array.isArray(fbProfile.friends.data)) {
	// 	for (var i = 0; i < fbProfile.friends.data.length; i++) {
	// 		if(!object['facebook']['friends'].includes(fbProfile.friends.data[i])) {
	// 			Array.prototype.push.apply(object['facebook']['friends'], fbProfile.friends.data[i]);
	// 		} else {continue;}
	// 		object['facebook'] = {
	// 			'friends': fbProfile.friends.data
	// 		}
	// 	}
	// }

	// leave the rest to default
	object['is_blocked'] = false;
	// wins: 0,
	// losses: 0,
	// draws: 0,
	// score: 0,
	// ratings: 0,
	object['random'] = [Math.random(), 0];
	// voted: false,
	// voted_by: [],
	// challengers: [],

	return object;
};


var user_logged_in = true;

if (user_logged_in) {
	// retrieve user friends data
} else {
	// prompt user to log in
}

let FBuserID = 954279251387975/*100004177278169*/;
// checkUserExistance(FBuserID);
// checkUserExistanceOnFb(100015413832074);


// Checks user id existance by querying the database using user id from InstantGame and TabApp
/* check database if particular userid exists already as user */
function /* step: 1 */ checkUserExistance(userId) {
	Photos.findOne({
		$or: [
			{"imageId": userId},
			{"facebook.id": userId}
		]
	}).exec().then((user) => {
		if (!user) {
			/* user not exist start aggregating user details from facebook to create new user*/
			console.log("User with id " + userId + " not found");
			/* goto: -> step: 5 */ checkUserExistanceOnFb(userId);
		}
		else {
			/* 
				user exists. use the imageId because imageId is the id the user used when signed up for the first time.
				so update user details from facebook
			*/
			console.log("User with id " + user.imageId + " found");
			/* goto: -> step: 5 */ checkUserExistanceOnFb(user.imageId);
		}
	}).catch((error) => {
		throw new Error(error);
	});
};

// me/friends?fields=id,birthday,age_range,gender,first_name,last_name,name,picture{height,url,width},link
// https://graph.facebook.com/100004177278169/accounts?access_token=EAAAAZAw4FxQIBANylBOmZCMUBDZCckWTUxxSrGz0mLTVK63ZCges0t8IVMtwt3B8NFYjAY8TXDswZA7cZAm84QlCIPHwQVji1LoO8zSLaZCQZBG5T0KR9sBPr5ivJUGTGRkB2vZAlAOzGSruOr0zrTFh9ftJ9v39zFCi9Vh97ilTmNiEZCAGYcbleY
function extractIdForApps(id) {
	// retrieving friends with their ids
	performRequest("https://graph.facebook.com/v2.0/100004177278169/friends", {}).then(function(data) {
		// using the individual friends id to access their account id
		for (var i = 0; i < data.data.length; i++) {
			performRequest(`https://graph.facebook.com/v2.0/${data.data[i].id}/accounts`, {}).then(function(res) {
				console.log(res)
			});
		}
	});
}

function performRequest(url, params) {
	return new Promise(function(resolve, reject) {
		request({
			url: url,
			qs: {
				access_token: "EAAAAZAw4FxQIBANylBOmZCMUBDZCckWTUxxSrGz0mLTVK63ZCges0t8IVMtwt3B8NFYjAY8TXDswZA7cZAm84QlCIPHwQVji1LoO8zSLaZCQZBG5T0KR9sBPr5ivJUGTGRkB2vZAlAOzGSruOr0zrTFh9ftJ9v39zFCi9Vh97ilTmNiEZCAGYcbleY",
				params
			},
			method: "GET"
		}, (error, response, body) => {
			var bodyObj = JSON.parse(body);
			if (error || bodyObj.hasOwnProperty('error')) {
				reject(bodyObj);
			}
			else if (response && body && !bodyObj.hasOwnProperty('error')) {
				resolve(bodyObj);
			}
		});
	});
}



// checkUserExistanceOnFb(100004177278169);

/* check fb database if particular user exists still exists */
function /* step: 2 */ checkUserExistanceOnFb(userId) {
	return request({
		url:`https://graph.facebook.com/${userId}`,//`https://graph.facebook.com/v6.0/${userId}/`,
		qs: {
			access_token: keys.facebook.pageAccessToken,
		},
		method: "GET"
	}, (error, response, body) => {
		if (error || JSON.parse(body).hasOwnProperty('error')) {
			var err = JSON.parse(body);
			console.error(err.message);
			/* user not exist */
			console.log("User with id " + userId + " not found on facebook");
			throw new Error(err.message);
		}
		else if (response && body && !JSON.parse(body).hasOwnProperty('error')) {
			var bodyObj = JSON.parse(body);
			console.log(bodyObj)
			// /* goto: -> step: 2 */ getUserDetailsFromFacebook(userId);
		}
	});
}

/**
 * Retrieve user's profile picture, friends list, and basic info from Facebook
 * @param userId; FacebookId, instantGameId, FbPageId
 */
function /* step: 3 */ getUserDetailsFromFacebook(userId) {
	return request({
		url:`https://graph.facebook.com/${userId}`,
		qs: {
			access_token: keys.facebook.userAccessToken,
			// fields:"id,name,last_name,first_name,birthday,age_range,gender,link,picture.type(square).width(200).height(200),friends{age_range,birthday,name,first_name,last_name,gender},ids_for_apps"
			// fields:"public_profile, email, user_gender, user_age_range, user_birthday, user_photos, user_link, user_friends, pages_user_gender, pages_messaging,ids_for_apps,ids_for_pages",
			limit: 5000,
			fields:"id,name,first_name,last_name,gender,age_range,picture",
			format: "json"
		},
		method: "GET"
	}, (error, response, body) => {
		if (error || JSON.parse(body).hasOwnProperty('error')) {
			var err = JSON.parse(body);
			/* user not exist */
			throw new Error(err.message);
		}
		else if (response && body && !JSON.parse(body).hasOwnProperty('error')) {
			var bodyObj = JSON.parse(body);
			console.log(bodyObj)
			// /* goto: -> step: 3 */ createNewUser(_prepareUserData(bodyObj));
		}
	});
};

function /* step: 4 */ getUserDetailsFromFacebook2(userId) {
};

/**
 * Save user profile data to StuckWanYah database
 * @param data
 */
/** creates new user 'cause the id does not exist in the database */
function /* step: 5 */ createNewUser(data) {
	console.log("Creating new single user...");

	Photos.update({ imageId: data.imageId }, { $set: data },{ upsert: true }).exec().then(newUser => {
		/* goto: -> step: 4 */
		console.log("User "+ data.imageId +" created. Getting friends");
		// /* goto: -> step: 6 */ getUserFriends(newUser.imageId);
	}).catch(error => {
		console.log(err.message);
		// /* goto: -> step: 1 */ checkUserExistance(data.id);
	});

	//console.log(`created ${results.length} (+) new players`.cyan);
	// Photos.findOneAndUpdate(query, update, options, function(err, results) {
	// 	if (err) throw err;
	// 	//console.log('Are the results MongooseDocuments?: %s', results[0] instanceof mongoose.Document);
	// 	console.log(`created ${results.length} (+), updated ${results.length} (~)`);
	// });
};

/* 
 * Check for any basic info nescessary that is not present
 * retrieve details from facebook and compare with the local details of the same user
 * change anything that is not same;
 */
function /* step: 6 */ updateUserDetailsFromFacebook(userId) {
	Photos.findOne({"imageId": userId})
		.then(profile => {
			if (profile["gender"] == undefined || profile["gender"] == "") {
				// /* goto: -> step: 2 */ getUserDetailsFromFacebook(userId);
				request({
					url: `https://graph.facebook.com/v3.0/${userId}`,
					qs: {
						access_token: keys.facebook.userAccessToken,
						fields:"gender"
					},
					method: "GET",
					json: true
				}, (error, response, body) => {
					if (error || JSON.parse(body).hasOwnProperty('error')) {
						var err = JSON.parse(body);
						/* user not exist */
						throw new Error(err.message);
					}
					else if (response && body && !JSON.parse(body).hasOwnProperty('error')) {
						var bodyObj = JSON.parse(body);
						console.log(bodyObj)
						// /* goto: -> step: 3 */ createNewUser(_prepareUserData(bodyObj));
						if ("string" == typeof body) {
							var bodyObj = JSON.parse(body);
							if (bodyObj) {
								profile['gender'] = bodyObj.gender;
							}
						}
						if ("object" == typeof body) {
							if (body.gender) {
								profile['gender'] = body.gender;
							}
						}
					};
				});
			}

			if (profile["age"] == undefined || profile["age"] == "") {
				// /* goto: -> step: 2 */ getUserDetailsFromFacebook(userId);
				request({
					url: `https://graph.facebook.com/v3.0/${userId}`,
					qs: {
						access_token: keys.facebook.userAccessToken,
						fields:"age_range,birthday"
					},
					method: "GET",
					json: true
				}, (error, response, body) => {
					if (error) throw new Error(error);
					if (response && body) {
						if ("string" == typeof body) {
							var bodyObj = JSON.parse(body);
							if (bodyObj['birthday']) {
								object['age'] = new Date().getFullYear() - new Date(bodyObj.birthday).getFullYear();
							}
							else if (bodyObj['age_range']) {
								object['age'] = (bodyObj.age_range.min + bodyObj.age_range.max) / 2;
							}
						}
						if ("object" == typeof body) {
							if (bodyObj['birthday']) {
								object['age'] = new Date().getFullYear() - new Date(bodyObj.birthday).getFullYear();
							}
							else if (bodyObj['age_range']) {
								object['age'] = (bodyObj.age_range.min + bodyObj.age_range.max) / 2;
							}
						}
					};
				});
			}

			if (profile["facebook"]["ids"].length) {
				// /* goto: -> step: 2 */ getUserDetailsFromFacebook(userId);
				request({
					url: `https://graph.facebook.com/v3.0/${userId}`,
					qs: {
						access_token: keys.facebook.userAccessToken,
						fields:'ids_for_apps'
					},
					method: "GET",
					json: true
				}, (error, response, body) => {
					if (error) throw new Error(error);
					if (response && body) {
						var bodyObj;
						if ("string" === typeof body.ids_for_apps) {
							bodyObj = JSON.parse(body.ids_for_apps);
						}
						var bodyObj = new Object(body.ids_for_apps);
						if ("object" == typeof bodyObj && bodyObj.data && Array.isArray(bodyObj.data)) {
							for (var i = 0; i < bodyObj.data.length; i++) {
								// switch (bodyObj.data[i].apps.id) {
								// 	case "1791165357568831":
								// 		// stuckwanyah web
								// 		profile['facebook']['instantGameId'] = bodyObj.data[i].id;
								// 		break;
								// 	case "206200729983202":
								// 		// stuckwanyah instantgame
								// 		profile['facebook']['instantGameId'] = bodyObj.data[i].id;
								// 		break;
								// }
								profile['facebook']['ids'].push(bodyObj.data[i].id);
							}
						}
					};
				});
			}

			profile.save(function(error, updatedProfile) {
				if (error) throw new Error(error);
			});

			/* goto: -> step: 6 */ //getUserFriends(userId);
		}).catch(error => {
		throw new Error(error);
	});
};

// getUserFriends(100004177278169);

function /* step: 7 */ getUserFriends(userId) {
	console.log("Fetching friendlist...");
	return request({
		// https://graph.facebook.com/v3.0/100004177278169/friends?limit=5000&access_token=EAAAAZAw4FxQIBANylBOmZCMUBDZCckWTUxxSrGz0mLTVK63ZCges0t8IVMtwt3B8NFYjAY8TXDswZA7cZAm84QlCIPHwQVji1LoO8zSLaZCQZBG5T0KR9sBPr5ivJUGTGRkB2vZAlAOzGSruOr0zrTFh9ftJ9v39zFCi9Vh97ilTmNiEZCAGYcbleY
		url: `https://graph.facebook.com/v3.0/${userId}/friends`,
		qs: {
			access_token: keys.facebook.userAccessToken,
			limit: 5000,
			fields:"id,name,first_name,last_name,gender,age_range,picture",
			format: "json"
		},
		method: "GET",
		json: true
	}, (error, response, body) => {
		if (error) throw new Error(error);
		if (response && body) {
			var bodyObj;
			if ("string" == typeof body) {
				bodyObj = JSON.parse(body);
			}
			bodyObj = new Object(body);
			console.log(bodyObj);
			// /* goto: -> step: 7 */ updateUserFriendsList(bodyObj);
		};
	});
};


// only build friends list of my first-degree friends
function fetchCurrentUserFriends(userObj) {
	console.log("Fetching friendlist...");
	for (var i = 0; i < userObj.data.length; i++) {
		console.log(userObj.data[i]);
	}
}

function /* step: 8 */ updateUserFriendsList(object) {
	var update = {
		facebook: {
			friends: []
		}
	};

	if (object.friends && object.friends.data && Array.isArray(object.friends.data)) {
		for (var i = 0; i < object.friends.data.length; i++) {
			if(!update['facebook']['friends'].includes(object.friends.data[i])) {
				Array.prototype.push.apply(object['facebook']['friends'], profile.friends.data[i]);
			} else continue
		}
	};

	Photos.update({"imageId": object.id}, { $set: update },{ upsert: false })
		.then(updatedProfile => {
			/* done!! */
			console.log("done!!!");
		}).catch(error => {
		throw new Error(error);
	});
};

const querystring = require('querystring');
var config = {};

function getAccessTocken(data) {
	// let o = data.match(/accessToken\\":\\"([^\\]+)/),
	//     t = {};
	data.match(/accessToken\\":\\"([^\\]+)/)
	// config.access_token = o[1];
	// let n = data.match(/{\\"dtsg\\":{\\"token\\":\\"([^\\]+)/);
	// config.dt = n[1];
	// let r = data.match(/\\"NAME\\":\\"([^"]+)/);
	// console.log(data)
	// r = r[1].slice(0, -1).replace(/\\\\/g, "\\");
	// r = decodeURIComponent(JSON.parse(`"${r}"`));
	// r = querystring.unescape(JSON.parse(`"${r}"`));
	// config.name = r;
	// return config;
}

function fetch(url) {
	return request({
		url: url,
		method: "GET"
	}, (error, response, body) => {
		if (error) throw new Error(error);
		if (response && body) {
			// console.log(body)
			return body;
		};
	});
}

// async function start() {
// 	let url = 'https://m.facebook.com/composer/ocelot/async_loader/?publisher=feed';
// 	// let url = "http://localhost:5000/me",
// 		// response = await fetch(url, {
// 		// 	headers: {
// 		// 		UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36 Edg/86.0.622.51' 
// 		// 	} 
// 		// });
// 		// s = response.match(/accessToken\\":\\"([^\\]+)/)
// 		// data = getAccessTocken(response);
// 	// console.log(response);
// 	// getFriends()

// 	request({
// 		url: `https://cors-anywhere.herokuapp.com/${url}`,
// 		headers: {
// 			'cache-control':'no-cache',
// 			'content-type':'application/x-www-form-urlencoded',
// 			'origin': 'https://stuckwanyah.herokuapp.com',
// 			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36 Edg/86.0.622.51'
// 		}
// 	}, (error, response, body) => {
// 		if (error) throw new Error(error);
// 		if (response && body) {
// 			console.log(body)
// 		};
// 	});

// }

// start()

// var useragent = require('express-useragent');

// app.use(useragent.express());
// app.get('/me', function(req, res) {
//     res.send(req.useragent);
// });

/**
 * Improved version of renderTwoPhotos to render two photos based on specific criteria
 * Criteria age >= 13 && <= 21; male vote for female friends; only display photos user friends
 * Here's how it works
 * => Aggregate user friends including age, voters, is_blocked, wins, losses, draws, gender
 * => Run random pick of two on aggregated search based on user gender. If user is male render female, or vice versa.
 * @param req
 * @param res
 * @param next
 */
function newRenderTwoPhotos(config) {
	var gender = shim(config.params.session.gender);
	var randomImages;

	Photos.aggregate(
		// select the fields we want to deal with
		{ $project: { name: 1, ratings: 1 } },
		// unwind 'likes', which will create a document for each like
		//{ $unwind: '$facebookFriends'},
		// group everything by the like and then add each name with that like to
		// the set for the like
		{ $group: {
				_id: { name: '$displayName' },
				friends: { $addToSet: '$facebookFriends' }
			} }, function(err, data) {
			if (err) throw err;
			config.success.call(this, data);
		});
};

router.route("/dummy")
	.get(function(req, res) {
		console.log(req.query);
		// res.json({
		// 	"meta": {
		// 		"type": "success",
		// 		"code": 200,
		// 		"message": "",
		// 		"responseId": "43qtf3hk03y34gm41",
		// 		"seesionID": req.sessionID,
		// 		"seesion": req.session,
		// 		"user_sid": req.cookies.user_sid
		// 	},
		// 	"data": {
		// 		"id": 1,
		// 		"name": "Joe Burns"
		// 	}
		// });
		// 954279251387975?fields=name,id,ids_for_apps,birthday,picture,gender,link,age_range,last_name,first_name,short_name,friends{age_range,birthday,name,first_name,last_name,short_name,gender}
		res.json({
			"id": "954279251387975",
			"name": "Christian Augustyn",
			"first_name": "Christian",
			"last_name": "Augustyn",
			"short_name": "Christian",
			"age_range": {
				"max": 20,
				"min": 18
			},
			"gender": "male",
			"birthday": "04/06/1999",
			"picture": {
				"data": {
					"height": 50,
					"is_silhouette": false,
					"url": "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=954279251387975&height=50&width=50&ext=1556739834&hash=AeTyoVBJ489FDsSt",
					"width": 50
				}
			},
			"friends": {
				"data": [
				],
				"summary": {
					"total_count": 716
				}
			},
			"ids_for_apps": {
				"data": [
					{
						"id": "954279251387975",
						"app": {
							"category": "Games",
							"link": "https://apps.facebook.com/stuckwanyah/",
							"name": "StuckWanYah Web",
							"namespace": "stuckwanyah",
							"id": "1791165357568831"
						}
					},
					{
						"id": "1145740485575183",
						"app": {
							"category": "Games",
							"link": "/instantgames/206200729983202/",
							"name": "Stuck Wan Yah",
							"id": "206200729983202"
						}
					}
				],
				"paging": {
					"cursors": {
						"before": "QVFIUjdlSzQyNWlVb1paR1JGeWJrcUVRS1c5Mk4yNUlfbjBZAdDNXWGFXRFZAQQmtNLVdDZATR0a1IwQW5aOFBGT3lCV0syVUJ1YWFYSlo5SlZAKRHVWYkpnek1n",
						"after": "QVFIUmJqNHBSUXREVW1ZAa2swRnNtSURhS0NLd05wOU0tWmpIY0g3Wnc1SHBjTGVGS0xVdWgzeDdZAWE9oeXVpYk5fcUJRbjlZAaEFySXZALdklxbkVnZAWJNRDJ3"
					}
				}
			}
		});
	})
	.post(function(req, res) {
		console.log("Query: " + req.query)
		console.log("Body: " + req.body)
		console.log("Params: " + req.params)
		// res.status(400);
	});

/**
 * Publish the top 10 hottest friends on StuckWanYah Facebook page in carousel post
 * and hashtag all 10 photos plus the player posting the photos
 * @param userId
 * @param content
 */
function publishTopTenHottestPhotos(content) {
	var defaultCaption = "Top 10 Hottest friends 😍😍😍 \n\n #stuckwanyah #dat_wan_how #stuckwan #kain_samting_yah";
	request({
		url: `https://www.facebook.com/${keys.facebook.pageID}/feed`,
		qs: {
			access_token: keys.facebook.pageAccessToken,
			no_story: false,
			caption: typeof content.caption == "string" ? content.caption : defaultCaption,
			url: [content.url]
		},
		method: "POST"
	}, function(error, response, body) {
		if (error) {
			if (content.sender) {
				sendMessage(content.sender, {text: `Error posting article: ${response.error}`});
			} else {
				console.error(`Error posting article: ${response.error}`);
			}
		}
		if (content.sender) {
			sendMessage(content.sender, {text: "Post published."});
		} else {
			console.error("Post published.");
		}
	});
};

// publishTopTenHottestPhotos({
// 	// caption: "",
// 	url: "hello"
// })

router.get('/pages', isLoggedInApi,(req, res) => {
	User.findOne({ "facebook.id": req.user.id }, (err, user) => {
		if (err) return;
		FB.setAccessToken(user.accessToken);
		FB.api('/me/accounts', (pages) => {
			let data = pages.data.map((page) => {
				return {
					name : page.name,
					id : page.id
				}
			});
			res.json([...data]);
		});
	});
});

router.get('/facebook/access_token', getPageAccessToken);

function getPageAccessToken(req, res, next) {
	// var options = {
	// 	method: "GET",
	// 	// uri: `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${keys.facebook.appID}&client_secret=${keys.facebook.appSecret}&fb_exchange_token=${req.user.facebook.access_token}`,
	// 	uri: 'https://graph.facebook.com/v3.0/oauth/access_token',
	// 	qs: { 
	// 		grant_type : "fb_exchange_token",
	// 		client_id : keys.facebook.appID,
	// 		client_secret : keys.facebook.appSecret,
	// 		fb_exchange_token : keys.facebook.userAccessToken
	// 	}
	// };
	
	var options = {
		method: "GET",
		uri: `https://graph.facebook.com/${keys.facebook.pageID}?fields=access_token&access_token=${req.user.facebook.access_token}`,
		qs: {
		}
	};

	request(options).then(function(result) {
		res.json(result)
	})
}

var getMediaOptions = function(event) {
	var options = {
		method: "GET",
		uri: `https://graph.facebook.com/v3.0/${event.user.id}`,
		qs: {
			access_token: keys.facebook.pageAccessToken,
			type: 'user',
			fields: 'photos.limit(2).order(reverse_chronological) {link, comments.limit(2).order(reverse_chronological)}'
		}
	};
	return request(options).then(function(fbRes) {
		res.json(fbRes);
	});
};

function publishPhoto() {
	// const access_token = 'for page if posting to a page, for user if posting to a user\'s feed';
	var defaultCaption = "Top 10 Hottest friends 😍😍😍 \n\n #stuckwanyah #dat_wan_how #stuckwan #kain_samting_yah";
	let cap = `
		Who is hotter?
		Vote here https://enchanting-teal-peacock.cyclic.app/?left_photo_id=123&right_photo_id=123
	`;

	var postImageOptions = {
		method: 'POST',
		uri: `https://graph.facebook.com/${keys.facebook.pageID}/photos`,
		qs: {
			access_token : keys.facebook.pageAccessToken,
			caption: defaultCaption,
			url: 'https://wallpaper.dog/large/20534800.png',
			// url: 'https://wallpaper.dog/large/20534800.png, https://scontent-syd2-1.xx.fbcdn.net/v/t1.18169-9/26055583_1895292864134023_6963265434294745042_n.png?_nc_cat=109&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=uSR7k38b4EYAX8LjGgF&tn=oTWK0x1jx8AJn6hj&_nc_ht=scontent-syd2-1.xx&oh=00_AT_t_3Ko7KDhs1AtSNZYAZd7CC4xlyyJ4snmgd_dWHhokA&oe=62F9187B',
			// attached_media : [
			// 	{"media_fbid":"1002088839996"},
			// 	{"media_fbid":"1002088840149"}
			// ]
		}
	};

	// request.post(postImageOptions).then(result => {
	// 	console.log(result)
	// });
	
	// request.post(postImageOptions, (error, result) => {
	// 	if (error) throw error;
	// 	console.log(JSON.parse(result.body).id);
	// });
};

// publishPhoto()

function publishTwoPhoto() {
	async.parallel([
		
		function(callback) {
			var postImageOptions = {
				method: 'POST',
				uri: `https://graph.facebook.com/${keys.facebook.pageID}/photos`,
				qs: {
					access_token : keys.facebook.pageAccessToken,
					published: false,
					caption: "Hello",
					url: 'https://wallpaper.dog/large/20534800.png'
				}
			};

			request.post(postImageOptions, (error, result) => {
				callback(error, JSON.parse(result.body));
			});
		},
		function(callback) {
			var postImageOptions = {
				method: 'POST',
				uri: `https://graph.facebook.com/${keys.facebook.pageID}/photos`,
				qs: {
					access_token : keys.facebook.pageAccessToken,
					published: false,
					caption: "Hello",
					// url: 'https://wallpaper.dog/large/20534800.png',
					url: 'https://scontent-syd2-1.xx.fbcdn.net/v/t1.18169-9/26055583_1895292864134023_6963265434294745042_n.png?_nc_cat=109&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=uSR7k38b4EYAX8LjGgF&tn=oTWK0x1jx8AJn6hj&_nc_ht=scontent-syd2-1.xx&oh=00_AT_t_3Ko7KDhs1AtSNZYAZd7CC4xlyyJ4snmgd_dWHhokA&oe=62F9187B'
				}
			};

			request.post(postImageOptions, (error, result) => {
				callback(error, JSON.parse(result.body));
			});
		}

	], function(error, results) {
		if (error) throw error;

		var defaultCaption = "Top 10 Hottest friends 😍😍😍 \n\n #stuckwanyah #dat_wan_how #stuckwan #kain_samting_yah";
		
		var postImageOptions = {
			method: 'POST',
			uri: `https://graph.facebook.com/${keys.facebook.pageID}/photos`,
			qs: {
				'access_token' : keys.facebook.pageAccessToken,
				'caption': defaultCaption,
				// 'attached_media[0]': `{"media_fbid": ${results[0].post_id} }`,
				// 'attached_media[1]': `{"media_fbid": ${results[1].post_id} }`
				attached_media : [
					{"media_fbid": results[0].id },
					{"media_fbid": results[1].id }
				]
			}
		};

		request.post(postImageOptions).then(result => {
			console.log(result)
		});

	});
}

// publishTwoPhoto();

// router.get('/post_message',
function postToFeed(req, res) {
	var options = {
		method: "POST",
		// uri: `https://graph.facebook.com/${keys.facebook.pageID}/feed?message=Hello Fans!&access_token=${req.user.facebook.accessToken}`,
		uri: `https://graph.facebook.com/${keys.facebook.pageID}/feed`,
		qs: {
			message : "Hello Fans!",
			access_token: keys.facebook.pageAccessToken
		}
	};

	return request(options).then(result => {
		return result;
	}).catch(error => {
		throw new Error(error);
	});
};

function publishLink(req, res) {
	var options = {
		method: "POST",
		uri: `https://graph.facebook.com/${keys.facebook.pageID}/feed?message=Hello Fans!&access_token={page-access-token}`,
		// `https://graph.facebook.com/${keys.facebook.pageID}/feed?message=Smart video calling to fit every family&link=https://stuckwanyah.herokuapp.com/&access_token={page-access-token}`,
		qs: {
		}
	};
	return request(options).then(function(result) {
		res.json(result);
	});
}

function getUserProfilePicture(userId, type='large'/* small, square, large */) {
	// return 'https://graph.facebook.com/'+userId+'/picture?type=square&height=200&width=200'
	var options = { method: 'GET',
		url: `https://graph.facebook.com/${userId}/picture`,
		qs: {
			type: 'large',
			height: 200,
			width: 200,
			access_token: keys.facebook.userAccessToken
		},
		headers: { 'cache-control': 'no-cache','content-type': 'application/x-www-form-urlencoded' }
	};

	request(options, function (error, response, body) {
		if (error) throw new Error(error);

		return body;
	});
};

//	TODO: Fix: Checking each user if exist, check if one data can be updated i.e. if profile picture changed, update with new propic uri, create new user
//	TODO: Add avatar vs avatar fights (8hr rounds)
//	TODO: Remote fat footer, and add static links like on SpinKit
//	TODO: FOCUS ON PERFORMANCE
//	TODO: scheduler to remove lowest ranked every day
//	TODO: make a new collections for storing Previous Votes for each character
//	TODO: add characteristic to profile page that user can select from dropdown:
//	http://ideonomy.mit.edu/essays/traits.html
//	TODO: jquery wait until image loaded on profile page
//	TODO: set minimum width/height on homepage thumbnails to prevent sliding of DOM
//	TODO: reset every 200 rounds
//	TODO: fix database probs...
//	Problem description:

app.post("/keystrokelogger", function(req, res) {
	console.log(req.body);
	console.log("received data");
});

function parallelAssignment() {};

function objectInstantiation(array1, array2) {
	var k = {};
	if (array1 instanceof Array && array2 instanceof Array) {
		if (array1.length == array2.length) {
			for (var i = 0; i < array1.length; i++) {
				for (var j = 0; j < array2.length; j++) {
					k[array1[j]] = array2[j];
				}
			}
		} else {
			throw new Error("Both array has to have equal number of elements in the array");
		}
	}
	return k;
}


// Scrape facebook for #stuckwanyah

const cheerio = require('cheerio');
 
let keyWord = "developers";
let URL = `https://www.instagram.com/explore/tags/${keyWord}/`;

// request(URL)
//     .then((html) => {
//         console.log(html);
//     })
//     .catch((err) => {
//         console.log(err);
//     });
	// .then((html) => {
	//     let hashtags = scrapeHashTags(html);
	//     hashtags = removeDuplicates(hashtags);
	//     hashtags = hashtags.map(ele => "#" + ele)
	//     console.log(hashtags);
	// })
	// .catch((err) => {
	//     console.log(err);
	// });

const scrapeHashtags = (html) => {
	var regex = /(?:^|\s)(?:#)([a-zA-Z\d]+)/gm;
	var matches = [];
	var match;
 
	while ((match = regex.exec(html))) {
		matches.push(match[1]);
	}
 
	return matches;
}

const removeDuplicates = (arr) => {
	let newArr = [];
 
	arr.map(ele => {
		if (newArr.indexOf(ele) == -1) {
			newArr.push(ele)
		}
	})
	 
	return newArr;
}























// Add support for GET requests to our webhook
router.get("/webhook", (req, res) => {
	// Parse the query params
	let mode = req.query["hub.mode"];
	let token = req.query["hub.verify_token"];
	let challenge = req.query["hub.challenge"];

	// Check if a token and mode is in the query string of the request
	if (mode && token) {
		// Check the mode and token sent is correct
		if (mode === "subscribe" && token === "hello") {
			// Respond with the challenge token from the request
			console.log("WEBHOOK_VERIFIED");
			res.status(200).send(challenge);
		}
		else {
			// Respond with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});


// Create the endpoint for your webhook
router.post("/webhook", (req, res) => {
	let body = req.body;

	console.log(`\u{1F7EA} Received webhook:`);
	console.dir(body, { depth: null });

	// Check if this is an event from a page subscription
	if (body.object === "page") {

		// Iterate over each entry - there may be multiple if batched
		// body.entry.forEach(async function(entry) {
			
		// 	// if ("changes" in entry) {
		// 	//     // Handle Page Changes event
		// 	//     let receiveMessage = new Receive();
		// 	//     if (entry.changes[0].field === "feed") {
		// 	//       let change = entry.changes[0].value;
		// 	//       switch (change.item) {
		// 	//         case "post":
		// 	//           return receiveMessage.handlePrivateReply(
		// 	//				"post_id",
		// 	//				change.post_id
		// 	//           );
		// 	//         case "comment":
		// 	//           return receiveMessage.handlePrivateReply(
		// 	//				"comment_id",
		// 	//				change.comment_id
		// 	//           );
		// 	//         default:
		// 	//           console.warn("Unsupported feed change type.");
		// 	//           return;
		// 	//       }
		// 	//     }
		// 	// }

		// 	// Get the webhook event. entry.messaging is an array, but 
		// 	// will only ever contain one event, so we get index 0
		// 	let webhook_event = entry.messaging[0];
		// 	console.log(webhook_event);

		// 	// Get the sender PSID
		// 	let sender_psid = webhook_event.sender.id;
		// 	console.log('Sender PSID: ' + sender_psid);

		// 	// Iterate over webhook events - there may be multiple
		// 	// entry.messaging.forEach(async function(webhookEvent) {
		// 	  //   // Discard uninteresting events
		// 	  //   if ("read" in webhookEvent) {
		// 	  //     console.log("Got a read event");
		// 	  //     return;
		// 	  //   } else if ("delivery" in webhookEvent) {
		// 	  //     console.log("Got a delivery event");
		// 	  //     return;
		// 	  //   } else if (webhookEvent.message && webhookEvent.message.is_echo) {
		// 	  //     console.log(
		// 	  //       "Got an echo of our send, mid = " + webhookEvent.message.mid
		// 	  //     );
		// 	  //     return;
		// 	  //   }

		// 	  //   // Get the sender PSID
		// 	  //   let senderPsid = webhookEvent.sender.id;
		// 	  //   // Get the user_ref if from Chat plugin logged in user
		// 	  //   let user_ref = webhookEvent.sender.user_ref;
		// 	  //   // Check if user is guest from Chat plugin guest user
		// 	  //   let guestUser = isGuestUser(webhookEvent);

		// 	  //   if (senderPsid != null && senderPsid != undefined) {
		// 	  //     if (!(senderPsid in users)) {
		// 	  //       if (!guestUser) {
		// 	  //         // Make call to UserProfile API only if user is not guest
		// 	  //         let user = new User(senderPsid);
		// 	  //         GraphApi.getUserProfile(senderPsid)
		// 	  //           .then(userProfile => {
		// 	  //				user.setProfile(userProfile);
		// 	  //           })
		// 	  //           .catch(error => {
		// 	  //				// The profile is unavailable
		// 	  //				console.log(JSON.stringify(body));
		// 	  //				console.log("Profile is unavailable:", error);
		// 	  //           })
		// 	  //           .finally(() => {
		// 	  //				console.log("locale: " + user.locale);
		// 	  //				users[senderPsid] = user;
		// 	  //				i18n.setLocale("en_US");
		// 	  //				console.log(
		// 	  //				"New Profile PSID:",
		// 	  //				senderPsid,
		// 	  //				"with locale:",
		// 	  //				i18n.getLocale()
		// 	  //			);
		// 	  //			return receiveAndReturn(
		// 	  //				users[senderPsid],
		// 	  //				webhookEvent,
		// 	  //				false
		// 	  //			);
		// 	  //           });
		// 	  //       } else {
		// 	  //         setDefaultUser(senderPsid);
		// 	  //         return receiveAndReturn(users[senderPsid], webhookEvent, false);
		// 	  //       }
		// 	  //     } else {
		// 	  //       i18n.setLocale(users[senderPsid].locale);
		// 	  //       console.log(
		// 	  //         "Profile already exists PSID:",
		// 	  //         senderPsid,
		// 	  //         "with locale:",
		// 	  //         i18n.getLocale()
		// 	  //       );
		// 	  //       return receiveAndReturn(users[senderPsid], webhookEvent, false);
		// 	  //     }
		// 	  //   } else if (user_ref != null && user_ref != undefined) {
		// 	  //     // Handle user_ref
		// 	  //     setDefaultUser(user_ref);
		// 	  //     return receiveAndReturn(users[user_ref], webhookEvent, true);
		// 	  //   }
		// 	  // });
		
		// });

		/* Iterate over each entry, there can be multiple entries if callbacks are batched. */
		body.entry.forEach(function(entry) {
			// Iterate over each messaging event
			entry.messaging.forEach(function(event) {
				console.log('%o', event);

				if (event.postback) {
					processPostback(event);
				}
				else if (event.message) {
					processMessage(event);
				}
			});
		});

		// Returns a '200 OK' response to all requests
		res.status(200).send("EVENT_RECEIVED");
	}
	else {
		// Return a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404);
	}
});

function setDefaultUser(id) {
  let user = new User(id);
  users[id] = user;
  i18n.setLocale("en_US");
}

function isGuestUser(webhookEvent) {
	let guestUser = false;
	if ("postback" in webhookEvent) {
		if ("referral" in webhookEvent.postback) {
			if ("is_guest_user" in webhookEvent.postback.referral) {
				guestUser = true;
			}
		}
	}

	return guestUser;
}

function receiveAndReturn(user, webhookEvent, isUserRef) {
	let receiveMessage = new Receive(user, webhookEvent, isUserRef);
	return receiveMessage.handleMessage();
}

// Set up your App's Messenger Profile
router.get("/profile", (req, res) => {
	let token = req.query["verify_token"];
	let mode = req.query["mode"];

	if (!config.webhookUrl.startsWith("https://")) {
		res.status(200).send("ERROR - Need a proper API_URL in the .env file");
	}
  // var Profile = require("./services/profile.js");
  // Profile = new Profile();

  // // Check if a token and mode is in the query string of the request
  // if (mode && token) {
  //   if (token === config.verifyToken) {
  //     if (mode == "webhook" || mode == "all") {
  //       Profile.setWebhook();
  //       res.write(
  //         `<p>&#9989; Set app ${config.appId} call to ${config.webhookUrl}</p>`
  //       );
  //     }
  //     if (mode == "profile" || mode == "all") {
  //       Profile.setThread();
  //       res.write(
  //         `<p>&#9989; Set Messenger Profile of Page ${config.pageId}</p>`
  //       );
  //     }
  //     if (mode == "personas" || mode == "all") {
  //       Profile.setPersonas();
  //       res.write(`<p>&#9989; Set Personas for ${config.appId}</p>`);
  //       res.write(
  //         "<p>Note: To persist the personas, add the following variables \
  //         to your environment variables:</p>"
  //       );
  //       res.write("<ul>");
  //       res.write(`<li>PERSONA_BILLING = ${config.personaBilling.id}</li>`);
  //       res.write(`<li>PERSONA_CARE = ${config.personaCare.id}</li>`);
  //       res.write(`<li>PERSONA_ORDER = ${config.personaOrder.id}</li>`);
  //       res.write(`<li>PERSONA_SALES = ${config.personaSales.id}</li>`);
  //       res.write("</ul>");
  //     }
  //     if (mode == "nlp" || mode == "all") {
  //       GraphApi.callNLPConfigsAPI();
  //       res.write(
  //         `<p>&#9989; Enabled Built-in NLP for Page ${config.pageId}</p>`
  //       );
  //     }
  //     if (mode == "domains" || mode == "all") {
  //       Profile.setWhitelistedDomains();
  //       res.write(
  //         `<p>&#9989; Whitelisted domains: ${config.whitelistedDomains}</p>`
  //       );
  //     }
  //     if (mode == "private-reply") {
  //       Profile.setPageFeedWebhook();
  //       res.write(`<p>&#9989; Set Page Feed Webhook for Private Replies.</p>`);
  //     }
  //     res.status(200).end();
  //   } else {
  //     // Responds with '403 Forbidden' if verify tokens do not match
  //     res.sendStatus(403);
  //   }
  // } else {
  //   // Returns a '404 Not Found' if mode or token are missing
  //   res.sendStatus(404);
  // }

});

// Verify that the callback came from Facebook.
function check_fb_signature(req, res, buf) {
	console.log('Check facebook signature step.');
	var fb_signature = req.headers["x-hub-signature"];
	if (!fb_signature) {
		throw new Error('Signature ver failed.');
	}
	else {
		var sign_splits = fb_signature.split('=');
		var method = sign_splits[0];
		var sign_hash = sign_splits[1];

		var real_hash = crypto.createHmac('sha1', keys.facebook.appSecret)
			.update(buf)
			.digest('hex');

		if (sign_hash != real_hash) {
			throw new Error('Signature ver failed.');
		}
	}
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
}

function processPostback(event) {
	const senderID = event.sender.id;
	const payload = event.postback.payload;
	if (payload === 'WELCOME') {
		request({
			url: "https://graph.facebook.com/v2.6/" + senderID,
			qs: {
				access_token: process.env.PAGE_ACCESS_TOKEN,
				fields: "first_name"
			},
			method: "GET"
		}, function(error, response, body) {
			let greeting = '';
			if (error) {
				console.error("Error getting user name: " + error);
			}
			else {
				let bodyObject = JSON.parse(body);
				console.log('%o', bodyObject);
				name = bodyObject.first_name;
				greeting = "Hello " + name  + ". ";
			}
			
			let message = greeting + "Welcome to Healthbot. Hope you are       doing good today";
			let message2 = "I am your nutrition tracker :-)"
			let message3 = "please type in what you ate like: I ate chicken birayani and 2 chapatis with dal.";
			
			senderAction(senderID);
			sendMessage(senderID, {text: message}).then(() => {
				sendMessage(senderID, { text: message2 }).then(() => {
					sendMessage(senderID, {  text: message3}).then(() => {
						sendMessage(senderID, { text: '🎈' });
					})
				});
			});
		});
	}
}

function processMessage(event) {
	if (!event.message.is_echo) {
		const message = event.message;
		const senderID = event.sender.id;
		console.log("Received message from senderId: " + senderID);
		console.log("Message is: " + JSON.stringify(message));
		
		if (message.text) {
			// now we will take the text received and send it to an food tracking API.
			let text = message.text;
			let options = {
				method: 'POST',
				url: 'https://mefit-preprod.herokuapp.com/api/getnutritionvalue',
				headers: {
					'cache-control': 'no-cache',
					'content-type': 'application/json'
				},
				body: {
					userID: process.env.USERID,
					searchTerm: text
				},
				json: true
			};

			request(options, function (error, response, body) {
				if (error) throw new Error(error);
				senderAction(senderID);
				// after the response is recieved we will send the details in a Generic template
				sendGenericTemplate(senderID, body);
			});
		}
	}
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
}

function senderAction(recipientId) {
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs: { 
			access_token: process.env.PAGE_ACCESS_TOKEN
		},
		method: "POST",
		json: {
			recipient: {
				id: recipientId
			},
			sender_action: "typing_on"
		}
	}, function(error, response, body) {
		if (error) {
			console.log("Error sending message: " + response.error);
		}
		else {
			console.log('%o', body);
		}
	});
}

function sendMessage(recipientId, message) {
	return new Promise(function(resolve, reject) {
		request({
			url: "https://graph.facebook.com/v2.6/me/messages",
			qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
			method: "POST",
			json: {
				recipient: {id: recipientId},
				message: message
			}
		}, function(error, response, body) {
			if (error) {
				console.log("Error sending message: " + response.error);
				reject(response.error);
			}
			else {
				resolve(body);
			}
		});
	});
}

function sendGenericTemplate(recipientId, respBody) {
	console.log(respBody);

	const nutritionalValue = [];
	for (let i = 0; i < respBody.length; i++) { // I dont like using forEach
		let obj = {
			"title":respBody[i].food_name,
			"image_url": respBody[i].thumbnail,
			"subtitle": 'Total Calories: ' +     respBody[i].total_calories + "\n" + 
						'protein: ' + respBody[i].protein + "\n" + 
						'Carbohydrates: ' + respBody[i].total_carbohydrate,
		}
		nutritionalValue.push(obj);
	}

	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": nutritionalValue
			}
		}
	}

	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
		method: 'POST',
		json: {
			recipient: {id: recipientId},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log("Error sending message: " + response.error);
		}
	})
}

// function lineLogger(...log) {
// 	const STACK_LINE_REGEX = /(\d+):(\d+)\)?$/;
//   let err;

//   try {
//     throw new Error();
//   } catch (error) {
//     err = error;
//   }

//   try {
//     const stacks = err.stack.split('\\n');
//     console.log(STACK_LINE_REGEX.exec(stacks[2]))
//     const [, line] = STACK_LINE_REGEX.exec(stacks[2]);

//     return this(`[${line}]`, ...log);
//   } catch (err) {
//     return this(...log);
//   }
// }

// lineLogger.call(console.log, "hello")

// function getRowNum() {
//     let e = new Error();
//     e = e.stack.split("\n")[2].split(":");
//     e.pop();
//     return e.pop();
// }
// getRowNum()


// var log = console.log;
//   console.log = function() {
//       log.apply(console, arguments);
//       // Print the stack trace
//       console.trace();
//   };
  
  
//   // Somewhere else...
//   function foo(){
//       console.log('Foobar');
//   }
//   foo();

// console.log("hello")