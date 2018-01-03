
var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var request = require("request");


var friendId = 100000000;

var friends = [
	{
		id:"13173939",
		name:"",
		age:13,
		sex:"female",
		image_url:"13173939_123485518060780_4194206923963567327_n",
		hotness_counts:0,
		compared:0,
		rankings:0,
		base_rating:1400
	},{id:"13335552",name:"",age:13,sex:"female",image_url:"13335552_107002823055821_2099648036441521132_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"14681606",name:"",age:14,sex:"male",image_url:"14681606_177517646032302_624032032135450137_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"15107194",name:"",age:15,sex:"female",image_url:"15107194_339862656374634_8224432459071081076_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"17952626",name:"",age:14,sex:"female",image_url:"17952626_116014578954311_185756687594650512_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"18300922",name:"",age:15,sex:"female",image_url:"18300922_134455393764459_5180115441292437749_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"21559025",name:"",age:16,sex:"male",image_url:"21559025_341751456284451_4784206509448124249_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"21616405",name:"",age:17,sex:"female",image_url:"21616405_276194742885495_7269444345293685898_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22007697",name:"",age:18,sex:"female",image_url:"22007697_534132350270134_3454712886890506345_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22195701",name:"",age:15,sex:"female",image_url:"22195701_286327161867700_6021210311312590329_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22228170",name:"",age:14,sex:"female",image_url:"22228170_1965831803674156_32762613793692416_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22228273",name:"",age:16,sex:"female",image_url:"22228273_535238276816710_2049018447480810573_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22228308",name:"",age:21,sex:"female",image_url:"22228308_266809920506961_3937700605185072296_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22448663",name:"",age:31,sex:"female",image_url:"22448663_2012361988997913_5487445385886709153_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22449677",name:"",age:13,sex:"female",image_url:"22449677_1869638299942327_9089013222443652571_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22490007",name:"",age:14,sex:"male",image_url:"22490007_772168716300719_8411585367084383230_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22491748",name:"",age:16,sex:"female",image_url:"22491748_383880038718508_8239439686572623717_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22527996",name:"",age:15,sex:"male",image_url:"22527996_487774551590477_5263276565262404218_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22528371",name:"",age:19,sex:"male",image_url:"22528371_1121337268006214_5802752197279776697_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22539685",name:"",age:19,sex:"female",image_url:"22539685_505455106475210_961923654732031583_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22539896",name:"",age:19,sex:"female",image_url:"22539896_336604550145206_8136289351028280272_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22549695",name:"",age:19,sex:"female",image_url:"22549695_1230151777130321_9168960304844384980_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22549964",name:"",age:18,sex:"female",image_url:"22549964_701125690095241_1222786728699406188_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22552696",name:"",age:18,sex:"male",image_url:"22552696_1126841654116067_6895478098604726619_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22552780",name:"",age:18,sex:"male",image_url:"22552780_252786061912191_5358989623247008035_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22552811",name:"",age:16,sex:"female",image_url:"22552811_1896827080644999_6172684468219958188_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22554831",name:"",age:16,sex:"female",image_url:"22554831_725551040988762_2745079434894064516_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22555194",name:"",age:13,sex:"female",image_url:"22555194_786284898219595_2421649676541423225_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22555243",name:"",age:16,sex:"female",image_url:"22555243_324284041314631_2682874877591079545_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22687810",name:"",age:17,sex:"female",image_url:"22687810_502429156802754_8287962131704477409_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22729091",name:"",age:19,sex:"male",image_url:"22729091_2380036155555592_8782618421176277703_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22780383",name:"",age:17,sex:"female",image_url:"22780383_1319226184873392_8109283516790865485_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22788804",name:"",age:15,sex:"male",image_url:"22788804_495226267525633_7859460528845639878_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22814096",name:"",age:18,sex:"male",image_url:"22814096_1473731962742556_7253283415688667708_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"22814133",name:"",age:15,sex:"female",image_url:"22814133_801316723389150_6675799987336641849_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"23755125",name:"",age:14,sex:"male",image_url:"23755125_1752625408380629_8716128352251709514_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"23795684",name:"",age:14,sex:"female",image_url:"23795684_1341677052628174_2780464941112581107_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"23843283",name:"",age:13,sex:"female",image_url:"23843283_299468033873782_2928395153419791336_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"23915570",name:"",age:14,sex:"female",image_url:"23915570_141523579950603_3566883689364824421_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"24909547",name:"",age:13,sex:"male",image_url:"24909547_370592206720983_6608855228505742643_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400},{id:"25299331",name:"",age:18,sex:"female",image_url:"25299331_570846993259841_735144351331369815_n",hotness_counts:0,compared:0,rankings:0,base_rating:1400}]

var app = express();
app.use(express.static('./'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000), function() {
	console.log("Server running on port: 5000");
});

// Server index page
app.get("/", function (req, res) {
    res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function(req, res) {
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

// All callbacks for Messenger will be Posted here
app.post("/webhook", function (req, res) {
	// Make sure this is a page subscribtion
	if (req.body.object === "page") {
		// Iterate over each entry
		// there may be multiple entries if batched
		req.body.entry.forEach(function(entry) {
			// Iterate over each messaging event
			entry.messaging.forEach(function(entry) {
				if (event.postback) {
					processPostback(event);
				} else if (event.message) {
					processMessage(event);
				}
			});
		});
		
		res.sendStatus(200);
	}
});

function findFriend(id){
	for(var i =0; i<friends.length; i++){
		if(friends[i].id === id){
			return friends[i];
		}
	}
	return null;
}

function removeFriend(id){
	var friendIndex = 0;
	for(var i=0; i<friends.length; i++){
 		if(friends[i].id === id){
 				friendIndex = i;
 		}
 	}
 	friends.splice(friendIndex, 1);
 }

function filterFriendsGender(gender){
  var specFriends = [];
	for (var i=0; i<friends.length; i++) {
		if(friends[i].sex === gender){
      specFriends.push(friends[i]);
			return specFriends;
		}
	}
	return null;
}


/**
 * HTTP GET /friends
 * Should return a list of friends
 */
app.get('/friends/', function (request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	console.log('In GET function ');
	response.json(friends);
});

/**
 * HTTP GET /friends/:id
 * id is the unique identifier of the friend you want to retrieve
 * Should return the task with the specified id, or else 404
 */
app.get('/friends/:id', function(request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	console.log('Getting a friend with id ' + request.params.id);
	
	var friend = findFriend(request.params.id);
	if(friend === null){
		response.sendStatus(404);
	}else{
		response.json(friend);
	}
});

/**
 * HTTP GET /friends?fields=:id,:name,:gender,:sex
 * Should return a list of id,name,gender,sex
 */
app.get('/friends/gender/:sex', function(request, response){
	response.header('Access-Control-Allow-Origin', '*');
	var params = request.params.sex;
	var gender = filterFriendsGender(params);
	response.json(gender);
});

/**
 * HTTP POST /friends/
 * The body of this request contains the friend you are creating.
 * Returns 200 on success
 */
app.post('/friends', function (request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	
	var friend = request.body;
	console.log('Saving friend with the following structure ' + JSON.stringify(friend));
	friend.id = friendId++;
	friends.push(friend);
	response.send(friend);
});

/**
 * HTTP PUT /friends/
 * The id is the unique identifier of the friend you wish to update.
 * Returns 404 if the friend with this id doesn't exist.
 */
app.put('/friends/:id', function (request, response) {
	response.header('Access-Control-Allow-Origin', '*');
	
	var friend = request.body;
	console.log('Updating Friend ' + JSON.stringify(friend));
	
	var currentFriend = findFriend(parseInt(request.params.id,10));
	if(currentFriend === null){
		response.sendStatus(404);
	}else{
		//save the friend locally
		currentFriend.id = friend.id;
		currentFriend.name = friend.name;
		currentFriend.age = friend.age;
		currentFriend.sex = friend.sex;
		currentFriend.image_url = friend.image_url;
		currentFriend.hottness_counts = friend.hottness_counts;
		currentFriend.compared = friend.compared;
		currentFriend.rankings = friend.rankings;
		response.send(friend);
	}
});

/**
 * HTTP DELETE /friends/
 * The id is the unique identifier of the friend you wish to delete.
 * Returns 404 if the friend with this id doesn't exist.
 */
app.delete('/friends/:id', function (request, response) {
	console.log('calling delete');
	response.header('Access-Control-Allow-Origin', '*');
	
	var friend = findFriend(parseInt(request.params.id,10));
	if(friend === null){
		console.log('Could not find friend');
		response.send(404);
	}else{
		console.log('Deleting ' + request.params.id);
		removeFriend(parseInt(request.params.id, 10));
		response.send(200);
	}
	response.send(200);
});

//additional setup to allow CORS requests
var allowCrossDomain = function(req, response, next) {
	response.header('Access-Control-Allow-Origin', "http://localhost");
	response.header('Access-Control-Allow-Methods', 'OPTIONS, GET,PUT,POST,DELETE');
	response.header('Access-Control-Allow-Headers', 'Content-Type');
	if ('OPTIONS' === req.method) {
		response.send(200);
	}else {
		next();
	}
};

app.use(allowCrossDomain);