// StuckWanYah.mobile.game.init
// StuckWanYah.mobile.game.play
// StuckWanYah.mobile.game.makeMatch
// StuckWanYah.mobile.game.gameArea
// StuckWanYah.mobile.game.addPhotoToCell
// StuckWanYah.mobile.game.loadPhotosFromServer
// StuckWanYah.web.game.loadPhotosFromServer

/*var StuckWanYah
!function(StuckWanYah){
	var mobile;
	(function(mobile) {
		// body...
	}(StuckWanYah.mobile || (StuckWanYah.mobile = {})))
}(StuckWanYah || (StuckWanYah = {}));*/
(function(){
	(function(StuckWanYah){
		var StuckWanYah = /* @class */ function(){};

		StuckWanYah.prototype.init = function(first_argument) {
			this.onLoad();
		};

		StuckWanYah.prototype.initFacebookSDK = function(first_argument) {
			return FB.init({
				appId		: '1791165357568831',
				cookie	: true,
				xfbml		: true,
				version	: 'v2.12'
			});
		};

		StuckWanYah.prototype.onLoad = function(first_argument) {
			StuckWanYah.initFacebookSDK();
		};

		StuckWanYah.prototype.fbLogin = function(first_argument) {
			FB.login().then(function(response){
				if (response) {
					var access_token = response.getAccessToken();
					$.post("/api/v1/auth/facebook/token", {
						'access_token': access_token
					}, function(error, body, response) {
						if (error) {return new Error("Error occurred during authetication process");};
					});
				}
			}).catch(function(error){
				throw new Error("Provide ")
			})
		};

		StuckWanYah.prototype.ajaxRequest = function(method, url, data, callback) {
		var param = JSON.stringify({
			'access_token': "this_is_my_token"
		});
		var xhr = new XMLHttpRequest();
		xhr.withCredentials = true;
		xhr.addEventListener('readystatechange', function () {
			if (this.readyState === 4) {
			console.log(this.responseText);
			}
		});
		xhr.open(method, url);
		xhr.setRequestHeader('content-type', 'application/json');
		xhr.send(param);
	};

	}(StuckWanYah || StuckWanYah = {}));

	var Facebook = function(){};
	Facebook.prototype.logger = function() {
			console.log("hello world");
	};
}());