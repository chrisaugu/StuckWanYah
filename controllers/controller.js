'use strict';

var mongoose = require('mongoose'),
	async = require('async'),
	Booking = mongoose.model('SweetLips');

// GET
exports.battle = function(req, res, next) {

	async.waterfall([
		function(callback) {
			Booking.findRandom({}, {}, {limit: 1}, function (err, result) {
				callback(err, result);
			})
		},
		function(firstBooking, callback) {
			Booking.findRandom({"_id": {"$ne": firstBooking[0]._id}}, {}, {limit: 1}, function (err, result) {
				callback(null, [firstBooking[0], result[0]]);
			})
		}

	], function(err, result) {
		if (err) next(err);
		res.render('index',{
			booking0: result[0],
			booking1: result[1]
		});
	});
};

//UPDATE
exports.battled = function(req, res, next) {
	var winner = req.params.winner,
		loser = req.params.loser;

	if (!winner || !loser) {
		return res.status(400).send({ message: 'Voting requires two bookings.' });
	}

	if (winner === loser) {
		return res.status(400).send({ message: 'Cannot vote for and against the same booking.' });
	}

	async.parallel([
		function(callback) {
			Booking.findById( winner, function(err, winner) {
				callback(err, winner);
			});
		},
		function(callback) {
			Booking.findById( loser, function(err, loser) {
				callback(err, loser);
			});
		}
	], function(err, results) {
		if (err) return next(err);

		var winner = results[0],
			loser = results[1],
			rating;

		// compute new ratings
		rating = getRating(winner, loser);

		if (!winner || !loser) {
			return res.status(404).send({message: 'One of the bookings no longer exists.'});
		}

		async.parallel([
			function(callback) {
				winner.wins++;
				winner.rating = rating.winner;
				winner.save(function(err) {
					callback(err);
				});
			},
			function(callback) {
				loser.losses++;
				loser.rating = rating.loser;
				loser.save(function(err) {
					callback(err);
				});
			}
		], function(err) {
			if (err) next(err);
			res.redirect('/');
			//res.json({winner: winner, loser: loser});
		});

	});

};

exports.detail = function(req, res) {

	Booking.findById(req.params.id, function (err, booking) {
		if (err) next(err)
		res.render('detail', {
			booking: booking,
			templateClass: 'dark'
		});
	})
}

function getRating (winner, loser) {
	var k = 30,
		winnerExpected,
		loserExpected;

	winnerExpected = 1 / (1 + (Math.pow(10,(loser.rating - winner.rating) / 400)));
	loserExpected = 1 / (1 + (Math.pow(10,(winner.rating - loser.rating) / 400)));
	return {
		winner: Math.round(winner.rating + (k * (1 - winnerExpected))),
		loser: Math.round(loser.rating + (k * (0 - loserExpected)))
	};
};

exports.topTen = function(req, res, next) {
	Booking
		.find({})
		.sort({'rating': -1})
		.limit(10)
		.exec(function(err, result) {
			if (err) next(err);
			res.locals.topTen = result;
			next();
		});
};

exports.topHundred = function(req, res, next) {
	Booking
		.find({})
		.sort({'rating': -1})
		.limit(100)
		.exec(function(err, result) {
			if (err) next(err);
			res.render('top', {
				bookings: result
			});
		});
};

exports.bottomHundred = function(req, res, next) {
	Booking
		.find({})
		.sort({'rating': 1})
		.limit(100)
		.exec(function(err, result) {
			if (err) next(err);
			Booking.count(function(err, count){
				if (err) next(err)
				res.render('top', {
					bookings: result,
					count: count
				});
			})
		});
};