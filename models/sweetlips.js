var mongoose = require('mongoose');
var random = require('mongoose-simple-random');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId; 
// var ObjectId = mongoose.Types.ObjectId;

// Schema
var SweetLipsSchema = new Schema({
    // id: String,
    imageId: { type: String, unique: true, index: true },
    fullName: String,
    firstName: String,
    lastName: String,
    age: Number,
    gender: String,
    picture: String,
    profileUrl: String,
    friends: [{
        type: ObjectId,
        ref: 'photos',
        // unique: true
    }],
    facebook: {
        id: String,
        friends: [],
        accessToken: String
    },
    is_blocked: {type: Boolean, default: false},
    wins: {type: Number, default: 0},
    losses: {type: Number, default:0},
    draws: {type: Number, default: 0},
    score: {type: Number, default: 0},
    ratings: {type: Number, default: 1400},
    // define the geospatial field
    random: {type: [Number], index: '2d'},
    voted: {type: Boolean, default: false},
    voted_by: [{type: ObjectId, ref: 'photos'}],
    challengers: [{type: ObjectId, ref: 'photos'}]
}, {strict: false});

// Attaching random plugin to the schema
SweetLipsSchema.plugin(random);
SweetLipsSchema.plugin(findOrCreate);

// SweetLipsSchema.statics.findOrCreate = function(id, options, callback) {
//     Photos.find({
//         gender: 'female',
//         $or: [{loves: 'apple'}, {weight: {$lt: 500}}]
//     }, function(err, user) {
//     });
// };

SweetLipsSchema.statics.upsertFbUser = function(profile, accessToken, callback) {
    const $this = this;
    return $this.model.findOne({'facebook.id': profile.id}).then((player) => {
        if (player) {
            return callback(null, player);
        } 
        else {
            // if no player, create new player from Facebook
            var newPhoto = new $this();
            // {
            //     // imageId is the facebook id
            //     imageId: profile.id,
            //     displayName: profile.displayName,
            //     age: new Date().getFullYear() - profile.birthday,
            //     gender: profile.gender,
            //     picture: profile.picture,
            //     image_url: profile.picture, // profile.picture.data.url
            //     link: profile.profileUrl,
            //     facebook: {
            //         id: profile.id,
            //         accessToken: accessToken,
            //         friends: [
            //             profile.friends.id
            //         ]
            //     }
            //     // leave is_blocked false
            //     //ratings: profile.friends.length // 1400 set base ratings according to the number of friends user has
            //     // leave the rest to default

            // });

            // newPhoto.save().then((newPhoto) => {
            //     return callback(null, newPhoto);
            // }).catch ((error) => {
            //     return callback(error);
            //     console.log(error);
            // });
        }
    });

    // check if photo already exists in the db
    // Photos.findOne({ 'facebook.id' : profile.id }, function(err, user) {
    //     if (err) throw err;
    
    //     if (user) {
    //         // already have the photo, update the photo
    //         // req.session.strategy = 'facebook';
    //         console.log("user is:", user);

    //         user.picture = profile.photos[0].value;
    //         // user.profileUrl = profile.__json.link;
    //         user.facebook['accessToken'] = accessToken;
            
    //         user.save(function(error, result) {
    //             if (err) throw error;
    //             return done(null, result);
    //         });
    //     }
    //     else {
    //         // if not, create user in the db
    //         let photo = new Photos();
    //         photo.imageId = profile.id;
            
    //         if (profile._json.name) {
    //             photo.fullName = profile._json.name;
    //         }
    //         else if (profile._json.firstName || profile._json.givenName) {
    //             photo.fullName = `${profile._json.firstName} ${profile._json.givenName}`;
    //         }

    //         if (profile._json.givenName) {
    //             photo.firstName = profile._json.givenName;
    //             photo.lastName = profile._json.familyName;
    //         }
    //         else {

    //         }
            
    //         photo.firstName = profile._json.givenName || "";
    //         photo.lastName = profile._json.familyName || "";

    //         if ()
    //         photo.age = (new Date().getYear() - new Date(profile._json.birthday).getYear());
    //         photo.gender = profile._json.gender || 'male';
    //         photo.picture = profile.photos[0].value || "";
    //         photo.profileUrl = profile._json.link || "";
    //         photo.facebook['id'] = profile._json.id;
    //         photo.facebook['friends'] = profile._json.friends[0].data;
    //         photo.facebook['accessToken'] = accessToken;

    //         photo.save((error, newPhoto) => {
    //             if (error) throw error;
    //             console.log('new photo created:', newPhoto);
    //             done(null, newPhoto);
    //         });
    //     }
    // });

};

SweetLipsSchema.statics.findImageById = function(id, callback) {
    return Photos.findOne({
        'imageId': id
    }).exec(callback);
};

SweetLipsSchema.statics.findOneAndUpdate = function(query, update, options, callback) {
    var $this = this;
    return this.model('photos').findOne(query).exec(function(error, photo) {
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
                facebook: {
                    friends: update.friends
                },
                // leave is_blocked false
                ratings: 1400
                // leave the rest to default
            });
            newPhoto.save(function(error, savedPhoto) {
                if (error) console.log(error);
                return callback(error, savedPhoto);
            })
        } else {
            return callback(error, photo);
        }
    });
};

var Photos = mongoose.model('photos', SweetLipsSchema);

var hits = mongoose.model('hits', new Schema({
    page: String,
    hits: Number,
    date: {type: Date, default: Date.now()}
}));

var battle = mongoose.model('battle', new Schema({
    battleId: {type: Number, unique: true, index: true},
    winner: Number,
    loser: Number
}));

var visitors = mongoose.model('visitors', new Schema({
    daily: Number,
    monthly: Number
}));

var blockedPhotos = mongoose.model("blockedPhotos", new Schema({
    id: Number,
    is_blocked: Boolean
}));

const AccessToken = mongoose.model('accessToken', new mongoose.Schema({
    // Use the `accessToken` string itself as `_id` so you get an
    // index for fast queries.
    _id: String,
    userId: String
}));


// Make the photos and hits data sets available to the code
module.exports = {
    photos: Photos,
    battle: battle,
    hits: hits,
    blockedPhotos: blockedPhotos,
    accessToken: AccessToken
};
