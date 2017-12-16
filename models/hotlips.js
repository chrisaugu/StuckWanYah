
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var hotlips = new Schema({
	user_id: String,
	hotness_counts: Number,
	rank: Number
});

module.exports = mongoose.model("Hotlips", hotlips);