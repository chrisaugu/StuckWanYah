#!/usr/bin/env node

// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
var express = require("express"),
    ejs = require('ejs'),
    session = require("express-session"),
    restful = require('node-restful'),
    mongoose = require("mongoose"),
    _ = require('underscore'),
    moment = require("moment"),
    cookieParser = require('cookie-parser'),
    bodyParser = require("body-parser"),
    path = require("path"),
    favicon = require('serve-favicon'),
    parseurl = require('parseurl'),
    request = require('request-promise'),
    passport = require('passport'),
    FacebookTokenStrategy = require('passport-facebook-token'),
    FacebookStrategy = require('passport-facebook').Strategy,
    jwt = require('jwt-simple'),
    //expressJwt = require('express-jwt'),
    xml2js = require("xml2js"),
    fs = require('fs'),
    async = require("async"),
    colors = require('colors'),
    Elo = require('arpad'),
    dotenv = require('dotenv').config(),
    cors = require('cors'),
    keys = require("./config/keys");

// Creating Global instance for express
const app = express();
const router = express.Router();

var sourceDirectory = "app/photos/";
// Invoke model
var Sweetlips = require("./models/sweetlips");
// Register photos model
var Photos = Sweetlips.photos;
var Hits = Sweetlips.hits;
var BlockedPhotos = Sweetlips.blockedPhotos;
Photos.methods(['get', 'put','post', 'delete']).register(router, '/photos');
Hits.methods(['get', 'put','post', 'delete']).register(router, '/hits');

// configure the instance
app.set('port', (process.env.PORT || 5000));
// Tell express where it can find the templates
app.set('views', path.join(__dirname + '/views'));
//Set ejs as the default template
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
// Make the files in the app/ folder avilable to the world
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'app')));
// Parse POST request data. It will be available in the req.body object
app.use(favicon(path.join(__dirname, 'app', 'favicon.ico')));
//RESTful API requirements
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser(keys.cookieSecret));
// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: keys.session.secret,
    keys: [keys.session.cookieKey],
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2 * 7 * 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

/** Registers a function used to serialize user objects into the session. */
passport.serializeUser((user, done) => {
    console.log(user);
    //done(null, user._id);
    done(null, user.id);
});

/** Registers a function used to deserialize user objects out of the session. */
passport.deserializeUser((id, done) => {
    Photos.findById(id).then((user) => {
        done(null, user);
    });
});

/*passport.use(new FacebookStrategy({
    // options for the facebook strat
    clientID: keys.facebook.appID, //FACEBOOK_APP_ID,
    clientSecret: keys.facebook.clientSecret, //FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:5000/api/v1/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'birthday', 'gender', 'profileUrl']
}, function (accessToken, refreshToken, profile, done) {
    let options = {accessToken, refreshToken, profile}
    Photos.findOrCreate({ "facebookProvider.id": profile.id }, options, function (err, user) {
        return done(err, user);
    });
}));

passport.use(new FacebookStrategy({
    // options for the facebook strat
    clientID: keys.facebook.appID, //FACEBOOK_APP_ID,
    clientSecret: keys.facebook.clientSecret, //FACEBOOK_APP_SECRET,
    callbackURL: "https://sweetlipsdb.herokuapp.com/api/v1/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'birthday', 'gender', 'profileUrl'],
    enableProof: true
}, function (accessToken, refreshToken, profile, done) {

    // check if photo already exists in the db
    Photos.findOne({"facebookProvider.id": profile.id}).then((currentUser) => {
        if (!currentUser) {
            // already have the photo
            console.log("user is:", currentUser);
            done(null, currentUser);
        } else {
            // if not, create user in the db
            new Photos({
                displayName: profile.displayName,
                facebookProvider: {id: profile.id}
            }).save().then((newPhoto) => {
                console.log('new photo created:' + newPhoto);
            })
        }
    });
}));*/

passport.use(new FacebookStrategy({
    clientID: keys.facebook.appID,
    clientSecret: keys.facebook.clientSecret,
    callbackURL: keys.facebook.callbackURL,
    profileFields:['id','displayName','emails']
}, function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    var me = new user({
        email:profile.emails[0].value,
        name:profile.displayName
    });

    /* save if new */
    user.findOne({email:me.email}, function(err, u) {
        if(!u) {
            me.save(function(err, me) {
                if(err) return done(err);
                done(null,me);
            });
        } else {
            console.log(u);
            done(null, u);
        }
    });
}));

/*
passport.use(new FacebookTokenStrategy({
    clientID: keys.facebook.appID,
    clientSecret: keys.facebook.clientSecret,
    callbackURL: "/api/v1/auth/facebook/token",
}, function (accessToken, refreshToken, profile, done) {
    Photos.upsertFbUser(accessToken, refreshToken, profile, function(err, user) {
        return done(err, user);
    });
}));
*/

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('connect.html');
});

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
// Middleware for some local variables to be used in the template
app.use((req, res, next) => {
    let loggedIn = req.session.id ? true : false;

    if (req.cookies.user_sid && !req.session.user_id) {
        res.clearCookie('user_sid');
    }
    if (!req.session.views) req.session.views = {}
    // get the url pathname
    let pathname = parseurl(req).pathname;
    // count the views
    req.session.views[pathname] = (req.session.views[pathname] || 0) + 1;

    if (req.session.seenyou) {
        res.setHeader('X-Seen-You', 'true');
    } else {
        // setting a property will automatically cause a Set-Cookie response to be sent
        req.session.seenyou = true;
        res.setHeader('X-Seen-You', 'false');
    }

    res.locals.session = req.session;
    res.locals.loggedIn = loggedIn;

    next();
});


// middleware function to check for logged-in users
const sessionChecker = (req, res, next) => {
    if (req.session.user_id && req.cookies.user_sid) {
        req.session.authenticated = true;
        next();
    } else {
        req.session.authenticated = false;
        res.redirect('/foo');
    }
};

function authenticationMiddleware () {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            return next()
        }
        res.redirect('/');
    }
}

app.use('/api/v1', router);

