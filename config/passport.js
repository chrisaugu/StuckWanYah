// load all the things we need
//var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// load up the user model
var User = require('../app/models/user');

// load the auth variables
var configAuth = require('../config');

module.exports = function(passport) {

	// used to serialize the user for ther session
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// code for login (use('local-login', new LocalStrategy))
	// code for signup (use('local-signup', new LocalStrategy))

	// ==================== //
	// ===== FACEBOOK ===== //
	// ==================== //
	passport.use(new FacebookStrategy({
			// pull in my app id and secret from config file
			clientID: configAuth.facebook.clientID,
			clientSecret: configAuth.facebook.clientSecret,
			callbackURL: configAuth.facebook.callbackURL
		},
		// facebook will send back the token and profile
		function(token, refreshToken, profile, done) {

			// asynchronouse
			process.nextTick(function() {

				//find the user in the database on their facebook id
				User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

					// if there is an error, stop everything and return that
					// ie an error connecting to the database
					if (err) {
						return done(err);
					}

					// if the user is found, then log them in
					if (user) {
						return done(null, user);
					} else {
						// if there is no user found with that facebook id, create them
						var newUser = new User();

						// set all the facebook information in our user model
						newUser.facebook.id = profile.id;
						newUser.facebook.token = token;
						newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
						newUser.facebook.email = profile.emails[0].value;

						// save our user to the database
						newUser.save(function(err) {
							if (err) {
								throw err;
							}

							// if successful, return the new user
							return done(null, newUser);
						});
					}
				});
			});
		}));

};
