// Invoke JavaScript Strict mode
'use strict';
// Initializing dependencies
const restful = require("node-restful"),
    mongoose = require("mongoose"),
    random = require('mongoose-simple-random'),
    Schema = mongoose.Schema;

// Schema
const SweetLipsSchema = new Schema({
    //_id: <ObjectId>,
    image_id: {type: String, unique: true, index: true},
    fullName: String,
    age: Number,
    gender: String,
    image_url: String,
    image_src: String,
    uri: String,
    facebook_friends: [],
    facebookProvider: {
        type: {
            id: String,
            token: String
        },
        selected: false
    },
    is_blocked: {type: Boolean, default: false},
    wins: {type: Number, default: 0},
    losses: {type: Number, default: 0},
    draws: {type: Number, default: 0},
    score: {type: Number, default: 0},
    ratings: {type: Number, default: 1400},
    rankings: {type: Number, default: 0},
    // define the geospatial field
    random: {type: [Number], index: '2d'},
    voted: {type: Boolean, default: false},
    vote_by: [],
    challengers: [],
    draws_with: [],
    joinedAt: {type: Date, default: Date.now()},
}, {strict: false});

// Attaching random plugin to the schema
SweetLipsSchema.plugin(random);

const photos = restful.model("photos", SweetLipsSchema);

SweetLipsSchema.statics.upsertFbPhoto = function(accessToken, refreshToken, profile, callback) {
    const $this = this;
    return this.findOne({
        'facebookProvider.id': profile.id
    }, function(err, photo){
        if (!photo) {
            var newPhoto = new $this({
                // image_id is the facebook id
                image_id: profile.id,
                fullName: profile.displayName,
                age: profile.age,
                gender: profile.gender,
                image_url: profile.picture.data.url, // user public profile
                image_src: profile.thumbSrc,
                uri: profile.uri,
                // email: profile.emails[0].value,
                facebook_friends: [profile.friends.id],
                facebookProvider: {
                    id: profile.id,
                    token: accessToken
                },
                // leave is_blocked false
                //ratings: profile.friends.length // 1400 set base ratings according to the number of friends user has
                // leave the rest to default
            });

            newPhoto.save(function(error, savedPhoto){
                if (error) {
                    console.log(error);
                };
                return callback(error, savedPhoto);
            });
        } else {
            return callback(err, photo);
        };
    });
};

// define a method to find the closest person
SweetLipsSchema.methods.findClosest = function(callback) {
    return this.model('photos').find({
        loc: { $nearSphere: this.loc },
        name: { $ne: this.name }
    }).limit(1).exec(callback);
};

SweetLipsSchema.statics.findPhotoById = function (id, callback) {
    return this.model('photos').findOne({
        "image_id": id
    }).exec(callback);
};

/*SweetLipsSchema.statics.findOneAndUpdate = function(id, update, options, callback) {
    var $this = this;
    return this.model('photos').findById(id).exec(function (error, photo) {
        if (!photo) {
            var newPhoto = new $this({
                // image_id is the facebook id
                image_id: photo.id,
                fullName: photo.displayName,
                age: photo.age,
                gender: photo.gender,
                image_url: photo.picture.data.url, // user public profile
                image_src: photo.thumbSrc,
                uri: photo.uri,
                // email: profile.emails[0].value,
                facebook_friends: photo.friends,
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
};*/

const hits = restful.model("hits", new Schema({
    page: String,
    hits: Number,
    date: {type: Date, default: Date.now()}
}));

const battles = restful.model("battles", new Schema({
    battle_id: {type: Number, unique: true, index: true},
    winner: Number,
    loser: Number
}));

// Make the photos and hits data sets available to the code
module.exports = {
    photos: photos,
    battles: battles,
    hits: hits
};