var mongoose = require('mongoose');
// var random = require('mongoose-simple-random');
var random = require('abazunts-mongoose-random');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

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
});

// Attaching random plugin to the schema
SweetLipsSchema.plugin(random);
// SweetLipsSchema.plugin(findOrCreate);

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

// SweetLipsSchema.statics.findOneAndUpdate = function(query, update, options, callback) {
//     var $this = this;
//     return this.model('photos').findOne(query).exec(function(error, photo) {
//         if (!photo) {
//             var newPhoto = new $this({
//                 // imageId is the facebook id
//                 imageId: update.id,
//                 displayName: update.displayName,
//                 age: update.age,
//                 gender: update.gender,
//                 picture: update.picture.data.url, // user public profile
//                 image_url: update.thumbSrc,
//                 link: update.uri,
//                 facebook: {
//                     friends: update.friends
//                 },
//                 // leave is_blocked false
//                 ratings: 1400
//                 // leave the rest to default
//             });
//             newPhoto.save(function(error, savedPhoto) {
//                 if (error) console.log(error);
//                 return callback(error, savedPhoto);
//             })
//         } else {
//             return callback(error, photo);
//         }
//     });
// };

SweetLipsSchema.statics.random = function(options, callback) {
    this.count(function(err, count) {
        if (err) {
            return callback(err);
        }
        var rand = Math.floor(Math.random() * count);
        this.find().limit(2).skip(rand).exec(callback);
   }.bind(this));
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

// Make the photos and hits data sets available to the code
module.exports = {
    photos: Photos,
    battle: battle,
    hits: hits,
    blockedPhotos: blockedPhotos
};


// Utility methods - some were pulled partially from other MIT-licensed projects
// var utils = (function () {
//   var random = function(max) { return Math.floor(Math.random() * (max+1)); };
//   var shuffle = function(a) {
//     var length = a.length,
//         shuffled = Array(length);
//     for (var index = 0, rand; index < length; ++index) {
//       rand = random(index);
//       if (rand !== index) shuffled[index] = shuffled[rand];
//       shuffled[rand] = a[index];
//     }
//     return shuffled;
//   };

//   var range = function(length) {return Array(length).fill(null).map(function(cv, i) {return i}); };
//   var sample = function(a, n) { return shuffle(a).slice(0, Math.max(0, n)); };
//   var randomMap = function(count, limit, next, callback) { return asyncMap(sample(range(count), limit), next, callback); };

//   var asyncMap = function(items, next, callback) {
//     var transformed = new Array(items.length),
//         count = 0,
//         halt = false;

//     if (items.length === 0) {
//       return callback()
//     }

//     items.forEach(function(item, index) {
//       next(item, function(error, transformedItem) {
//         if (halt) return;
//         if (error) {
//           halt = true;
//           return callback(error);
//         }
//         transformed[index] = transformedItem;
//         if (++count === items.length) return callback(undefined, transformed);
//       });
//     });
//   };

//   var checkParams = function (conditions, fields, options, callback) {
//     if (typeof conditions === 'function') {
//       callback = conditions;
//       conditions = {};
//       fields = {};
//       options = {};
//     } else if (typeof fields === 'function') {
//       callback = fields;
//       fields = {};
//       options = {};
//     } else if (typeof options === 'function') {
//       callback = options;
//       options = {};
//     }

//     if (options.skip) {
//       delete options.skip;
//     }

//     return {
//       conditions: conditions,
//       fields: fields,
//       options: options,
//       callback: callback
//     }
//   };

//   return {
//     randomMap: randomMap,
//     checkParams: checkParams
//   };
// }());

// module.exports = exports = function (schema) {
//   schema.statics.findRandom = function (conditions, fields, options, callback) {
//     var args = utils.checkParams(conditions, fields, options, callback),
//         _this = this;

//     return _this.count(args.conditions, function(err, count) {
//       var limit = 1,
//         populate = null;
//       if (err) {
//         return args.callback(err, undefined);
//       }
//       if (args.options.limit) {
//         limit = args.options.limit;
//         delete args.options.limit;
//       }
//       if (limit > count) {
//         limit = count;
//       }
//       if (args.options.populate) {
//         populate = args.options.populate;
//         delete args.options.populate;
//       }
//       return utils.randomMap(count, limit, (item, next) => {
//         args.options.skip = item;
//         var find = _this.findOne(args.conditions, args.fields, args.options);
//         if (populate) {
//           find.populate(populate);
//         }
//         find.exec(next);
//       }, args.callback);
//     });
//   };

//   schema.statics.findOneRandom = function (conditions, fields, options, callback) {
//     var args = utils.checkParams(conditions, fields, options, callback);

//     args.options.limit = 1;
//     this.findRandom(args.conditions, args.fields, args.options, function(err, docs) {
//       if (docs && docs.length === 1) {
//         return args.callback(err, docs[0]);
//       }

//       if (!err) {
//         err = "findOneRandom yielded no results.";
//       }

//       return args.callback(err);
//     });
//   };
// };
