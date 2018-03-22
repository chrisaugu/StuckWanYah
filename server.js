// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
var express = require("express"),
    ejs = require('ejs'),
    session = require("express-session"),
    mongoose = require("mongoose"),
    Promise = require('promise'),
    _ = require('underscore'),
    moment = require("moment"),
    cookieParser = require('cookie-parser'),
    bodyParser = require("body-parser"),
    path = require("path"),
    favicon = require('serve-favicon'),
    parseurl = require('parseurl'),
    request = require("request"),
    //cors = require('cors'),
    jwt = require('jwt-simple'),
    //expressJwt = require('express-jwt'),
    async = require("async"),
    colors = require('colors'),
    //xml2js = require("xml2js"),
    //lwip = require('lwip'),
    fs = require('fs'),
    FB = require('fb'),
    GLOBAL = require("./config")
//passport = require('passport'),
//FacebookTokenStrategy = require('passport-facebook-token');

// Creating Global instance for express
const app = module.exports = express();
const router = express.Router();

// configure the instance
app.set('port', (process.env.PORT || 5000));

// Tell express where it can find the templates
app.set('views', path.join(__dirname + '/views'));
//Set ejs as the default template
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
// Make the files in the public/ folder avilable to the world
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
// Parse POST request data. It will be available in the req.body object
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//RESTful API requirements
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'sweetlips',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 2 * 7 * 24 * 60 * 60 * 1000 }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use(function (req, res, next) {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }

    if (!req.session.views) {
        req.session.views = {}
    }

    // get the url pathname
    var pathname = parseurl(req).pathname;

    // count the views
    req.session.views[pathname] = (req.session.views[pathname] || 0) + 1;

    if (req.session.seenyou) {
        res.setHeader('X-Seen-You', 'true');
    } else {
        // setting a property will automatically cause a Set-Cookie response to be sent
        req.session.seenyou = true;
        res.setHeader('X-Seen-You', 'false');
    }

    next();

});

// middleware function to check for logged-in users
var sessionChecker = function (req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        connected = true;
        res.redirect('/');
    } else {
        connected = false;
        next();
    }
};

app.use('/api/v1', router);

// Invoke instance to listen to port
// Create new server
app.listen(app.get('port'), function(){
    console.log("---------------------------".blue);
    console.log("Server running on port %d".magenta, app.get('port'));
    console.log("---------------------------".blue);
});

// Creating an instance for MongoDB
mongoose.connect(GLOBAL.db);
mongoose.connection.on("open", function(){
    console.log("-----------------------------------------------".blue);
    console.log("Connected: Successfully connect to mongo server".green);
    console.log("-----------------------------------------------".blue);
});
mongoose.connection.on('error', function(){
    console.log("--------------------------------------------------------------------".blue);
    console.log("Error: Could not connect to MongoDB. Did you forget to run 'mongod'?".red);
    console.log("--------------------------------------------------------------------".blue);
});

// Invoke model
var Sweetlips = require("./models/sweetlips.model");
// Register photos model
var Photos = Sweetlips.photos;
var Hits = Sweetlips.hits;
Photos.methods(['get', 'put','post', 'delete']).register(router, '/photos');
Hits.methods(['get', 'put','post', 'delete']).register(router, '/hits');

var sourceDirectory = "public/photos/";

/*
passport.use(new FacebookTokenStrategy({
        clientID: '1791165357568831', //'YOUR-FACEBOOK-CLIENT-ID',
        clientSecret: '70b43373323e9c92705ecec5b1189f78' //'YOUR-FACEBOOK-CLIENT-SECRET'
    },
    function (accessToken, refreshToken, profile, done) {
        Photos.upsertFbPhoto(accessToken, refreshToken, profile, function(err, user) {
            return done(err, user);
        });
    })
);
*/

var options = FB.options({
    appId		: GLOBAL.fb_app_id, // 'YOUR-APP-ID-HERE'
    appSecret	: GLOBAL.fb_app_secret,
    status		: false, // the SDK will attempt to get info about the current user immediately after init
    cookie		: true,  // enable cookies to allow the server to access the session
    xfbml		: false,  // With xfbml set to true, the SDK will parse your page's DOM to find and initialize any social plugins that have been added using XFBML
    version		: 'v2.8' // use graph api version 2.5
});

var fb = new FB.Facebook(options);
FB.setAccessToken('access_token'); // process.env.PAGE_ACCESS_TOKEN

// Global Vars
var accessToken; // = FB.getAccessToken();
var userId;
var userCountry;
var userGender = "male";
var gender = shimOrhim(userGender);
var connected;

