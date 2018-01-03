
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var sweetlipsdb = new Schema({
	cuid: {type: Number,required: true},
	name:String,
	image_url: {type: Buffer, required: true},
	hotness_counts: Number,
	hotness_rank: Number,
	surfaced: Number
});

const Sweetlips = module.exports = mongoose.model("SweetLips", sweetlipsdb);