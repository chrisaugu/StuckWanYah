// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
var path = require("path")
    , favicon = require('serve-favicon')
    , logger = require('morgan')
    , restful = require('node-restful')
    , mongoose = require("mongoose")
    , Promise = require('promise')
    , colors = require('colors/safe')
    , express = require("express")
    , cookieParser = require('cookie-parser')
    , bodyParser = require("body-parser")
    , request = require("request")
    , async = require("async")
    //, xml2js = require("xml2js")
    //, lwip = require('lwip')
    //, cors = require('cors'),
    , fs = require('fs')
    , _ = require('underscore')
    , moment = require("moment")
    , jwt = require('jwt-simple')
    , FB = require('fb')
    , GLOBAL = require("./config");

// Creating instance for express
var app = module.exports = express();
// configure the instance
app.set('port', (process.env.PORT || 5000));
// Tell express where it can find the templates
app.set('views', path.join(__dirname + '/views'));
//Set ejs as the default template
app.set('view engine', 'ejs');
// Make the files in the public/ folder avilable to the world
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
// Parse POST request data. It will be available in the req.body object
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
// enable cors
/*var corsOption = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['x-auth-token']
};
app.use(cors(corsOption));*/
// Invoke instance to listen to port
// Create new server
app.listen(app.get('port'), function(){
    console.log("Server running on port %d", app.get('port'));
});

// Creating an instance for MongoDB
var db = mongoose.connect(GLOBAL.db);
mongoose.connection.on("open", function(){
    console.log("Connected: Successfully connect to mongo server");
});
mongoose.connection.on('error', function(){
    console.log("Error: Could not connect to MongoDB. Did you forget to run 'mongod'?");
});
//mongoose.Promise = global.Promise;

// Invoke model
var Sweetlips = require("./models/sweetlips.model");
// Register photos model
Sweetlips.photos
    .methods(['get', 'put','post', 'delete'])
    .register(app, '/api/v1/photos/all');
// Register hits model
Sweetlips.hits
    .methods(['get', 'put','post', 'delete'])
    .register(app, '/api/v1/hits');

var sourceDirectory = "public/photos/";

// Install images on startup
// installImages();

var options = FB.options({
    appId		: GLOBAL.fb_app_id, // 'YOUR-APP-ID-HERE'
    appSecret	: GLOBAL.fb_app_secret,
    status		: false, // the SDK will attempt to get info about the current user immediately after init
    cookie		: false,  // enable cookies to allow the server to access
    // the session
    xfbml		: false,  // With xfbml set to true, the SDK will parse your page's DOM to find and initialize any social plugins that have been added using XFBML
    version		: 'v2.8' // use graph api version 2.5
});
var fb = new FB.Facebook(options);
FB.setAccessToken('access_token'); // process.env.PAGE_ACCESS_TOKEN
var accessToken = FB.getAccessToken();

var userGender = "male";
var gender = shimOrhim(userGender);

