// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
var restful = require('node-restful');
var mongoose = require('mongoose');
var random = require('mongoose-simple-random');
var Schema = mongoose.Schema;
//var ObjectId = Schema.Types.ObjectId; 
var ObjectId = mongoose.Types.ObjectId;

// Schema
var SweetLipsSchema = new Schema({
    id: String,
    imageId: {type: String, unique: true, index: true},
    fullName: String,
    firstname: String,
    lastname: String,
    age: Number,
    gender: String,
    picture: String,
    profileUrl: String,
    friends: [{
        type: Schema.ObjectId,
        ref: 'photos',
        unique: true
    }],
    facebookHandle: {
        id: String,
        instantGameId: String,
        pageId: String,
        friends: [],
        selected: false
    },
    instagramHandle: {
        type: {
            id: String
        },
        followers: [{type: 'ObjectId', ref: 'photos'}],
        selected: false
    },
    is_blocked: {type: Boolean, default: false},
    wins: {type: Number, default: 0},
    losses: {type: Number, default:0},
    draws: {type: Number, default: 0},
    score: {type: Number, default: 0},
    ratings: {type: Number, default: 1400},
    // define the hgeospatial field
    random: {type: [Number], index: '2d'},
    voted: {type: Boolean, default: false},
    voted_by: [],
    challengers: [],
    joinedAt: {type: Date, default: Date.now()},
}, {strict: false});

// Attaching random plugin to the schema
SweetLipsSchema.plugin(random);

var Photos = restful.model('photos', SweetLipsSchema);

SweetLipsSchema.statics.findOrCreate = function (id, options, callback) {
    Photos.find({
        gender: 'female',
        $or: [{loves: 'apple'}, {weight: {$lt: 500}}]
    }, function (err, user) {
    });
};

SweetLipsSchema.statics.upsertFbUser = function (accessToken, refreshToken, profile, callback) {
    const $this = this;
    return Photos.findOne({'facebookHandle.id': profile.id}).then((player) => {
        if (player) {
            return callback(null, player);
        } else {
            // if no player, create new player from Facebook
            var newPlayer = new $this({
                // imageId is the facebook id
                imageId: profile.id,
                displayName: profile.displayName,
                age: new Date().getFullYear() - profile.birthday,
                gender: profile.gender,
                picture: profile.picture,
                image_url: profile.picture, // profile.picture.data.url
                link: profile.profileUrl,
                facebookHandle: {
                    id: profile.id,
                    token: accessToken,
                    friends: [
                        profile.friends.id
                    ]
                }
                // leave is_blocked false
                //ratings: profile.friends.length // 1400 set base ratings according to the number of friends user has
                // leave the rest to default

            });
            newPlayer.save().then((newPlayer) => {
                return callback(null, newPlayer);
            }).catch ((error) => {
                return callback(error);
                console.log(error);
            });
        }
    });
};

SweetLipsSchema.statics.findImageById = function (id, callback) {
    return Photos.findOne({
        'imageId': id
    }).exec(callback);
};

SweetLipsSchema.statics.findOneAndUpdate = function (query, update, options, callback) {
    var $this = this;
    return this.model('photos').findOne(query).exec(function (error, photo) {
        if (!photo) {
            var newPhoto = new $this({
                // imageId is the facebook id
                imageId: update.id,
                displayName: update.displayName,
                age: update.age,
                gender: update.gender,
                picture: update.picture.data.url, // user public profile
                image_url: update.thumbSrc,
                link: update.uri,
                facebookHandle: {
                    friends: update.friends
                },
                // leave is_blocked false
                ratings: 1400
                // leave the rest to default
            });
            newPhoto.save(function (error, savedPhoto) {
                if (error) console.log(error);
                return callback(error, savedPhoto);
            })
        } else {
            return callback(error, photo);
        }
    });
};

var hits = restful.model('hits', new Schema({
    page: String,
    hits: Number,
    date: {type: Date, default: Date.now()}
}));

var battle = restful.model('battle', new Schema({
    battleId: {type: Number, unique: true, index: true},
    winner: Number,
    loser: Number
}));

var visitors = restful.model('visitors', new Schema({
    daily: Number,
    monthly: Number
}));

var blockedPhotos = restful.model("blockedPhotos", new Schema({
    id: Number,
    is_blocked: Boolean
}));

// Make the photos and hits data sets available to the code
module.exports = {
    photos: Photos,
    battle: battle,
    hits: hits,
    blockedPhotos: blockedPhotos
}