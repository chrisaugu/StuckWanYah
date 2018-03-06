// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
var restful = require("node-restful"),
	mongoose = require("mongoose"),
	random = require('mongoose-simple-random'),
	//random = require('mongoose-random'),
	Schema = mongoose.Schema;
// Schema
var SweetLipsSchema = new Schema({
	//_id: <ObjectId>,
	image_id: { type: String, unique: true, index: true },
	email: {type: String, require: true,
		trim: true, unique: true,
		match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
	},
	facebookProvider: {
		type: {
			id: String,
			token: String
		},
		selected: false
	},
	name: String,
	age: Number,
	gender: String,
	image_url: String,
	thumb_src: String,
	uri: String,
	is_blocked: { type: Boolean, default: false },
	wins: { type: Number, default: 0},
	losses: { type: Number, default: 0},
	draws: { type: Number, default: 0},
	score: { type: Number, default: 0},
	ratings: { type: Number, default: 1400},
	rankings: { type: Number, default: 0},
    // define the geospatial field
	random: { type: [Number], index: '2d' },
	voted: { type: Boolean, default: false },
	vote_by: [],
	challengers: [],
	draws_with: [],
	joinedAt: { type: Date, default: Date.now() },
},{strict:false});
// Attaching random plugin to the schema
SweetLipsSchema.plugin(random);
//SweetLipsSchema.plugin(random, { path: 'r' })

SweetLipsSchema.statics.upsertFbUser = function(accessToken, refreshToken, profile, callback){
	var that = this;
	return this.findOne({
		'facebookProvider.id': profile.id
	}, function(err, user){
		if (!user) {
			var newUser = new that({
				email: profile.emails[0].value,
				facebookProvider: {
					id: profile.id,
					token: accessToken
				}
			});

			newUser.save(function(error, savedUser){
				if (error) {
					console.log(error);
				};
				return callback(error, savedUser);
			});
		} else {
			return callback(err, user);
		};
	});
};

// define a method to find the closest person
SweetLipsSchema.methods.findClosest = function(callback) {
	return this.model('photos').find({
		loc: {$nearSphere: this.loc},
		name: {$ne: this.name}
	}).limit(1).exec(callback);
};

var photos = restful.model("photos", SweetLipsSchema);

var hits = restful.model("hits", new Schema({
	page: String,
	hits: Number,
	date: {type: Date, default: Date.now()}
}));

var battles = restful.model("battles", new Schema({
	battle_id: { type: Number, unique: true, index: true },
	winner: Number,
	loser: Number
}));

// Make the photos and hits data sets available to the code 
module.exports = {
	photos: photos,
	battles: battles,
	hits: hits
}