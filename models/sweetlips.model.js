// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
var restful = require("node-restful"),
	mongoose = require("mongoose"),
	random = require('mongoose-simple-random'),
	Schema = mongoose.Schema;
// Schema
var SweetLipsSchema = new Schema({
	//_id: <ObjectId>,
	image_id: { type: String, unique: true, index: true },
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
	random: { type: [Number], index: '2d' },
	voted: { type: Boolean, default: false },
	vote_by: [],
	challengers: [],
	//draws_with: [],
	joinedAt: { type: Date, default: Date.now() },
},{strict:false});
// Attaching random plugin to the schema
SweetLipsSchema.plugin(random);

var photos = restful.model("photos", SweetLipsSchema);

var hits = restful.model("hits", new Schema({
	page: String,
	hits: Number,
	date: {type: Date, default: Date.now()}
}));

// Make the photos and hits data sets available to the code 
module.exports = {
	photos: photos,
	hits: hits
}