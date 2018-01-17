
'use strict';

var restful = require("node-restful"),
	mongoose = restful.mongoose,
	//mongoose = require("mongoose"),
	//random = require('mongoose-simple-random'),
	Schema = mongoose.Schema;

var SweetLipsSchema = new Schema({
	//_id: <ObjectId>,
	image_id: { type: String, unique: true, index: true },
	name: String,
	age: Number,
	gender: String,
	filename: String,
	image_url: String,
	thumb_src: String,
	uri: String,
	is_blocked: { type: Boolean, default: false },
	ratings: { type: Number, default: 0},
	wins: { type: Number, default: 0},
	losses: { type: Number, default: 0},
	expectations: { type: Number, default: 0 },
	scores: { type: Number },
	random: { type: [Number], index: '2d' },
	voted: { type: Boolean, default: false },
	vote_counts: { type: Number, default: 0 },
	vote_timestamp: { type: Date, default: Date.now() },
	ranking: { type: Number, default: 0 },
	base_rating: { type: Number, default: 1400 }
},{strict:false});

//SweetLipsSchema.plugin(random);

module.exports.photos = restful.model("Photos", SweetLipsSchema);

module.exports.page_hits = restful.model("PageHits", new Schema({
	page_id: {type: Number, unique: true},
	page_name: String,
	page_hits: Number,
	date: {type: Date, default: Date.now()}
}));