var signedRequestValue = 'signed_request_value';
var signedRequest  = FB.parseSignedRequest(signedRequestValue);
if(signedRequest) {
    accessToken = signedRequest.oauth_token;
    userId = signedRequest.user_id;
    userCountry = signedRequest.user.country;
}

app.get('/foo', function (req, res, next) {
    let session = req.session;

    session.someAttribute = "foo";
    session.seenyou = true;
    session.connected = true;
    // Assign email to session.email variable
    session.email = req.body.email;
    session.c_user;
    session.username;
    session.isAuthenticated = true;

    res.write('Returning with some text: ' + session.someAttribute + '\n');
    res.write('you viewed this page ' + req.session.views['/foo'] + ' times\n');
    res.end('done');
});

app.get('/bar', function (req, res, next) {

    var someAttribute = req.session.someAttribute;

    if (req.session.views) {
        //req.session.views++;
        res.setHeader('Content-Type', 'text/html');
        res.write('<p>views: ' + req.session.views['/bar'] + '</p>');
        res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>');
        res.end()
    } else {
        req.session.views = 1;
        res.end('welcome to the session demo. refresh!');
    }

    res.write(`This will print the attribute I set earlier: ${ someAttribute }`);
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
    })
});

/**
 * REST API Routes Endpoints
 */

/**
 * GET /api/v1/photos
 * Returns 2 random photos of the same gender that have not been voted yet.
 */
//router.route("/photos")
    /*.get(sessionChecker, function(req, res, next){
        var choices = ['female', 'male'];
        var randomGender = _.sample(choices);

        Photos.find({
            random: {
                $ne: [Math.random(), 0]
            }
        }).where("voted", false).where("gender", randomGender).limit(2).exec(function(err, photos){
            if (err)
                return next(err);

            if (photos.length === 2) {
                return res.send(photos);
            }

            var oppositeGender = _.first(_.without(choices, randomGender));

            Photos.find({
                random: {
                    $ne: [Math.random(), 0]
                }
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
    });*/

/**
 * POST /api/v1/photos
 * Adds new photo to the database.
 */
router.route('/photos')
    .post(function(req, res, next){
        var query = req.body;
        Photos.create(query, function(err, photos){
            if(err)
                res.json(err);
            else {
                res.send(200, {
                    photos: photos
                });
            }
        });
    });

/*
router.route('/photos').post(function(req, res, next){
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
*/

/**
 * PUT /api/v1/photos
 * Update winning and losing count for both photos.
 */
router.route('/photos')
    .put(function(req, res, next){
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
                        image_id: winner
                    }, function(err, winner){
                        callback(err, winner);
                    });
                },
                function(callback){
                    Photos.findOne({
                        image_id: loser
                    }, function(err, loser){
                        callback(err, loser);
                    });
                }
            ],
            function(err, results){
                if (err)
                    return next(err);

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
 * GET /api/v1/photos/top
 * Return 10 highest ranked photos. Filter by gender
 * GET /api/v1/photos/top?race=caldari&bloodline=civire&gender=male
 */
router.route('/photos/top')
    .get(sessionChecker, function(req, res, next){
        console.log('470: ' + req.query);

        top10HottestFriends({
            params: req,
            success: function(obj){
                res.send(obj);
            },
            error: function(err){
                //console.error("Error occurred: ", err);
            }
        });
    });

/**
 * GET /api/v1/stats
 * Display Database statistics
 */
router.route('/stats')
    .get(function(req, res, next){
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
                        callback(err, blocked)
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

                res.send({
                    totalPlayerCount: totalCount,
                    femalePlayerCount: femaleCount,
                    malePlayerCount: maleCount,
                    blockedPhotos: blockedPhotos,
                    totalVotes: totalVotes,
                    totalPageHits: pageHits
                });
            });
    });

/**
 * POST /api/v1/submit
 * Sends direct message to StuckWanYah Facebook page
 */
router.route("/submit")
    .post(function(req, res, next){
        return new Promise(function(resolve, reject){
            request.post({
                url: `https://graph.facebook.com/v2.6/${ GLOBAL.fb_page_id }/messages`,
                qs: { access_token: GLOBAL.page_access_token },
                method: "POST",
                json: {
                    recipient: { id: GLOBAL.fb_page_id },
                    sender: req.body.fb_id,
                    message: req.body.message
                }
            }).then(function(response){
                //console.log("Message sent successfully to StuckWanYah Facebook page");
                res.status(200).redirect('/submit.html');
                resolve(true);
            }).catch(function (error) {
                //console.log("Error sending direct message to StuckWanYah Facebook page.");
                res.status(404).redirect('/submit.html');
                reject(false);
            })
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
            //console.error("Error occurred: ", err);
        }
    });
});