// Invoke instance to listen to port
// Create new server
app.listen(app.get('port'), function(){
    console.log("---------------------------".blue);
    console.log("Server running on port %d".magenta, app.get('port'));
    console.log("---------------------------".blue);
});
var opts = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};
mongoose.Promise = global.Promise;
// Creating an instance for MongoDB
switch(app.get('env')) {
    case 'development':
        mongoose.connect(keys.mongodb.testDbURL, opts);
        break;
    case 'production':
        mongoose.connect(keys.mongodb.mongodbURI, opts);
        break;
    default: 
        throw new error('Unknown execution environment: ', app.get('env'));
}
//mongoose.connect(keys.mongodb.testDbURL);
mongoose.connection.on("connected", function(){
    console.log("-----------------------------------------------".blue);
    console.log("Connected: Successfully connect to mongo server".green);
    console.log("-----------------------------------------------".blue);
});
mongoose.connection.on('error', function(){
    console.log("--------------------------------------------------------------------".blue);
    console.log("Error: Could not connect to MongoDB. Did you forget to run 'mongod'?".red);
    console.log("--------------------------------------------------------------------".blue);
});

/**
 * Routes
 */
// Server index page
app.get("/", sessionChecker, function (req, res, next){
    renderIndexPage({
        params: req,
        success: function(obj){
            res.render("home.html", obj);
        },
        error: function(err){
            console.error("Error occurred: ", err);
        }
    });
});

app.get("/rate", function(req, res, next){
    rateImages({
        params: req,
        success: function(obj){
            res.redirect('/');
        },
        error: function(err){
            console.error("Error occurred: ", err);
        }
    });
});

app.get("/tie", function(req, res, next){
    tieBreaker({
        params: req,
        success: function(obj){
            res.redirect('/');
        },
        error: function(err){
            next(err);
        }
    });
});

// connect to facebook page
app.route('/foo')
    .get(function (req, res) {
        if (!req.session.user_id) {
            res.render('connect.html');
        } else if (req.session.user_id !== ''){
            res.send(`Welcome ${req.session.user_id}`);
        }
    })
    .post(function (req, res) {
        let session = req.session;
        let userId = req.body.userid;
        // Query database with the userid
        Photos.findOne({"facebookProvider.id": userId}, (err, user) => {
            if (!user) {
                // create new user
                res.send("user does not exist")
            } else if (user) {
                // Assign userid to session.user_id variables
                session.user_id = userId;
                res.setHeader('userId', session.user_id);
                res.redirect('/bar'); // redirect to homepage /
            }
        });
    });

app.get('/bar', sessionChecker, function (req, res, next) {
    let session = req.session;
    let someAttribute = session.someAttribute;

    session.someAttribute = "foo";
    session.seenyou = true;
    session.user_id;
    session.gender = "male";
    session.authenticated = true;
    session.access_token;

    if (req.session.views) {
        res.write(`<p>Welcome user: ${session.user_id} </p>\n`);
        res.write('<p>Returning with some text: ' + session.someAttribute + '</p> \n');
        res.write('<p>you viewed this page ' + req.session.views['/bar'] + ' times </p> \n');
        res.write('<p>expires in: ' + (session.cookie.maxAge / 1000) + 's</p>');
        res.write(`<p>This will print the attribute I set earlier: ${ someAttribute }</p>\n`);
        res.end('done');
    } else {
        req.session.views = 1;
        res.end('welcome to the session demo. refresh!');
    }
});

require('./bot')(app);
require('./app')(app);


/**
 * REST API Routes Endpoints
 */

/**
 * GET /api/v1/photos
 * For StuckWanYah Facebook InstantGame, runs on user Facebook feeds
 * Returns 2 random photos of the same gender that have not been voted yet.
 */
router.get("/photos/twophotos", function(req, res, next){
    var choices = ['female', 'male'];
    var randomGender = _.sample(choices);

    Photos
    .find(/*{random: {$near: [Math.random(), 0]}}*/)
    .where("voted", false)
    .where("gender", randomGender)
    .limit(2)
    .exec(function(err, photos){
        if (err)
            return next(err);

        if (photos.length === 2) {
            return res.send(photos);
        }

        var oppositeGender = _.first(_.without(choices, randomGender));

        Photos.find({
            /*random: {
                $near: [Math.random(), 0]
            }*/
        }).where("voted", false).where("gender", oppositeGender).limit(2).exec(function(err, photos){
            if (err)
                return next(err);

            if (photos.length === 2)
                return res.send(photos);

            Photos.update({}, {
                $set: {
                    voted: false
                }
            }, {
                multi: true
            }, function(err){
                if (err)
                    return next(err);
                res.send([]);
            });
        });
    });
});

/**
 * POST /api/v1/photos
 * Adds new photo to the database.
 */
