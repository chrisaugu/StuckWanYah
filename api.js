var express = require("express");
var router = express.Router();

module.exports = {
	getTwoRandomImages: function() {
		router.get("https://stuckwanyah.herokuapp.com/api/photos");
	},
	getPhotoById: function(id) {
		router.get("https://stuckwanyah.herokuapp.com/photos/" + id );
	},
	getRankings: function() {
		router.get("https://stuckwanyah.herokuapp.com/api/photos/top");
	}
}