// Controller
// Server index page
app.get("/", function (req, res, next){
    renderIndexPage({
        params: req,
        success: function(obj){
            res.render("index", obj);
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
 * RESTful API Endpoints
 */
// Facebook Webhook
// Used for verification
app.route("/api/v1/auth/facebook/webhook")
    .get(function(req, res){
        if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
            console.log("Verified webhook");
            res.status(200).send(req.query["hub.challenge"]);
        } else {
            console.error("Verification failed. The tokens do not match.");
            res.sendStatus(403);
        }
    });

// All callbacks for Messenger will be Posted here
app.route("/api/v1/auth/facebook/webhook")
    .post(function (req, res){
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

app.route('/api/v1/auth/me')
    //.get(authenticate, getCurrentUser, getOne);

/**
 * GET /api/v1/photos
 * Returns 2 random photos of the same gender that have not been voted yet.
 */
app.route("/api/v1/photos")
    .get(function(req, res, next){
        var choices = ['female', 'male'];
        var randomGender = _.sample(choices);

        Sweetlips.photos.find({
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

            Sweetlips.photos.find({
                random: {
                    $ne: [Math.random(), 0]
                }
            }).where("voted", false).where("gender", oppositeGender).limit(2).exec(function(err, photos){
                if (err)
                    return next(err);

                if (photos.length === 2)
                    return res.send(photos);

                Sweetlips.photos.update({}, {
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
app.route('/api/v1/photos')
    .post(function(req, res, next){
        var query = req.body;
        Sweetlips.photos.create(query, function(err, photos){
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
app.route('/api/v1/photos').post(function(req, res, next){
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
                        Sweetlips.photos.findOne({ characterId: characterId }, function(err, character){
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
app.route('/api/v1/photos')
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
                    Sweetlips.photos.findOne({
                        image_id: winner
                    }, function(err, winner){
                        callback(err, winner);
                    });
                },
                function(callback){
                    Sweetlips.photos.findOne({
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
                    if (err)
                        return next(err);
                    res.status(200).end();
                });
            });
    });

/**
 * GET /api/v1/photos/top
 * Return 100 highest ranked photos. Filter by gender
 * GET /api/v1/photos/top?race=caldari&bloodline=civire&gender=male
 * go along with /rankings.html
 */
app.route('/api/v1/photos/top')
    .get(function(req, res, next){
        console.log(req.query);

        top10HottestFriends({
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
 * GET /api/v1/stats
 * Display Database statistics
 */
app.route('/api/v1/stats')
    .get(function(req, res, next){
        async.parallel([
                function(callback){
                    // GET /api/v1/photos/count
                    // Returns the total # of photos in the Database
                    // total photos
                    Sweetlips.photos.count({}, function(err, count){
                        callback(err, count);
                    });
                },
                function(callback){
                    // total females
                    Sweetlips.photos.count({gender: "female"}, function(err, femaleCount){
                        callback(err, femaleCount);
                    });
                },
                function(callback){
                    // total males
                    Sweetlips.photos.count({"gender":"male"}, function(err, maleCount){
                        callback(err, maleCount);
                    });
                },
                function(callback){
                    // total votes cast
                    Sweetlips.photos.aggregate(
                        { $group: { _id: null, total: { $sum: '$wins' } } },
                        function(err, winsCount){
                            callback(err, winsCount[0].total);
                        }
                    )
                },
                function(callback){
                    // total page hits
                    Sweetlips.hits.aggregate(
                        { $group: {_id: null, total: { $sum: '$hits' } } },
                        function(err, pageHits){
                            var pageHits = pageHits.length ? pageHits[0].total : 0;
                            callback(err, pageHits);
                        }
                    )
                },
                function(callback){
                    // total blocked photos
                    Sweetlips.photos.count({'is_blocked':true}, function(err, blocked){
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
                    totalCount: totalCount,
                    femaleCount: femaleCount,
                    maleCount: maleCount,
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
app.route("/api/v1/submit")
    .post(function(req, res, next){
        res.status(200).send("Sent successfully");
        res.redirect("/submit.html");

        /*return new Promise(function(resolve, reject){
            return request.post({
                url: `https://graph.facebook.com/v2.6/${GLOBAL.fb_page_id}/messages`,
                qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
                method: "POST",
                json: {
                    recipient: { id: process.env.PAGE_ID},
                    sender: req.body.name,
                    message: req.body.message
                }
            }).then(function(error, response, body){
                res.status(200).send({ message: "Message sent successfully to StuckWanYah Facebook page" });
                resolve(true);
            }).catch(function (error) {
                console.log("Error sending direct message to StuckWanYah Facebook page.");
                res.status(404).send({ message: "Error sending direct message to StuckWanYah Facebook page." });
                reject(false);
            })
        });*/
    });

/**
 * PUT /api/v1/hits
 * Update site hits
 */
app.route("/api/v1/hits")
    .put(function(req, res, next){
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

/*
 * POST /api/v1/connect/facebook/
 * Login with facebook in order to use voter's pictures, friends list
 */
app.get('/api/v1/facebook/login',
    //passport.authenticate('facebook', {
    //	scope: ['publish_actions', 'manage_pages', 'user_photos']
    //});
);

/*
 * POST /api/v1/connect/facebook/
 * Logout with facebook
 */
app.get("/api/v1/auth/facebook/logout",
    //passport.authenticate('facebook', {
        // log user out
    //});
);

app.route("/api/v1/auth/facebook/connect")
    .get(function(req, res, next) {
        const { queryTerm, searchType } = req.body;

        FB.getLoginUrl({
            scope: 'email, user_likes, user_photos, publish_actions, gender',
            redirect_uri: 'https://stuckwanyah.herokuapp.com/'
        });

        var friends = getFriends();

        res.send(`Error: ${friends}`);
    });

/*app.route('/auth/facebook')
    .post(passport.authenticate('facebook-token', {session: false}), function(req, res, next){
        if (!req.user) {
            return res.send(401, 'User Not Authenticated');
        };
        // prepare token for API
        req.auth = {
            id: req.user.id
        };

        next();
}, generateToken, sendToken);*/

var getCurrentUser = function(req, res, next){
    Sweetlips.photos.findById(req.auth.id, function(err, user){
        if (err) {
            next(err);
        } else {
            req.user = user;
            next();
        }
    });
};

var getOne = function (req, res) {
    var user = req.user.toObject();

    delete user['facebookProvider'];
    delete user['__v'];

    res.json(user);
};

var getFriends = function(){
    FB.api('me/friends?limit=50', function(res){
        console.log("Friends: " + res.id);
    });
};

/*
FB.api('4', { fields: ['id', 'name'] }, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log(res.id);
    console.log(res.name);
});

var body = 'My first post using facebook-node-sdk';
FB.api('me/feed', 'post', { message: body }, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log('Post Id: ' + res.id);
});

FB.api('me/photos', 'post', {
    source: fs.createReadStream('my-vacation.jpg'),
    caption: 'My vacation'
}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log('Post Id: ' + res.post_id);
});

FB.api('me/photos', 'post', {
    source: {
        value: photoBuffer, options: {
            contentType: 'image/jpeg'
        }
    }, caption: 'My vacation'
}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log('Post Id: ' + res.post_id);
});

var postId = '1234567890';
FB.api(postId, 'delete', function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log('Post was deleted');
});

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
});
*/
/*
// $facebook->api("/{$user_id}/friends?fields=id,name,gender");
// /fql?q=select uid, name, sex from user where uid in(select uid2 from friend where uid1 = me()) and sex = "female"
// /{user-id}/photos?type=uploaded

FB.api('/fql',
    'GET',
    {"q":"select uid, name, sex from user where uid in(select uid2 from friend where uid1 = me()) and sex = female "},
    function(response){
        // Insert your code here
    }
);

/* make the API call /
FB.api(
    "/{friend-list-id/}",// /{user-id}/friendlists
    function (response){
      if (response && !response.error) {
        /* handle the result /
      }
    }
);
FB.api('/me/friends', {fields: 'name,id,location,birthday'}, function(response{
  //...
});
*/


app.route("/api/v1/photos/instance")
    .post(function(req, res, next){
        User.findOne({ instagramId: body.user.id }, function(err, existingUser){
            if (existingUser) {
                var token = createToken(existingUser);
                return res.send({ token: token, user: existingUser });
            };
            
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

    Sweetlips.photos
        //.findRandom(filter, fields, options)
        .find({ random: { $ne: [Math.random(), Math.random()] } })
        .where("voted", false)
        .where("is_blocked", false)
        .where("gender", gender) //randomGender)
        .limit(2)
        .exec()
        .then(function(photos){
            // Assign all 2 random pictures to randomPictures
            if (photos.length === 2) {
                randomImages = photos;
            }

            //if (photos[0].image_id === photos[1].image_id) {}

            var oppositeGender = _.first(_.without(choices, randomGender));

            Sweetlips.photos
                //.findRandom({ gender: gender, voted: false, is_blocked: false }, {}, { limit: 2 })
                .find({ random: { $ne: [Math.random(), Math.random()] } })
                .where("gender", gender) //randomGender)
                .where("voted", false)
                .limit(2)
                .exec()
                .then(function(photos){
                    if (photos.length === 2) {
                        randomImages = photos;
                    }
                    // When there no more photo pairs left of either gender
                    // reset the flags, and start the vote again
                    else if (photos.length < 2) {
                        Sweetlips.photos.update({}, {
                                $set: {"voted": false } }, {multi: true}, function(err){
                                if (err) config.error.call(this, err);
                            }
                        );
                    }
                })
                .catch(function(err){
                    config.error.call(err);
                })

        })
        .then(function(topRatings){
            config.success.call(this, {
                images: randomImages,
                expected: expectedScore,
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
                    Sweetlips.photos.findOne({ image_id: winnerID }, function(err, winner){
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

                var winner = results[0],
                    loser = results[1],
                    rating, score, voter;

                // getting the current user id from facebook graph
                voter = {
                    id: '1234',
                    name: 'kitten'
                };

                voter = getCurrentUser;

                //rating = getRating(winner, loser);
                score = getScore(winner, loser);

                console.log(performanceRating(winner, loser));

                var expected_score = expectedScore(winner.ratings, loser.ratings);
                var new_winner_rating = newRating(expected_score, score.winner, winner.ratings);
                var new_loser_rating = newRating(expected_score, score.loser, loser.ratings);

                async.parallel({
                        winner: function(callback){
                            winner.wins++;
                            winner.score = score.winner;
                            winner.ratings = new_winner_rating;// rating.winner;
                            winner.voted = true;
                            winner.random = [Math.random(), Math.random()];
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
                            loser.random = [Math.random(), Math.random()];
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
                Sweetlips.photos.findOne({ image_id: player_1 }, function(err, player1){
                    callback(err, player1);
                });
            },
            function(callback){
                Sweetlips.photos.findOne({ image_id: player_2 }, function(err, player2){
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

// ELO Rating System Implementation
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
// Returns the top 10 highest ratings
function topTenRatings(config){
    Sweetlips.photos.find().sort({
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

    console.log(config.params.query.field);
    var query_field = config.params.query.field;
    var query_gender = config.params.query.gender;

    Sweetlips.photos
        .find()
        .sort('-ratings') //.sort('-1')
        .where({'gender': gender})//.where({'gender': query_gender})
        .limit(10)
        //.select(query_field)
        .exec(function(err, ranks){
            if (err) console.error(err);

            var rankCount = _.countBy(ranks, function(rank) { return rank});
            var max = _.max(rankCount, function(rank) { return rank });
            var inverted = _.invert(rankCount);
            var topRank = inverted[max];
            var topCount = rankCount[topRank];

            //console.log({ rank: topRank, count: topCount });

            if (err) {config.error.call(this, err);}
            config.success.call(this, ranks);
        });

    /*Sweetlips.photos.find({
        gender: "female",
        $or: [ { loves:'apple' }, { weight:{ $lt: 500 } } ]
    }, function(err, rankings{
        //if (err) config.error.call(this, err);
        //config.success.call(this, rankings);
        if (err) console.log(err);
        console.log(rankings);
    });

    Sweetlips.photos.aggregate([
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

    Sweetlips.photos
        .find(conditions)
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
    Sweetlips.hits.update({page: config.params.body.page},
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
            Sweetlips.photos.insert({
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
                console.log("Photos uploaded successfully");
            });
        }
    });
}
app.get("/api/v1/photos/local", function(req, res, next){
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
        console.log(err);
    //console.log(files);

    files.forEach(function(file){
        scaleImage(file);
    });

});

function scaleImage(file){
    /*
        lwip.open(sourceDirectory + file, function(err, image){
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
                    .writeFile(destinationDirectory + file, function(err){
                        if (err) console.log(err);
                        console.log(file + ": has been processed");
                    });
            } else {
                console.log('couldn\'t find no photo');
            }
        });
    */
}
/*function createToken(user){
  var payload = {
    exp: moment().add(14, 'days').unix(),
    iat: moment().unix(),
    sub: user._id
  };

  return jwt.encode(payload, GLOBAL.page_access_token);
}*/

function createToken(auth){
    return jwt.sign({
        id: auth.id
    }, 'my-secret', {
        expiresIn: 60 * 120
    });
}
var generateToken = function(req, res, next){
    req.token = createToken(req.auth);
    next();
};

var sendToken = function(req, res){
    res.setHeader('x-auth-token', req.token);
    res.status(200).send(req.auth);
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
/*function isAuthenticated(req, res, next){
    if (!(req.headers &amp; &amp; amp;&amp;amp; req.headers.authorization)) {
        return res.status(400).send({ message: 'You did not provide a JSON Web Token in the Authorization header.' });
    }

    var header = req.headers.authorization.split(' ');
    var token = header[1];
    var payload = jwt.decode(token, GLOBAL.fb_app_secret);
    var now = moment().unix();
    if (now &amp;gt; payload.exp) {
        return res.status(401).send({ message: 'Token has expired.' });
    }

    User.findById(payload.sub, function(err, user){
        if (!user) {
            return res.status(400).send({ message: 'User no longer exists.' });
        }

        req.user = user;
        next();
    })
}*/

function isMatch(){
    // return
}
function LoggedIn(req, res, next){
    !req.session.id ? res.redirect('/api/v1/auth/login') : next()
}
function NotLoggedIn(req, res, next){
    req.session.id ? res.redirect('/') : next()
}
var isLoggedIn = function(req, res, next){
    return req.session.id ? true : false;
};

/**
 * Process postback for payloads
 */
function processPostback(event){
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
        }, function(error, response, body){
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
function processMessage(event){
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
function processBlock(userId){
    var query = { image_id: userId };
    var attempts = 0;
    Sweetlips.photos.findOne({ image_id: userId}, function(err, user){
        if (err){
            attempts++;
            if (attempts > 2)
                sendMessage(userId, {text: "Sorry it's my fault. Try again later."});
            attempts=0;
            sendMessage(userId, {text: "Something went wrong. Try again"});
        } else {
            user.is_blocked = true;
            user.save(function(err, response){
                if (err) { throw err }
                sendMessage(userId, {text: "Your photo has been blocked. You will not be able to be voted nor vote again in the future."})
            });
        }
    });
    return true;
}
function processUnblock(userId){
    var query = {image_id: userId};
    Sweetlips.findOne(query, function(err, response){
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
function sendMessage(recipientId, message){
    request({
        url: "https://graph.facebook.com/v.2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body){
        if (error) {
            console.log("Error sending message: " + response.error);
        }
    });
}

var getContenderDetail = function(userId, field){
    Movie.findOne({image_id: userId}, function(err, movie){
        if (err) {
            sendMessage(userId, {text: "Something went wrong. Try again"});
        } else {
            sendMessage(userId, {text: movie[field]});
        }
    });
};

// Retrieve all friends from facebook
// and save them in database
var retrievePlayerFriends = function(userId){
    request({
        url:"https://graph.facebook.com/v.2.6/me/friends",
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN,
            //fields: ""
        },
        method: "GET"
    }, function(error, player){
        if (error) {
            sendMessage(userId, {text: "Error retrieving your Facebook friends."});
        }
        var query = { image_id: userId };
        var update = {
            image_id: player.cuid,
            name: player.name,
            age: player.age,
            gender: player.gender,
            image_url: player.thumSrc,
            uri: player.uri,
            //is_blocked: false,
            ratings: 1400,
            wins: 0,
            losses: 0,
            score: 0,
            random: [Math.random(), 0],
            voted: false,
            vote_by: [],
            joinedAt: Date.now(),
        };
        var options = { upsert: true };
        Sweetlips.photos.findOneAndUpdate(query, update, options, function(err, friend){
            if (err) {
                console.error("Database error: " + err);
            } else {
                console.log("Successfully retrieve friends from Facebook.")
            }
        })
    })
};

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
    Sweetlips.photos.findById({ image_id: id}, function(err, photo){
        if (err) throw err;
        return photo;
    });
}
function blockPhotoById(id){
    Sweetlips.photos.update({ image_id: id },
        { $set: {'$is_blocked': true} }, function(err){
            if(err) throw err;
            return true;
        }
    );
}
function unblockPhotoById(id){
    Sweetlips.photos.update({ image_id: id },
        { $set: { '$is_blocked': false } }, function(err){
            if (err) throw err;
            else if (!err) return 1;
        });
}
/**
 * User/Sender/Voter -> is the person doing the voting
 * Candidate -> is the person being voted for his/her hotness
 * Candidate/s is/are the sender's friend/s within the 13-21 age group
 **/

// Retrieve all female friends from age 14 - 23 
function processContenderSex(event){
    var senderId = event.sender.id;
    request({
        url: "https://graph.facebook.com/v2.6/" + senderId + "/friends?gender=female&sex=female",
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN,
            fields: "gender || sex"
        },
        method: "GET"
    }, function(error, response, body){

    });
}

// Girls rating girls, boys rating boys not really a exciting thing
// Get voter's gender so 
// if user is a female she rates her friends that are boys
// if user is a male he rates his friends that are girls
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
function getSenderGender(userId){
    request({
        url: `https://graph.facebook.com/v2.6/${userId}`,
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN,
            fields: "gender"
        },
        method: "POST"
    }, function(error, response, body){
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
// Process gender
function shimOrhim(gender){
    // return (gender === 'female' ? 'female' : 'male');
    if (gender === "male")
        return gender = "female";
    else if (gender === "female")
        return gender = "male";
}
function processGender(gender){
    return (gender == 'female' ? 'female' : 'male');
}
function getUserDetails(event){
    //var senderId = event.sender.id;

    async.waterfall([
        function(callback){
            callback(null, 'one', 'two');
        },
        function(arg1, arg2, callback){
            // arg1 now equals 'one' and arg2 now equals 'two'
            callback(null, 'three');
        },
        function(arg1, callback){
            // arg1 now equals 'three'
            callback(null, 'done');
        }
    ], function (err, results){
        if (err) console.error(err);
        console.log(results);// result now equals 'done'
    });

    /*request({
        url: `https://graph.facebook.com/v2.6/${senderId}`,
        fields: "",
        method: "GET"
    }, function(error, response, body){
        var name, gender, age, image_url, friends
    })*/

}

function saveUserPhoto(data) {
    // create all of the dummy people
    async.each(data, function(item, callback) {
        Sweetlips.photos.create(item, callback);
    }, function(err) {
        if (err) {
        // handler error
        }
    })
}

function getFriends(event){
    var user_id = event.user.id;
    request({
        url:`https://graph.facebook.com/v2.8/${user_id}/friends?fields=id,name,gender`
    });

    /*
    me?fields=id,name,friendlists.limit(2){id,name},age_range
    https://developers.facebook.com/tools/explorer/145634995501895?method=GET&path=me%3Ffields%3Did%2Cname%2Cfriendlists&version=v2.12

me?fields=friendlists.limit(2){id,name},age_range,id,name,profile_pic,gender,friends{age_range,name,link,profile_pic},link
    */
}
function processCandidateProfilePicture(event){
    //request({
    //	url: "https://graph.facebook.com/v2.6/" + senderId + "/friends/pictures"
    //})
}
/*
https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/p32x32/25299066_1427075520736791_7895762141614959026_n.jpg?oh=7059898388703004036bbc566659f38a&oe=5A8B3CA6
https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/c0.0.32.32/p32x32/25395848_328134744329406_8742747643512503740_n.jpg?oh=27936e7f8acd73b3c471dabc5d16cd26&oe=5AB7B45A
https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/p200x200/25398952_508400639544802_1868320785980351014_n.png?oh=44580410770e140865a10d5866c2272a&oe=5AB72B4B
*/
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
function get_friends(fb_id){
    resquest.get({
        url:`https://graph.facebook.com/v2.6/${fb_id}/friends`,
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN,
            fields:"id,name,picture.type(square).width(1000).height(1000)"
        }
    });

}
var getCurrentUser = function(){
    return request({
        method: "GET",
        url: "https://graph.facebook.com/v2.8/me",
        qs: {
            access_token: GLOBAL.user_access_token,
            type: 'user',
            fields: 'id,name,gender'
        }
    });
};
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
var postingImage = function(){
    const id = 'page or user id goes here';
    const access_token = 'for page if posting to a page, for user if posting to a user\'s feed';

    const postImageOptions = {
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
function dummy(text, callback) {
    callback(text);
}

function userService(){

    function fbLogin(){
        return new Promise(function(resolve, reject){
            FB.login(function(result){
                if (result.authResponse) {
                    return $.post('http://localhost:5000/api/v1/auth/facebook', {access_token: result.authResponse.accessToken})
                        .toPromise()
                        .then(function(response){
                            var token = response.headers.get('x-auth-token');
							if (token) {
								localStorage.setItem('id_token', token);
							}
							resolve(response.json());
						})
						.catch(function(){
							reject();
						})
				} else {
					reject();
				}
			}, {scope: 'public_profile,email'})
		});
    }
    function logout(){
        localStorage.removeItem('id_token');
    }

    function isLoggedIn(){
		return new Promise(function(resolve, reject){
			this.getCurrentUser().then(function(user){
				resolve(true)
			}).catch(function(){
					reject(false);
			});
		})
	}

    function getCurrentUser() {
        return new Promise(function(resolve, reject){
            $.get('http://localhost:5000/api/v1/auth/me').toPromise().then(function(response){
                resolve(response.json());
            })
        })
    }
}

function canActivate(){
    return this.checkLogin();
}

function checkLogin(){
    return new Promise(function(resolve, reject){
        this.userService().isLoggedIn().then(function(){
            resolve(true);
        }).catch(function(){
            this.route.navigate(['/welcome']);
            reject(false);
        })
    });
}