router.post('/photos', function(req, res, next){
    var gender = req.body.gender;
    var characterName = req.body.name;
    var characterIdLookupUrl = 'https://api.eveonline.com/eve/CharacterID.xml.aspx?names=' + characterName;
    var parser = new xml2js.Parser();
    async.waterfall([
        function(callback){
            request.get(characterIdLookupUrl, function(err, request, xml){
                if (err) return next(err);
                parser.parseString(xml, function(err, parsedXml){
                    if (err) return next(err);
                    try {
                        var characterId = parsedXml.eveapi.result[0].rowset[0].row[0].$.characterID;
                        Photos.findOne({ characterId: characterId }, function(err, character){
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
        function(characterId){
            var characterInfoUrl = 'https://api.eveonline.com/eve/CharacterInfo.xml.aspx?characterID=' + characterId;
            request.get({ url: characterInfoUrl }, function(err, request, xml){
                if (err) return next(err);
                parser.parseString(xml, function(err, parsedXml){
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
                        character.save(function(err){
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
 * PUT /api/v1/photos
 * Update winning and losing count for both photos.
 */
router.put('/photos', function(req, res, next){
        var winner = req.body.winner;
        var loser = req.body.loser;

        if (!winner || !loser) {
            return res.status(400).send({ message: 'Voting requires two photos.' });
        }
        if (winner === loser) {
            return res.status(400).send({ message: 'Cannot vote for and against the same photo.' });
        }

        async.parallel([
            function(callback){
                    Photos.findOne({
                        imageId: winner
                    }, function(err, winner){
                        callback(err, winner);
                    });
                },
                function(callback){
                    Photos.findOne({
                        imageId: loser
                    }, function(err, loser){
                        callback(err, loser);
                    });
                }
            ],
            function(err, results){
                if (err) return next(err);

                var winner = results[0];
                var loser =results[1];
                var rating;

                rating = getRating(winner, loser);

                if (!winner || !loser) {
                    return res.status(404).send({ message: 'One of the photos no longer exists.' });
                }

                if (winner.voted || loser.voted) {
                    res.status(200).end();
                }

                async.parallel([
                    function(callback){
                        winner.wins++;
                        winner.voted = true;
                        winner.ratings = rating.winner;
                        winner.random = [Math.random(), 0];
                        winner.save(function(err){
                            callback(err);
                        });
                    },
                    function(callback){
                        loser.losses++;
                        loser.voted = true;
                        loser.ratings = rating.loser;
                        loser.random = [Math.random(), 0];
                        loser.save(function(err){
                            callback(err);
                        });
                    }
                ], function(err){
                    if (err) {
                        return next(err);
                    }
                    res.status(200).end();
                });
            });
    });

/**
 * GET /api/v1/photos/top?race=caldari&bloodline=civire&gender=male
 * Return 10 highest ranked photos. Filter by gender
 */
router.get('/photos/top', sessionChecker, function(req, res, next){
    console.log('527: ' + req.query);

    top10HottestFriends({
        params: req,
        success: function(obj){
            res.send(obj);
        }
    });
});

/**
 * GET /api/v1/photos/top/share
 * Share the top 10 highest ranked photos on Facebook
 */
router.get('/photos/top/share', function(req, res, next){
    var userId = req.session.user_id;

    var content = {
        sender: userId,
        caption: "",
        url: ''
    };

    publishTopTenHottestPhotos(content);
});
router.get('/photos/hottest', function (req, res, next) {
    let gender = shimOrhim(req.session.gender);

    Photos.find({})
    .sort({'ratings': -1})
    .where({"gender": gender})
    .limit(1)
    .exec(function(err, result){
        if (err) res.send(err);
        res.json(result);
    });
});
router.get('/photos/me/block', function (req, res, next) {
    var userId = req.session.user_id; //req.query.userId;
    processBlockUnblock(userId);
});
router.get('/photos/voters', function(req, res, next) {
    Photos.aggregate(
        // select the fields we want to deal with
        { $project: { displayName: 1, voters: 1 } },
        // unwind 'likes', which will create a document for each like
        //{ $unwind: '$voters' },
        // group everything by the like and then add each name with that like to
        // the set for the like
        { $group: {
                _id: { name: '$voters' },
                voters: { $addToSet: '$displayName' }
            } }, function(err, result) {
            if (err) throw err;
            res.send(result);
        }
    );
});

/**
 * GET /api/v1/stats
 * Display Database statistics
 */
router.get('/stats', function(req, res, next){
    async.parallel([
        function(callback){
            // GET /api/v1/photos/count
            // Returns the total # of photos in the Database
            // total photos
            Photos.count({}, function(err, count){
                callback(err, count);
            });
        },
        function(callback){
            // total females
            Photos.count({gender: "female"}, function(err, femaleCount){
                callback(err, femaleCount);
            });
        },
        function(callback){
            // total males
            Photos.count({"gender":"male"}, function(err, maleCount){
                callback(err, maleCount);
            });
        },
        function(callback){
            // total votes cast
            Photos.aggregate(
                { $group: { _id: null, total: { $sum: '$wins' } } },
                function(err, winsCount){
                    callback(err, winsCount[0].total);
                }
            )
        },
        function(callback){
            // total page hits
            Hits.aggregate(
                { $group: {_id: null, total: { $sum: '$hits' } } },
                function(err, pageHits){
                    var pageHits = pageHits.length ? pageHits[0].total : 0;
                    callback(err, pageHits);
                }
            )
        },
        function(callback){
            // total blocked photos
            Photos.count({'is_blocked':true}, function(err, blocked){
                callback(err, blocked);
            });
        },
        function(callback){
            // total number of visitors per month
            Hits.count('monthly', function(err, visitors) {
                callback(err, visitors);
            });
        }
    ],
    function(err, results){
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
 * PUT /api/v1/hits
 * Update site hits
 */
router.put("/hits", function(req, res, next){
    processPageHits({
        params: req,
        success: function(obj){
            res.send(obj);
        },
        error: function(err){
            console.error("Error occurred: ", err);
        }
    });
});

/**
 * GET /api/v1/auth/me/
 * Retrieve current user status
 */
router.get('/auth/me', authenticate, getCurrentUser, getOne);

/**
 * Facebook Endpoints
 * @Router /api/v1/auth/facebook
 * Request will be redirected to Facebook
 */
router.get('/auth/facebook', 
    passport.authenticate('facebook', { 
        scope: ['public_profile', 'id', 'user_photos', 'picture', 'age_range', 'gender', 'user_friends', 'friends',] 
    }));
router.get('/auth/facebook/callback', 
    passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/foo' 
    //}), function(req, res) {
    // Successful authentication, redirect home
    //res.json(req.user);
    //res.redirect('/');
}));

/**
 * GET /auth/facebook/token?access_token=<TOKEN_HERE>
 * Authenticate user Facebook login
 *
 * This controller logs in an existing user with Facebook passport.
 *
 * When a user logs in with Facebook, all of the authentication happens on the
 * client side with Javascript.  Since all authentication happens with
 * Javascript, we *need* to force a newly created and / or logged in Facebook
 * user to redirect to this controller.
 *
 * What this controller does is:
 *
 *  - Grabs the user's Facebook access token from the query string.
 *  - Once I have the user's access token, I send it to server, so that
 *    I can either create (or update) the user on server side.
 *  - Then I retrieve the StuckWanYah account object for the user, and log
 *    them in using our normal session support.
 *
 * Logic from stormpath
 *
 * @method
 */
router.post('/auth/facebook/token', passport.authenticate('facebook-token', {session: false}), function (req, res, next){
    var access_token = req.query.access_token;
    console.log("776: " + access_token);

    if (!req.user) {
        return res.send(req.session.c_user ? 200 : 401, 'User Not Authenticated');
    }

    // prepare token for API
    req.auth = {
        id: req.user.id
    };
    res.session.access_token = access_token;

    next();
}, /*generateToken,*/ sendToken);

/**
 * POST /api/v1/auth/facebook/login
 * Login with facebook in order to use user's pictures, friends list, etc...
 */
router.post('/auth/facebook/login', notLoggedIn, function (req, res) {
    var accessToken = req.query.authResponse.accessToken;
    var userId = req.query.authResponse.userId;
    var expires = req.query.authResponse.expiresIn;

    Photos.findOne({ where: { 'facebookProvider.id': userId } }).then(function (err, user) {
        if (!user) {
            // creates new user from facebook
            getUserDetailsFromFacebook(userId);
        } else {
            getUserFriends(userId);
            setSessionAttachHeaders({
                req: req, res: res,
                user: {
                    id: userId,
                    name: user.displayName,
                    gender: user.gender
                },
                accessToken: {
                    access_token: accessToken,
                    expiry_date: expires
                }
            });
            res.redirect('/');
        }
    });
});

/**
 * POST /api/v1/foo/facebook/logout
 * Logout with facebook
 */
router.post("/auth/facebook/logout", isLoggedIn, function (req, res, next) {
    let url = req.session.reset() ? '/login' : '/';
    if (req.session.user_id && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        req.logout();

        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect(url);
            }
        });
    }
    next();
});

/**
 * Instagram Endpoints
 * @Router /api/v1/auth/instagram
 */
router.get('/auth/instagram', passport.authenticate('instagram'), function(req, res) {
    // request will be redirected to Instagram
});
router.get('/auth/instagram/callback', passport.authenticate('instagram'), function(req, res) {
    res.json(req.user);
});

/**
 * GET /api/v1/instagam/photos
 * Get photos from instagram
 */
router.route("/instagram/photos")
    .get(function (req, res, next) {
        res.send("Welcome to StuckWanYah instagram. I collect peeple's photos from instagram, you vote who's hotter?")
    })
    .post(function(req, res, next){
        var body = req.body;
        Photo.findOne({ instagramId: body.user.id }, function(err, existingUser){
            if (existingUser) {
                var token = createToken(existingUser);
                return res.send({ token: token, user: existingUser });
            }

            var user = new User({
                instagramId: body.user.id,
                username: body.user.username,
                displayName: body.user.full_name,
                picture: body.user.profile_picture,
                accessToken: body.access_token
            });

            user.save(function(){
                var token = createToken(user);
                res.send({ token: token, user: user });
            });
        });
    });

/**
 * Twitter Endpoints
 * @Router /api/v1/auth/twitter
 */
router.get('/auth/twitter', passport.authenticate('twitter'), function(req, res) {
    // request will be redirected to Twitter
});
router.get('/auth/twitter/callback', passport.authenticate('twitter'), function(req, res) {
    res.json(req.user);
});

// Global Functions
var renderIndexPage = function(config){
    getTwoRandomPhotos(config);
};

var getTwoRandomPhotos = function(config){
    var randomImages;
    var choices = ['female', 'male'];
    var randomGender = _.sample(choices);
    var gender = shimOrhim(config.params.session.gender);
    var userId = config.params.session.user_id;

    Photos
        .find({
            random: {$near: [Math.random(), 0]},
            "facebookProvider.id": {$ne: userId}
        })
        .where({age: {$gt: 13}})
        .where({gender: gender}) //randomGender)
        .where({is_blocked: false})
        .where({voted: false})
        .lean()
        .limit(2)
        .exec()
        .then(function(error, photos){
            // Assign all 2 random pictures to randomPictures
            if (photos.length === 2 && photos[0].imageId !== photos[1].imageId) {
                randomImages = photos;
            } else if (photos.length < 2 || photos.length !== 2 && photos[0].imageId === photos[1].imageId) {
                
                var oppositeGender = _.first(_.without(choices, randomGender));

                Photos
                    .find({
                        random: {$near: [Math.random(), 0]},
                        "facebookId": { $ne: userId }
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
                            Photos.update({}, {$set: {"voted": false}
                                }, {multi: true}, function (err) {
                                    if (err) config.error.call(this, err);
                                }
                            );
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
        })
        .catch(function(error){
            config.error.call(this, error);
        });

};

var rateImages = function(config){
    var winnerID = config.params.query.winner;
    var loserID = config.params.query.loser;
    // getting the current user id from session
    var voter = config.params.session.user_id;

    if (winnerID && loserID) {
        async.parallel([
            function(callback){
                Photos.findOne({ imageId: winnerID }, function(err, winner){
                    callback(err, winner);
                });
            },
            function(callback) {
                Photos.findOne({ imageId: loserID }, function(err, loser) {
                    callback(err, loser);
                });
            }
        ], function(err, results) {
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

                async.parallel({
                    winner: function(callback){
                        winner.wins++;
                        winner.score = score.player1_actual_score;
                        winner.ratings = winnerNewRatings; //winnerNewScore;
                        winner.voted = true;
                        winner.random = [Math.random(), 0];
                        // keep record who voted who and who plays who
                        winner.voted_by.push(voter);
                        winner.challengers.push(loser.imageId);

                        winner.save(function(err){
                            callback(err);
                        });
                    },
                    loser: function(callback) {
                        loser.losses++;
                        loser.score = score.player2_actual_score;
                        loser.ratings = loserNewRatings; //loserNewScore;
                        loser.voted = true;
                        loser.random = [Math.random(), 0];
                        // keep record who voted who and who plays who
                        loser.voted_by.push(voter);
                        loser.challengers.push(winner.imageId);

                        loser.save(function(err){
                            callback(err);
                        });
                    }
                },
                function(err, results){
                    if (err) config.error.call(this, err);
                    config.success.call(this);
                });
            });
    } else {
        config.error.call(this, null, 'Voting requires two photos.' );
    }
};

var tieBreaker = function(config){
    var player_1 = config.params.query.player1;
    var player_2 = config.params.query.player2;
    var voter = config.params.session.user_id;

    if (player_1 && player_2){
        async.parallel({
            player1: function(callback){
                Photos.findOne({imageId: player_1}, function(err, player1){
                    callback(err, player1);
                });
            },
            player2: function(callback){
                Photos.findOne({imageId: player_2}, function(err, player2){
                    callback(err, player2)
                });
            }
        }, function(err, results){
            var player_1 = results[0];
            var player_2 = results[1];

            var score = actualScore(player_1, player_2);

            var player1ExpectedScore = expectedScore(player_1.ratings, player_2.ratings);
            var player2ExpectedScore = expectedScore(player_2.ratings, player_1.ratings);
 
            var player1NewRatings = elo.newRating(player1ExpectedScore, 0.5, player_1.ratings);
            var player2NewRatings = elo.newRating(player2ExpectedScore, 0.5, player_2.ratings);

            var player1NewScore = winnerScore(player_1.score, player1ExpectedScore);
            var player2NewScore = loserScore(player_2.score, player2ExpectedScore);

            async.parallel({
                player1: function(callback){
                    // increment the number of draws and push player2 id to challenger list
                    player_1.draws++;
                    player_1.score = score.player1_actual_score;
                    player_1.ratings = player1NewRatings; //player1NewScore;
                    player_1.challengers.push(player_2.imageId);
                    player_1.voted_by.push(voter);
                    player_1.save(function(err){
                        callback(err);
                    });
                },
                player2: function(callback){
                    // increment the number of draws and push player1 id to challenger list
                    player_2.draws++;
                    player_2.score = score.player2_actual_score;
                    player_2.ratings = player2NewRatings; //player2NewScore;
                    player_2.challengers.push(player_1.imageId);
                    player_2.voted_by.push(voter);
                    player_2.save(function(err){
                        callback(err);
                    });
                }
            }, function(err, results){
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
    this.Qa = Math.pow(10, Ra/400);
    this.Qb = Math.pow(10, Rb/400);
    this.Ea = function(Qa, Qb) {
        return Qa/(Qa + Qb)
    };
    this.Eb = function(Qa, Qb) {
        return Qb/(Qa + Qb)
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
function loserScore(score, expected, k = 32){
    return Math.round(score + k * (0 - expected));
};
function performanceRating(player1, player2){
    var games = player1.wins + player1.losses + player1.draws;
    var performance_rating = (player2.ratings + 400 * (player1.wins - player1.losses) / games);
    return performance_rating;
};
function updateValue(id1, id2, score1, score2){
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
function findAndUpdateDB(id1, id2, R1, R2){
    Photos.update({ imageId: id1 }, { $set: { score: R1 }}, function(err, updated){
        console.log(R1 + " " + R2);
    });
    Photos.update({ imageId: id2 }, { $set: { score: R2 }}, function(err, updated){
    });
};

/**
 * Retrieving photos using query
 * @param config
 * Returns the top 10 highest ratings
 */
var topTenRatings = function(config){
    var gender = shimOrhim(config.params.session.gender);
    Photos.find().sort({
        'ratings': -1
    }).where({
        "gender": gender
    }).limit(10).exec().then(function(result){
        //if (err) next(err);
        //res.locals.topTen = result;
        //next();
        config.success.call(this, result);
    }).catch(function(err){
        config.error.call(this, err);
    });
};

/*
// Sort the photos 

            all_photos.sort(function(p1, p2){
                return (p2.likes - p2.dislikes) - (p1.likes - p1.dislikes);
            });


findId = function(obj){
                return obj.id === vote.id;
            }
            elem = pending.filter(findId);
*/

var top10HottestFriends = function(config){
    console.log("1264: " + config.params.query.field);
    var query_field = config.params.query.field;
    var query_gender = config.params.query.gender;
    var query_limit = config.params.query.limit;

    Photos
        .find({"facebookId": { $ne: config.params.session.user_id } })
        .sort('-ratings')
        //.where({'gender': query_gender})
        .limit(10)
        .exec(function(err, ranks){
            if (err) console.error("1275: " + err);

            var rankCount = _.countBy(ranks, function(rank) { return rank });
            var max = _.max(rankCount, function(rank) { return rank });
            var inverted = _.invert(rankCount);
            var topRank = inverted[max];
            var topCount = rankCount[topRank];

            //console.log("1284: " + { rank: topRank, count: topCount });

            if (err) {config.error.call(this, err);}
            config.success.call(this, ranks);
        });

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


};
//top10HottestFriends();

var topTenWinings = function(config){
    // Query params object
    var params = config.params.query;
    var gender = shimOrhim(config.params.session.gender);
    var conditions = {};

    _.each(params, function(value, key){
        conditions[key] = new RegExp('^' + value + '$', 'i');
    });

    Photos.find(conditions)
        .where({ "gender": gender })
        .sort('-wins') // Sort in descending order (highest wins on top)
        .limit(10)
        .exec()
        .then(function(photos){
            // Sort by winning percentage
            photos.sort(function(a, b){
                if (a.wins / (a.wins + a.losses) < b.wins / (b.wins + b.losses)) { return 1; }
                if (a.wins / (a.wins + a.losses) < b.wins / (b.wins + b.losses)) { return -1; }
                return 0;
            });
            config.success.call(this, photos);
        }).catch(function(err){
        config.error.call(this, err);
    });
};

var processPageHits = function(config){
    Hits.update({page: config.params.body.page},
        { $inc: { hits: 1 } },{ upsert: true }
    ).then(function(hit){
        config.success.call(this, {hits: hit.hits});
    }).catch(function(err){
        config.error.call(this, err);
    });
};


/**
 * User Authentication utils
 * Session, Cookies, Database
 */
var generateToken = function(req, res, next){
    req.token = createToken(req.auth);
    next();
};
function createToken(auth){
    return jwt.sign({
        id: auth.id
    }, 'stuckwanyah', {
        expiresIn: 60 * 120
    });
};
/*function createToken(user){
  var payload = {
    exp: moment().add(14, 'days').unix(),
    iat: moment().unix(),
    sub: user._id
  };

  return jwt.encode(payload, keys.facebook.pageAccessToken);
};*/
function sendToken(req, res){
    res.setHeader('x-auth-token', req.token);
    res.status(200).send(req.auth);
};
function authenticate(req, res) {
    generateToken(req, res);
};
/*
var authenticate = expressJwt({
    secret: 'my-secret',
    requestProperty: 'auth',
    getToken: function(req) {
        if (req.headers['x-auth-token']) {
            return req.headers['x-auth-token'];
        }
        return null;
    }
});
*/
function isAuthenticated(req, res, next){
    if (!(req.headers && req.headers.authorization)) {
        return res.status(400).send({ message: 'You did not provide a JSON Web Token in the Authorization header.' });
    }

    var header = req.headers.authorization.split(' ');
    var token = header[1];
    var payload = jwt.decode(token, keys.facebook.appSecret);
    var now = moment().unix();
    if (now && payload.exp) {
        return res.status(401).send({ message: 'Token has expired.' });
    }

    Photo.findById(payload.sub, function(err, user){
        if (!user) {
            return res.status(400).send({ message: 'User no longer exists.' });
        }

        req.user = user;
        next();
    });
};
function isLoggedIn (req, res, next) {
    //req.loggedIn = !!req.user;
    //next();
    //!req.session.user_id ? res.redirect('/auth/facebook/login') : next();
    return req.session.user_id ? true : false;
};
function notLoggedIn(req, res, next) {
    req.session.id ? res.redirect('/auth/facebook/login') : next();
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
function getUser(userId) {
    Photos.findOne({"facebookProvider.id": userId}, (err, user) => {
        return user
    });
};
function getOne(req, res) {
    var user = req.user.toObject();

    delete user['facebookProvider'];
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
function processPostback(event){
    var senderId = event.sender.id;
    var payload = event.postback.payload;

    if (payload === "GET_STARTED") {

        processUserSex(senderId);

        // Getting user's first name from user Profile API
        // and include it in the greeting
        request({
            url: "https://graph.facebook.com/v2.6/" + senderId,
            qs: {
                access_token: process.env.PAGE_ACCESS_TOKEN,
                fields: "first_name"
            },
            method: "GET"
        }, function(error, response, body){
            var greeting, name = "";
            if (error) {
                console.log("1361: " + "Error getting user's name: " + error);
            } else {
                var bodyObj = JSON.parse(body);
                name = bodyObj.first_name;
                greeting = "Hi " + name + ". ";
            }
            var message = greeting + "Welcome to StuckWanYah!, the app that lets you put your taste in your friends' hotness";
            sendMessage(senderId, { text: message });
        });
    } else if (payload === "Block Me") {
        processBlockUnblock(senderId);
        sendMessage(senderId, { text: "Your photos has been blocked. You will not be able to be voted or vote." });
    } else if (payload === "Unblock Me") {
        processBlockUnblock(senderId);
        sendMessage(senderId, { text: "Your photos has been restored and you can be able to be voted or vote" });
    } else if (payload === "") {}
};

/**
 * Messenger API
 * Process message from user for any matching keyword and perform actions
 * @param event
 */
function processMessage(event){
    if (!event.message.is_echo) {
        var message = event.message;
        var senderId = event.sender.id;

        console.log("1531: " + "Received message from senderId: " + senderId);
        console.log("1532: " + "Message is: " + JSON.stringify(message));

        // You may get a text or attachment but not both
        if (message.text) {
            var formattedMsg = message.text.toLowerCase().trim();

            // If we receive a text message, check to see if it matches any special
            // keywords and send back the corresponding movie detail.
            // Otherwise, search for the new movie.
            switch (formattedMsg) {
                case "rankings":
                    getPlayerDetail(senderId, formattedMsg);
                    break;
                case "block me":
                    processBlockUnblock(senderId);
                    break;
                case "unblock me":
                    processBlockUnblock(senderId);
                    break;
                case "share":
                    publishTopTenHottestPhotos(senderId, null);
                    break;
                case "publish":
                    publishTopTenHottestPhotos(senderId, null);
                case "post":
                    publishTopTenHottestPhotos(senderId, null);
                default:
                    findMovie(senderId, formattedMsg);
            }
        } else if (message.attachments) {
            sendMessage(senderId, {text: "Sorry, I don\'t understand your request."});
        }
    }
};

/**
 * Messenger API
 * Sends message to user
 * @param recipientId
 * @param message
 */
function sendMessage(recipientId, message){
    request({
        url: "https://graph.facebook.com/v.2.6/me/messages",
        qs: { access_token: keys.facebook.pageAccessToken },
        method: "POST",
        json: {
            recipient: { id: recipientId },
            message: message,
        }
    }, function(error, response, body){
        if (error) {
            console.log("Error sending message: " + response.error);
        }
    });
};

/**
 * Messenger API
 * Finds movie on OMDBAPI Database
 * @param userId
 * @param movieTitle
 */
function findMovie(userId, movieTitle){
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
                Photos.findOneAndUpdate(query, update, options, function(error, movie){
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
function processBlockUnblock(userId){
    var query = { "imageId": userId };
    var attempts = 0;
    Photos.findOne(query, function(err, photo){
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
function blockPhoto(callback){
    callback.is_blocked = true;
    callback.save(function(error, response){
        if (error) 
            throw error;
        else 
            console.log("Your photo has been blocked. You will not be able to be voted nor vote again in the future."); 
            sendMessage(callback.facebookId, {text: "Your photo has been blocked. You will not be able to be voted nor vote again in the future."});
    });
    new BlockedPhotos({id: callback.imageId,is_blocked: true}).save();
    return callback;
};
function unblockPhoto(callback){
    callback.is_blocked = false;
    callback.save(function(error, response){
        if (error) throw error;
        else 
            console.log("Your photo has been unblocked. Your photo can be voted by your friends."); 
            sendMessage(callback.facebookId, {text: "Your photo has been unblocked. Your photo can be voted by your friends."});
    });
    BlockedPhotos.remove({id: callback.imageId}).save();
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
function processUserGender(event){
    var senderId = event.sender.id;    
    // Getting user's gender from user Profile API
    // and redirect to respective function
    request({
        url: `https://graph.facebook.com/v2.6/${senderId}`,
        qs: {
            access_token: keys.facebook.pageAccessToken,
            fields: "gender"
        },
        method: "GET"
    }, function(error, response, body){
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
function shimOrhim(gender){
    return gender == 'female' ? 'male' : 'female';
};

function randomQuery(config){
    var filter = {
        "gender": gender,
        "voted": false, 
        "is_blocked": false, 
        "facebookProvider.id": {$ne: userId}
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

/**
 * Algorithm for StuckWanYah
 * After user has logged in with facebook, these action is invoked
 */
/*
 * Checks if user logging in is an existing user @goto getUserFriends()
 * if not creates a new user @goto getUserDetailsFromFacebook()
 * @params facebookId User Facebook ID from Facebook
 */

//checkUserExistance(123456789);

function /* step: 1 */ checkUserExistance(facebookId) {
    Photos.findOne({"facebookProvider.id": facebookId}).then((user) => {
        if (!user) {
            /* user doesn't exist */
            /* goto: -> step: 2 */ getUserDetailsFromFacebook(facebookId);
        } else {
            /* user exists */
            /* goto: -> step: 5 */ getUserFriends(user, facebookId);
        }
    }).catch((error) => {
        throw new Error(error);
    });
};

/** Get user */ // https://graph.facebook.com/{{fb_user.id}}/picture?type=square&height=200&width=200
function /* step: 2 */ getUserDetailsFromFacebook(userId){
    return request({
        url:`https://graph.facebook.com/v2.6/${userId}/`,
        qs: {
            access_token: keys.facebook.userAccessToken,
            fields:"id,name,gender,age,picture.type(square).width(200).height(200),link"
        },
        method: "GET"
    }, (error, response, body) => {
        if (error) throw new Error(error);
        if (response) {
            var bodyObj = JSON.parse(body);
            /* goto: -> step: 3 */ createNewUser(bodyObj);
        }
    });
};

/** creates new user cause it does not exist in the database */
function /* step: 3 */ createNewUser(object){
    var params = {
        imageId: object.id,
        displayName: object.name,
        age: object.age,
        gender: object.gender,
        picture: object.picture,
        profileUrl: object.link,
        facebookProvider: {id: object.id}
    };
    Photos.create(params).then(newUser => {
        /* goto: -> step: 5 */ getUserFriends(newUser.facebookId);
    }).catch(error => {
        throw new Error(error);
    });
};

function /* step: 4 */ getUserProfilePictureFromFacebook(fb_userid) {
    request({
        url: `https://graph.facebook.com/${fb_userid}/picture?type=square&height=200&width=200`,
        qs: {
            access_token: keys.facebook.userAccessToken
        },
        method: "GET"
    }, (error, response, body) => {
        /* goto: -> step: 5 */ 
    });
};

function /* step: 5 */ getUserFriends(userId){
    return request({
        url:`https://graph.facebook.com/v2.12/${userId}/friendslist`,
        qs: {
            access_token: keys.facebook.userAccessToken,
            fields:"id,user_friends,gender,age"
        },
        method: "GET"
    }, (error, response, body) => {
        if (error) throw new Error(error);
        if (response) {
            var bodyObj = JSON.parse(body);            
            /* goto: -> step: 6 */ updateUserFriendsList(userId, bodyObj);
        }
    });
};

function /* step: 6 */ updateUserFriendsList(userId, object) {
    var gender = object.gender;
    var id = object.id;
    var age = object.age;
    var update = {
        facebookFriends: id
    };
    Photos.update({ "facebookProvider.id": userId }, { $set: update },{ upsert: true })
    .then(updatedProfile => {
        /* goto: -> step: 7 */ checkFriendExistanceAsUser(userId, updatedProfile.facebookFriends);
    }).catch(error => {
        throw new Error(error);
    });
};

/* check database if particular friend id exists already as user*/
function /* step: 7 */ checkFriendExistanceAsUser(userId, friendslist) {
    async.each(friendslist, (friend, callback) => {
        Photos.findOne({"facebookProvider.id": friend.id}).then((friend) => {
            if (!friend) {
                /* goto: -> step: 8 */ getFriendDetailsFromFacebook(friend.id);
            }
        });
    });
};

function /* step: 8 */ getFriendDetailsFromFacebook(friendId){
    return request({
        url:`https://graph.facebook.com/v2.6/${friendId}/`,
        qs: {
            access_token: keys.facebook.userAccessToken,
            fields:"id,name,gender,age,picture.type(square).width(960).height(960),link"
        },
        method: "GET"
    }, (error, response, body) => {
        if (error) friendId.error.call(this, error);
        if (response) {
            var bodyObj = JSON.parse(body);            
            /* goto: -> step: 9 */ createNewUserFromFacebookFriends(userId, bodyObj);
        }
    });
};

function /* step: 9 */ createNewUserFromFacebookFriends(object) {
    var id = object.id;
    var name = object.name;
    var age = object.age;
    var gender = object.gender;
    var picture = object.picture;
    var link = object.link;

    new Photos({
        imageId: id,
        displayName: name,
        age: age,
        gender: gender,
        picture: picture,
        profileUrl: link,
        facebookProvider: {id: id}
    }).save().then(newUser => {
        console.log("new user has been created from facebook friends" + newUser);
    }).catch(error => {
        throw new Error(error);
    });
};

// Checks user id exists by querying the database using user id from InstantGame and TabApp 
function /* step: 10 */ checksInstantGameAndTabApp(userId) {
    Photos.findOne({where: {"facebookProvider.instantGameId": userId}}, function(error, response, body) {
        if (error) {
            throw new Error(error);
        }
        return response;
    });
};

/*
Photos.findOneAndUpdate(query, update, options, function(err, results){
        if (err) throw err;
        //console.log('Are the results MongooseDocuments?: %s', results[0] instanceof mongoose.Document);
        console.log(`created ${results.length} (+), updated ${results.length} (~)`);
    });
*/
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
function newRenderTwoPhotos(config){
    var gender = shimOrhim(config.params.session.gender);
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
// display my profile
router.get('/photos/me', function (req, res, next) {
    var userId = req.session.user_id;
    Photos.findOne({imageId:userId}).then((user) => {
        if (!user) console.log('user not found');
        res.json(user);
    });
});
// list all my facebook friends playing stuckwanyah
router.get('/photos/me/friends', sessionChecker, function(req, res, next){
    var userId = req.session.user_id;
    Photos
    .find({imageId: userId})
    .lean()
    .populate('friends')
    .select(['displayName', 'imageId', 'age', 'gender', 'picture', 'link'])
    .exec(function(err, friendslist) {
        if (!err) {
            res.json(friendslist[0].friends);
        } else {
            return new Error(err);
        }
    });
});
// populate my facebook friends list with names
router.get('/photos/me/friends/populate', function (req, res, next) {
    var userId = req.session.user_id;
    //populateFriendsList('100004177278169');
    Photos.find({}, function(err, friendslist) {
        if (friendslist) {
            Photos.findOne({imageId: userId}).then((user) => {
                if (!user) console.log('user not found');
                else {
                    var i;
                    for (i = 0; i < friendslist.length; i++) {
                        if (friendslist[i].id === user.id) {
                            console.log("can't add yourself to your list");
                            continue;
                        }
                        //user.facebookFriends.every(function(item){
                        //    console.log(item == friendslist[i].id)
                        //    //console.log("can't add same person multiple times");
                        //})
                        user.friends.push({
                            _id: friendslist[i].id,
                            facebookProvider: {id: friendslist[i].imageId}
                        });
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

router.route("/dummy")
    .get(function(req, res){
        console.log(req.query);
        res.json({
            "meta": {
                "type": "success",
                "code": 200,
                "message": "",
                "responseId": "43qtf3hk03y34gm41",
                "seesionID": req.sessionID,
                "seesion": req.session,
                "user_sid": req.cookies.user_sid
            },
            "data": {
                "id": 1,
                "name": "Joe Burns"
            }
        });
    })
    .post(function(req, res){
        console.log("Query: " + req.query)
        console.log("Body: " + req.body)
        console.log("Params: " + req.params)
        res.status(400);
    });

//createNewPlayer(require('./photos').photos);

/**
 * Retrieve current user's profile picture, friends list,
 * and basic info and save all to StuckWanYah database
 * @param data
 */
function createNewPlayer(data) {
    // create all of the dummy people
    async.each(data, function(profile, callback) {
        // find each user by profile
        Photos.findOne({imageId: profile.id}, function (error, photo) {
            // if the user with that id doesn't already exist create it
            if (!photo) {
                var update = {
                    // imageId is the facebook id
                    imageId: profile.id,
                    displayName: profile.displayName,
                    age: profile.age,
                    gender: profile.gender,
                    picture: profile.displayPicture,
                    imageUrl: profile.thumbSrc,
                    profileUrl: profile.profileUrl,
                    facebookProvider: {
                        instantGameId: profile.instant_game.id,
                        id: profile.id,
                        token: Math.random().toString().substr(2, 19),
                        friends: profile.friends,
                    },
                    // leave is_blocked false
                    random: [Math.random(), 0],
                    // leave the rest to default
                };

                Photos.update({ imageId: profile.id }, { $set: update },{ upsert: true }, function (error, photo) {
                    if (error) console.log(error);
                    return callback(error, photo);
                });

                //console.log(`created ${results.length} (+) new players`.cyan);

                /*var photos = new Photos(update);
                photos.save(function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('meow');
                    }
                });*/

            }
        });
    }, function(err) {
        if (err) {
            // handler error
            throw new Error(err);
        }
    });
};

app.route("/perfectMatch")
    .get(function(req, res, next){
        var choices = ["male", "female"];
        var randomGender = _.sample(choices);
        var oppositeGender = _.first(_.without(choices, randomGender));
        async.parallel({
            female: function(callback){
                Photos.findOneRandom({gender: "female", imageId: {$ne: req.session.user_id}}, function(error, female){
                    callback(error, female);
                });
            },
            male: function(callback){
                Photos.findOneRandom({gender: "male"}, function(error, male){
                    callback(error, male);
                });
            }
        }, function(error, results){
            if (error) return next(error);
            res.render("perfectMatch.html", {match: results});
        });
    })
    .post(function(req, res, next){
        var maleId = req.query.male;
        var femaleId = req.query.female;
        async.parallel({
            female: function(callback){
                Photos.findById(femaleId).then(function(response){
                    callback(null, response);
                }).catch(function(error){
                    callback(error);
                });
            },
            male: function(callback){
                Photos.findById(maleId).then(function(response){
                    callback(null, response);
                }).catch(function(response){
                    callback(error);
                });
            }
        }, function(error, results){
            if (error) return next(error);
            res.redirect("/perfectMatch");
        })
    });

/**
 * Publish the top 10 hottest friends on StuckWanYah Facebook page in carousel post
 * and hashtag all 10 photos plus the player posting the photos
 * @param userId
 * @param content
 */
function publishTopTenHottestPhotos(content){
    var defaultCaption = "Top 10 Hottest friends 😍😍😍"+
                         "#stuckwanyah, #dat_wan_how, #sweetlips";
    request({
        url: "https://www.facebook.com/Stuck-Wan-Yah-508382589546607/feed",
        qs: {
            access_token: keys.facebook.pageAccessToken,
            no_story: false,
            caption: typeof content.caption == "string" ? content.caption : defaultCaption,
            url: [content.url]
        },
        method: "POST"
    }, function(error, response, body){
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
var getMediaOptions = function(event){
    var options = {
        method: "GET",
        uri: `https://graph.facebook.com/v2.8/${event.user.id}`,
        qs: {
            access_token: keys.facebook.pageAccessToken,
            type: 'user',
            fields: 'photos.limit(2).order(reverse_chronological){link, comments.limit(2).order(reverse_chronological)}'
        }
    };

    return request(options).then(function(fbRes){
        res.json(fbRes);
    });
};
function postingImage(){
    const id = 'page or user id goes here';
    const access_token = 'for page if posting to a page, for user if posting to a user\'s feed';

    let postImageOptions = {
        method: 'POST',
        uri: `https://graph.facebook.com/v2.8/${id}/photos`,
        qs: {
            access_token: access_token,
            caption: 'Caption goes here',
            url: 'Image url goes here'
        }
    };

    request.post(postImageOptions);
};
function getUserProfilePicture(userId) {
    return "https://graph.facebook.com/"+ userId +"/picture?type=large"
};

// Deployment date 01/04/18
// Testing date 02/04/18 - 05/04/18
// Completion date 05/04/18
// Launching date 06/04/18 after school

// TODO: Fix: Fix Heroku issues
// TODO: Fixed: Fix persistent login with 
//       Facebook login, set up facebook login, set session 
// TODO: Fix: Fix mongodb issues
// TODO: Fix: Checking each user if exist, check if one data can be updated i.e. if profile picture changed, update with new propic uri, create new user