app.route('/welcome')
    .get(function (req, res) {
        if (!req.session.dummyUser && !req.session.dummyEmail) {
            res.setHeader('Content-Type', 'text/html');
            res.write('<form action="/welcome" method="post">');
            res.write('<input type="text" name="username" placeholder="Username">');
            res.write('</br>');
            res.write('<input type="text" name="email" placeholder="Email">');
            res.write('</br>');
            res.write('<input type="submit" value="Submit">');
            res.write('</form>');
            res.end();
        } else {
            //res.send(`Welcome ${req.session.dummyUser}, your email: ${req.session.dummyEmail}`);
            res.redirect('/');
        }
    })
    .post(function (req, res, next) {
        let session = req.session;
        session.dummyUser = req.body.username;
        session.dummyEmail = req.body.email;

        res.send(`Welcome ${session.dummyUser}, your email: ${session.dummyEmail}`);
    });


// Facebook Webhook
// Used for verification
router.get("/auth/facebook/webhook", function(req, res) {
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

// All callbacks for Messenger will be Posted here
router.post("/auth/facebook/webhook", function(req, res) {
    // Make sure this is a page subscribtion
    if (req.body.object === "page") {
        // Iterate over each entry
        // there may be multiple entries if batched
        req.body.entry.forEach(function(entry){
            // Iterate over each messaging event
            entry.messaging.forEach(function(entry){
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


var authUrl = 'https://graph.facebook.com/oauth/access_token';
function loginWithAccessToken(accessToken) {
    if (!accessToken) {
        console.info('A user attempted to log in via Facebook OAuth without specifying an OAuth token.');
        return oauth.errorResponder(req, res, new Error('Access token parameter required.'));
    }

    var userData = {
        providerData: {
            accessToken: accessToken,
            providerId: 'facebook'
        }
    };
}

/**
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
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled.
 *
 * Logic from stormpath
 *
 * @method
 */

router.route('/auth/facebook')
    .post(function (req, res, done) {
        var accessToken = req.query.access_token;
        var refreshToken = req.cookies.token;
        var profile = req.session.user_sid;
        console.log("678: " + req.query.access_token);

        Photos.upsertFbPhoto(accessToken, refreshToken, profile, function (err, user) {
            return done(err, user);
        })

        /*function (accessToken, refreshToken, profile, done) {
            User.upsertFbPhoto(accessToken, , profile, function(err, user) {
                return done(err, user);
            });
        })*/
    });
/*.post(passport.authenticate('facebook-token', { session: false }), function(req, res, next){
    if (!req.user) {
        return res.send(401, 'User Not Authenticated');
    };

    // prepare token for API
    req.auth = {
        id: req.user.id
    };

    next();
}, generateToken, sendToken);*/


/**
 * GET /api/v1/auth/me/
 * Retrieve current user status
 */
router.route('/auth/me')
    .get(authenticate, getCurrentUser, getOne);

/**
 * POST /api/v1/connect/facebook/
 * Login with facebook in order to use voter's pictures, friends list
 */
router.route('/auth/facebook/login')
    .get(//passport.authenticate('facebook', {
        //	scope: ['publish_actions', 'manage_pages', 'user_photos', 'publish_actions', 'public_profile', 'email', 'friends', 'user_bio', 'user_likes', 'user_photos', 'gender', 'user_friends']
        //});
    )
    .post(function (req, res) {
        var username = req.params.username,
            password = req.params.password,
            userId = req.session.userId;

        Photos.findOne({ where: { 'facebookProvider.id': userId } }).then(function (user) {
            if (!user) {
                res.redirect('/auth/facebook/login');
            } else if (!user.validatePassword(password)) {
                res.redirect('/auth/facebook/login');
            } else {
                // automatically sets user's is_blocked to false
                user.is_blocked = false;
                req.session.user = user.dataValues;
                req.session.c_user = user.id;
                res.redirect('/');
            }
        });
    });

/**
 * POST /api/v1/connect/facebook/
 * Logout with facebook
 */
router.post("/auth/facebook/logout",
        //passport.authenticate('facebook', {
        // log user out
        //});
        function (req, res, next) {
            if (req.session.user && req.cookies.user_sid) {
                res.clearCookie('user_sid');
                req.logout();
                res.redirect('/');
            }

            /*req.session.destroy(function (err) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/');
                }
            });*/

            next();
        }
);



router.get("/auth/facebook/connect", function(req, res, next) {
    const { queryTerm, searchType } = req.body;

    FB.getLoginUrl({
        scope: 'email, user_likes, user_photos, publish_actions, gender',
        redirect_uri: 'https://stuckwanyah.herokuapp.com/'
    });

    var friends = getFriends(1234);

    res.send(`Done: ${friends}`);
});

router.route('/auth/facebook/connect/me')
    .get(sessionChecker, function (req, res) {
        res.send('sign up');
    })
    .post(function(req, res) {
        Photos.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
            .then(function (user) {
                res.session.user = user.dataValues;
                res.redirect('/');
            })
            .catch(function (error) {
                res.redirect('/auth/me');
            });
    });

/**
 * Instagram Endpoints
 */
router.get('/auth/instagram/callback', function (req, res, next) {
    next();
});

/*
FB.api('oauth/access_token', {
    client_id: 'app_id',
    client_secret: 'app_secret',
    grant_type: 'client_credentials'
}, function(res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }

    var accessToken = res.access_token;
});*/

/**
 * Get photos from instagram
 */

router.route("/photos/instagram")
    .get(function (req, res, next) {
        res.send("Welcome to StuckWanYah instagram. I collect peeple's photos from instagram, you vote who's hotter?")
    })
    .post(function(req, res, next){
        User.findOne({ instagramId: body.user.id }, function(err, existingUser){
            if (existingUser) {
                var token = createToken(existingUser);
                return res.send({ token: token, user: existingUser });
            }
            var user = new User({
                instagramId: body.user.id,
                username: body.user.username,
                fullName: body.user.full_name,
                picture: body.user.profile_picture,
                accessToken: body.access_token
            });

            user.save(function(){
                var token = createToken(user);
                res.send({ token: token, user: user });
            });
        });
    });

router.post('/photos/:id/block', function (req, res, next) {
    var userid = req.params.id;
    processBlock(userid);
});
router.post('/photos/:id/unblock', function (req, res, next) {
    var userid = req.params.id;
    processUnblock(userid);
});


// Global Functions
var renderIndexPage = function(config){
    getTwoRandomPhotos(config);
};

var getTwoRandomPhotos = function(config){
    var randomImages;
    var choices = ['female', 'male'];
    var randomGender = _.sample(choices);

    var filter = { gender: gender, voted: false, is_blocked: false };
    var fields = {};
    var options = { limit: 2 };

    Photos
    //.findRandom(filter, fields, options)
        .find({ random: { $ne: [Math.random(), 0] } })
        .where("voted", false)
        .where("is_blocked", false)
        .where("gender", gender) //randomGender)
        .limit(2)
        .exec()
        .then(function(photos){
            // Assign all 2 random pictures to randomPictures
            if (photos.length === 2 && photos[0].image_id !== photos[1].image_id) {
                randomImages = photos;
            } else if (photos.length < 2 || photos.length !== 2) {

                //if (photos[0].image_id === photos[1].image_id) {}

                var oppositeGender = _.first(_.without(choices, randomGender));

                Photos
                //.findRandom({ gender: gender, voted: false, is_blocked: false }, {}, { limit: 2 })
                    .find({random: {$ne: [Math.random(), 0]}})
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
                            Photos.update({}, {
                                    $set: {"voted": false}
                                }, {multi: true}, function (err) {
                                    if (err) config.error.call(this, err);
                                }
                            );
                        }
                    })
                    .catch(function (err) {
                        config.error.call(err);
                    })
            }
        })
        .then(function(topRatings){
            config.success.call(this, {
                images: randomImages,
                expected: expectedScore,
                connected: connected
                //stuckwanyah: stuckwanphoto
                //topRatings: topRatings[0]
            });
        })
        .catch(function(error){
            config.error.call(this,error);
        });

};

var rateImages = function(config){
    var winnerID = config.params.query.winner;
    var loserID = config.params.query.loser;

    if (winnerID && loserID) {

        async.parallel([
                function(callback){
                    Photos.findOne({ image_id: winnerID }, function(err, winner){
                        callback(err, winner);
                    });
                },
                function(callback) {
                    Photos.findOne({ image_id: loserID }, function(err, loser) {
                        callback(err, loser);
                    });
                }
            ],
            function(err, results) {

                var winner = results[0],
                    loser = results[1],
                    rating, score, voter;

                // getting the current user id from facebook graph
                voter = {
                    id: '1234',
                    name: 'kitten'
                };

                // voter = getCurrentUser;

                //rating = getRating(winner, loser);
                score = getScore(winner, loser);

                //console.log('883: ' + performanceRating(winner, loser));

                var expected_score = expectedScore(winner.ratings, loser.ratings);
                var new_winner_rating = newRating(expected_score, score.winner, winner.ratings);
                var new_loser_rating = newRating(expected_score, score.loser, loser.ratings);

                async.parallel({
                        winner: function(callback){
                            winner.wins++;
                            winner.score = score.winner;
                            winner.ratings = new_winner_rating;// rating.winner;
                            winner.voted = true;
                            winner.random = [Math.random(), 0];
                            // keep record who voted who and who plays who
                            winner.vote_by.push(voter.id);
                            winner.challengers.push(loser.image_id);

                            winner.save(function(err){
                                callback(err);
                            });
                        },
                        loser: function(callback) {
                            loser.losses++;
                            loser.score = score.loser;
                            loser.ratings = new_loser_rating;// rating.loser;
                            loser.voted = true;
                            loser.random = [Math.random(), 0];
                            // keep record who voted who and who plays who
                            loser.vote_by.push(voter.id);
                            loser.challengers.push(winner.image_id);

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
        config.error.call(this, 'Voting requires two photos.' );
    }
};

var tieBreaker = function(config){
    var player_1 = config.params.query.player1;
    var player_2 = config.params.query.player2;

    if (player_1 && player_2){
        async.parallel([
            function(callback){
                Photos.findOne({ image_id: player_1 }, function(err, player1){
                    callback(err, player1);
                });
            },
            function(callback){
                Photos.findOne({ image_id: player_2 }, function(err, player2){
                    callback(err, player2)
                });
            }
        ], function(err, results){
            var player_1 = results[0];
            var player_2 = results[1];

            async.parallel({
                player1: function(callback){
                    // increment the number of draws and push player2 id to challenger list
                    player_1.draws++;
                    player_1.challengers.push(player_2.image_id);
                    player_1.save(function(err){
                        callback(err);
                    });
                },
                player2: function(callback){
                    // increment the number of draws and push player1 id to challenger list
                    player_2.draws++;
                    player_2.challengers.push(player_1.image_id);
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
        config.error.call(this, "Voting requires two photos");
    }
};

/**
 * ELO Rating System Implementation
 */
function getRating(winner, loser) {
    var K = 32,
        winnerExpected,
        loserExpected;

    winnerExpected = (1 / (1 + (Math.pow(10, (loser.ratings - winner.ratings) / 400))));
    loserExpected = (1 / (1 + (Math.pow(10, (winner.ratings - loser.ratings) / 400))));
    return {
        winner: Math.round(winner.ratings + (K * (1 - winnerExpected))),
        loser: Math.round(loser.ratings + (K * (0 - loserExpected)))
    };
}
// The calculated new rating of the player based on the expected outcome, actual outcome, and previous score
function newRating(expected_score, actual_score, previous_rating) {
    var difference = actual_score - expected_score;
    return Math.round(previous_rating + 32 * difference);
}
// score = new getScore(player_1_score, player_2_score)
// expected_score = new expectedScore(player_1_rating, player_2_rating)
// new_rating = newRating(expected_score, score, player_1_rating)
function getScore(winner, loser) {
    // Use the number of wins to add 1's to new array

    var winner_wins_arr = [];
    var winner_loses_arr = [];
    var winner_draws_arr = [];

    for (var i = 0; i < winner.wins; i++) {
        winner_wins_arr.push(1);

        for (var j = 0; j < winner.losses; j++) {
            winner_loses_arr.push(0);

            for (var k = 0; k < winner.length; k++) {
                winner_draws_arr.push(0.5);
            }
        }
    }

    var loser_wins_arr = [];
    var loser_loses_arr = [];
    var loser_draws_arr = [];

    for (var i = 0; i < loser.wins; i++) {
        loser_wins_arr.push(1);

        for (var j = 0; j < loser.losses; j++) {
            loser_loses_arr.push(0);

            for (var k = 0; k < winner.length; k++) {
                loser_draws_arr.push(0.5);
            }
        }
    }
    return {
        winner: (winner_wins_arr.length + winner_loses_arr.length + winner_draws_arr.length),
        loser: (loser_wins_arr.length + loser_loses_arr.length + loser_draws_arr.length)
    }
}
// Calculate the expected score outcome from to ratings
function expectedScore(Ra, Rb) {
    return parseFloat((1 / (1 + Math.pow(10, (Rb - Ra) / 400))).toFixed(4));
    // return (1 / (1 + Math.pow(10, (Rb - Ra) / 400)));
    // return 1 / (1 + Math.pow(10, ($b - $a) / 400));
}
// Calculate the new winner score, K-factor = 32
function winnerScore(score, expected, k = 32) {
    return score + k * (1 - expected);
    // return $score + 32 * (1 - $expected);
}
// Calculate the new loser score, K-factor = 32
function loserScore(score, expected, k = 32){
    return score + k * (0 - expected);
    // return $score + 32 * (0 - $expected);
}
function performanceRating(player1, player2){
    var performance_rating, games;
    games = player1.wins + player1.losses;

    return performance_rating = (player2.ratings + 400 * (player1.wins - player1.losses) / games);
}
function stuckwanyah(){
    Photos
        .find()
        .sort('-ratings')
        .where({'gender': gender})
        .limit(1)
        .exec(function (err, photo) {
            if (err) throw new Error(err);
            console.log("1068: " + photo);
            return photo;
        });
}

/**
 * Retrieving photos using query
 * @param config
 */
// Returns the top 10 highest ratings
function topTenRatings(config){
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
}

var top10HottestFriends = function(config){

    console.log("1197: " + config.params.query.field);
    var query_field = config.params.query.field;
    var query_gender = config.params.query.gender;

    Photos
        .find()
        .sort('-ratings') //.sort('-1')
        .where({'gender': gender})//.where({'gender': query_gender})
        .limit(10)
        //.select(query_field)
        .exec(function(err, ranks){
            if (err) console.error("1164: " + err);

            var rankCount = _.countBy(ranks, function(rank) { return rank});
            var max = _.max(rankCount, function(rank) { return rank });
            var inverted = _.invert(rankCount);
            var topRank = inverted[max];
            var topCount = rankCount[topRank];

            //console.log("1114: " + { rank: topRank, count: topCount });

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
 * Installing all photos in /photos/ directory onto mongodb
 */
function installImages(){

    var images = [];

    //Load all images from the photos folder into the database
    var photos_on_disk = fs.readdirSync(sourceDirectory);
    //insert the photos in the database. This is executed on every
    //start up of the your application, but because there is a unique
    // constraint on the name field, subsequesnt writes will fail
    // and you will still have only one record per image:
    photos_on_disk.forEach(function(photo){
        if (photo.substr(-4) === ".jpg") {
            Photos.insert({
                "image_id":"", // get id from facebook via graph api
                "name":"", // get name from facebook via graph api
                "age":"",
                "gender":"", // get gender from facebook via graph api
                "image_src":"https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/p200x200/"+photo, // get current profile pic
                "uri":"https://web.facebook.com/profile.php?id=", // get current user facebook profile link
                "is_blocked":false,
                "rating":0,
                "wins":0,
                "losses":0,
                "random":0,
                "voted":false,
                "vote_counts":0,
                "vote_timestamp":Date.now(),
                "rankings":0
            }, function(err, photos){
                if (err)
                    return (err);
                res.status(200).send(photos);
                console.log("1215: " + "Photos uploaded successfully");
            });
        }
    });
}
app.get("/photos/local", function(req, res, next){
    fs.readdir(sourceDirectory, function(err, photos){
        if (err) return next(err);
        //photos.forEach(function(photo){
        //if (photo.substr(-4) === ".jpg") {
        res.send(photos);
        //}
        //})
    })
});

/**
 * Processing Images
 */
fs.readdir(sourceDirectory, function (err, files){
    if (err)
        console.log("1236: " + err);
    //console.log(files);

    files.forEach(function(file){
        scaleImage(file);
    });

});

function scaleImage(file){
    /*
        lwip.open(sourceDirectory + file, function(err, image){
            if (err) console.log("1248: " + err);
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
                    .writeFile(destinationDirectory + file, function(err){
                        if (err) console.log(err);
                        console.log(file + ": has been processed");
                    });
            } else {
                console.log("1265: " + 'couldn\'t find no photo');
            }
        });
    */
}

/**
 * User Authentication utils
 * Session, Cookies, Database Manipulation
 */
var generateToken = function(req, res, next){
    req.token = createToken(req.auth);
    next();
};

function createToken(auth){
    return jwt.sign({
        id: auth.id
    }, 'my-secret', {
        expiresIn: 60 * 120
    });
}
/*function createToken(user){
  var payload = {
    exp: moment().add(14, 'days').unix(),
    iat: moment().unix(),
    sub: user._id
  };

  return jwt.encode(payload, GLOBAL.page_access_token);
};*/

function sendToken(req, res){
    res.setHeader('x-auth-token', req.token);
    res.status(200).send(req.auth);
};

function authenticate(req, res) {
    generateToken(req, res);
}

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
    var payload = jwt.decode(token, GLOBAL.fb_app_secret);
    var now = moment().unix();
    if (now && payload.exp) {
        return res.status(401).send({ message: 'Token has expired.' });
    }

    User.findById(payload.sub, function(err, user){
        if (!user) {
            return res.status(400).send({ message: 'User no longer exists.' });
        }

        req.user = user;
        next();
    })
}
function isLoggedIn(req, res, next){
    !req.session.id ? res.redirect('/auth/login') : next();

    //return req.session.id ? true : false;

    //req.session.id ? res.redirect('/') : next()
}
function getCurrentUser(req, res, next){
    Photos.findById(req.auth.id, function(err, user){
        if (err) {
            next(err);
        } else {
            req.user = user;
            next();
        }
    });
}

function getOne(req, res) {
    var user = req.user.toObject();

    delete user['facebookProvider'];
    delete user['__v'];

    res.json(user);
}

/**
 * Process postback for payloads
 */
function processPostback(event){
    var senderId = event.sender.id;
    var payload = event.postback.payload;

    if (payload === "GET_STARTED") {

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
        }, function(error, response, body){
            var greeting, name = "";
            if (error) {
                console.log("1391: " + "Error getting user's name: " + error);
            } else {
                var bodyObj = JSON.parse(body);
                name = bodyObj.first_name;
                greeting = "Hi " + name + ". ";
            }
            var message = greeting + "Welcome to StuckWanYah!, the app that lets you put your taste in your friends' hotness";
            sendMessage(senderId, { text: message });
        });
    } else if (payload === "Block Me") {
        processBlock(senderId);
        sendMessage(senderId, { text: "Your photos has been blocked. You will not be able to be voted or vote." });
    } else if (payload === "Unblock Me") {
        processUnblock(senderId);
        sendMessage(senderId, { text: "Your photos has been restored and you can be able to be voted or vote" });
    }
}

/**
 * Process message from user for any matching keyword and perform actions
 */
function processMessage(event){
    if (!event.message.is_echo) {
        var message = event.message;
        var senderId = event.sender.id;

        console.log("1417: " + "Received message from senderId: " + senderId);
        console.log("1418: " + "Message is: " + JSON.stringify(message));

        // You may get a text or attachment but not both
        if (message.text) {
            var formattedMsg = message.text.toLowerCase().trim();

            // If we receive a text message, check to see if it matches any special
            // keywords and send back the corresponding movie detail.
            // Otherwise, search for the new movie.
            switch (formattedMsg) {
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
 * Sends message to user
 */
function sendMessage(recipientId, message){
    request({
        url: "https://graph.facebook.com/v.2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
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
}

function findMovie(userId, movieTitle){
    var message;
    request("http://www.omdbapi.com/?type=movie&amp;t=" + movieTitle, function(error, response, body){
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
                Movie.findOneAndUpdate(query, update, options, function(error, movie){
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
    Photos.findById({ image_id: id}, function(err, photo){
        if (err) throw err;
        return photo;
    });
}


/**
 * Process blocking and unblocking user/photo
 */
function processBlock(userId){
    var query = { image_id: userId };
    var attempts = 0;
    Photos.findOne(query, function(err, user){
        if (err){
            attempts++;
            if (attempts > 2)
            //sendMessage(userId, {text: "Sorry it's my fault. Try again later."});
                attempts=0;
            //sendMessage(userId, {text: "Something went wrong. Try again"});
        } else {
            user.is_blocked = true;
            user.save(function(err, response){
                if (err) { throw err }
                //sendMessage(userId, {text: "Your photo has been blocked. You will not be able to be voted nor vote again in the future."})
            });
        }
    });
    return true;
}

function processUnblock(userId){
    var query = { image_id: userId };
    Photos.findOne(query, function(err, photo){
        if (!photo) {
            console.log('no photo found');
            //sendMessage(userId, {text: "Something went wrong. Try again"});
        } else {
            unblockPhoto(photo.id);
            //sendMessage(userId, {text: "Your photo has been unblocked. You can now vote for your friends hotness."});
        }
    })
}

function blockPhoto(id){
    Photos.update({ "image_id": id},
        { $set: {'is_blocked': true} }, function(err){
            if(err) throw err;
            return true;
        }
    );
}

function unblockPhoto(id){
    Photos.update({ "image_id": id},
        { $set: { 'is_blocked': false } }, function(err){
            if (!err) return 1;
        }
    );
}

/**
 * User/Sender/Voter -> is the person doing the voting
 * Candidate -> is the person being voted for his/her hotness
 * Candidate/s is/are the sender's friend/s within the 13-21 age group
 **/
// Retrieve all female friends from age 14 - 23 

/**
 * Girls rating girls, boys rating boys not really a exciting thing
 * Get voter's gender so
 * if user is a female she rates her friends that are boys
 * if user is a male he rates his friends that are girls
 */
function processVoterSex(user_id){
    //var user_id = typeof event === ? user_id : event.user.id;
    request({
        url: `https://graph.facebook.com/v2.6/me/${user_id}`,
        qs: {
            access_token: GLOBAL.page_access_token,
            fields: "gender"
        },
        method: "GET"
    }, function(error, response, body){
        if (error) {
            console.log('1753: ' + "Error getting user gender: " + error);
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
        // and redirect to respective functin
        request({
            url: "https://graph.facebook.com/v2.6/" + senderId + "/friendlists",
            qs: {
                access_token: process.env.PAGE_ACCESS_TOKEN,
                fields: "gender"
            },
            method: "GET"
        }, function(error, response, body){
            var greeting = "";
            if (error) {
                console.log('1783: ' + "Error getting user's gender: " + error);
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
// Process gender
function shimOrhim(gender){
    // return (typeof gender == 'female' ? 'female' : 'male');
    if (gender === "male")
        return gender = "female";
    else if (gender === "female")
        return gender = "male";
}
function getCurrentUserDetails(userId){
    Photos.findOne({ "image_id": userId }, function (err, user) {
        if (!user) {
            // create new user and inherite info from facebook
        }

        userGender = user.gender;
    });
}

var getContenderDetail = function(userId, field){
    Photos.findOne({image_id: userId}, function(err, movie){
        if (err) {
            sendMessage(userId, {text: "Something went wrong. Try again"});
        } else {
            sendMessage(userId, {text: movie[field]});
        }
    });
};

var retrievePlayerFriends = function(userId) {
    Photos.findOne({"image_id":userId}, function(error, player){
        if (error) {
            sendMessage(userId, {text: "Error retrieving your Facebook friends."});
        }
        if (!player) {

        }
    });
};

//createNewPlayer(require('./photos'));

/**
 * Retrieve current user's profile picture, friends list,
 * and basic info and save all to StuckWanYah database
 * @param data
 */
function createNewPlayer(data) {
    // create all of the dummy people
    async.each(data, function(profile, callback) {
        var update = [{
            // image_id is the facebook id
            image_id: profile.id,
            fullName: profile.displayName,
            age: profile.age,
            gender: profile.gender,
            image_url: profile.displayPicture,
            thumb_src: profile.thumSrc,
            uri: profile.uri,
            facebook_friends: profile.friends,
            // leave is_blocked false
            ratings: 1400
            // leave the rest to default
        }];

        Photos.create(update, callback);
    }, function(err) {
        if (err) {
            // handler error
            //throw err;
        }

        var q = Photos.find({age: {$lt: 1000}}).sort('age').lean();
        q.exec(function (err, results) {
            if (err) throw err;
            //console.log('Are the results MongooseDocuments?: %s', results[0] instanceof mongoose.Document);

            console.log(`created ${results.length} (+) new players`.cyan);
        });
    });
};

function dd() {
    var options = { upsert: true };
    var query = { user };

    Photos.findOneAndUpdate(query, update, options, function(err, results){
        if (err) throw err;
        //console.log('Are the results MongooseDocuments?: %s', results[0] instanceof mongoose.Document);

        console.log(`created ${results.length} (+), updated ${results.length} (~)`);
    });
}

function getFriends(fb_id){
    request.get({
        url:`https://graph.facebook.com/v2.6/${fb_id}/friends`,
        qs: {
            access_token: GLOBAL.page_access_token,
            fields:"id,name,picture.type(square).width(1000).height(1000)"
        }
    });

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
    var form_date = monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
    return form_date;
};

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
    }, function(error, response, body){
        if (err) {
            console.error(`Error posting article: ${response.error}`)
        }
    });
}
var getMediaOptions = function(event){
    var options = {
        method: "GET",
        uri: `https://graph.facebook.com/v2.8/${event.user.id}`, // req.params.id
        qs: {
            access_token: GLOBAL.page_access_token,
            type: 'user',
            fields: 'photos.limit(2).order(reverse_chronological){link, comments.limit(2).order(reverse_chronological)}'
        }
    };

    return request(options).then(function(fbRes){
        res.json(fbRes);
    })
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
}
// Process ranks for each contender against all contenders
function rankUser(){
    var len = this.length;
    var res = new Array(len);
    for (var i = 0; i < users.length; i++) {
        if (i in this) {
            users[i]
        }
    }
}

// TODO: Fixed: Fix synchronous AJAX request, use async method instead
// TODO: Fix: Fix Heroku issues
// TODO: Fix: Fix Facebook login
// TODO: Fix: Fix session
// TODO: Fix: Fix mongodb issues
// TODO: Fix: Checking each user if exist, check if one data can be updated i.e. if profile picture changed, update with new propic uri, create new user
// TODO: Fix: Fix rating algorithm
// TODO: Fix: