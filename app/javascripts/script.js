/*!
 * Copyright (c) 2018-present, StuckWanYah. All rights reserved.
 * (c) 2018 Christian JF Augustyn
 * version: 1.0.0, updated: 2018-04-08.12:36:49
 */
/**

1. check user status
2. if user logged in goto 4.
3. prompt user to log in
4. sends user info to server
5. updates current user session

*/
var current_page = document.location.pathname;
var keyStrokeCount = 0;
var xhr = null;
var photos = [];
var friendslist = [];
var initialized = false;
var currentLoginStatus = null;
var alreadyInitializing = false;
var facebookStatusCodes = {
	declined: "declined",
	granted: "granted",
	connected: "connected",
	not_authorized: "not_authorized"
};
window.StuckWanYah = {
	"appID": "1791165357568831",
	"frictionlessRequests": true,
	"init": true,
	"level": "debug",
	"signedRequest": null,
	"status": true,
	"version": "v3.2",
	"viewMode": "website"
};

var _permissions = 'public_profile, email, user_gender, user_age_range, user_birthday, user_photos, user_link, user_friends, pages_user_gender,pages_messaging,pages_manage_posts';
var _fields = 'public_profile, email, user_gender, user_age_range, user_birthday, user_photos, user_link, user_friends, pages_user_gender,pages_messaging,pages_manage_posts';

/**
 * StuckWanYah JavaScript
 */
var Api = function () {
	var b = function b(b) {
		this.url = b.url;
		this.data = b.data;
		this.type = b.type;
		$.ajax({
			url: this.url,
			data: this.data || JSON.stringify(this.data),
			type: this.type,
			timeout: 30000,
			cache: false,
			dataType: "json",
			contentType: "application/json; charset=UTF-8", //contentType: "application/x-www-form-urlencoded",
			success: function(c) {
				c.success ? 'function' == typeof b.success && b.success(c) : 'function' == typeof b.error && b.error();
			},
			error: function(qXHR, textStatus, errorThrown) {
				//cb(qXHR, textStatus, errorThrown)
				// cb(true, qXHR.responseJSON, errorThrown)
				'function' == typeof b.error && b.error();
			}
		});
	},
	d = function d(cuid) {
		var count_url = Api.getApiUrl() + '/photos?user_id=' + cuid;
		var xhr = new XMLHttpRequest();
		//make http request to endpoint
		xhr.open('GET', cuid, true);
		xhr.onload = function (e) {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					console.log(xhr.responseText);
				} else {
					console.error(xhr.statusText);
				}
			}
		};
		xhr.onerror = function p(e) {
			console.error(xhr.statusText);
		};
		xhr.send(null);
	};
	return {
		_stage: {
			"BASE_URL": "http://localhost:5000",
			"API_URL": "http://localhost:5000/api"
		},
		_production: {
			// "BASE_URL": "https://stuckwanyah.herokuapp.com",
			// "API_URL": "https://stuckwanyah.herokuapp.com/api",
			"BASE_URL": "https://stuckwanyah.cleverapps.io",
			"API_URL": "https://stuckwanyah.cleverapps.io/api",
			"FACEBOOK_APP_ID": "1791165357568831",
			"FACEBOOK_APP_URL": "https://apps.facebook.com/stuckwanyah",
			"FACEBOOK_PAGE_URL": "https://www.facebook.com/stuckwanyah"
		},
		_hosts: {
			"stuckwanyah.herokuapp.com": "_production",
			"www.facebook.com": "_production",
			"web.facebook.com": "_production",
			"apps.facebook.com": "_production",
			"localhost": "_stage"
		},
		_isPatched: function e(a) {
			return !/^%[^%]+%$/.test();
		},
		_getProp: function e(a) {
			return this._stage[a] && this._isPatched(this._stage[a]) ? this._production[a] : this._stage[a];
		},
		_getHost: function e(a) {
			return this._hosts[a];
		},
		_getHostname: function e(b) {
			b = b || window.document;
			var c = b.domain;
			return /^www./.test(c) && (c = c.slice(4)), c;
		},
		_getBaseUrl: function e() {
			var i = window.location;
			return this[this._getHost(this._getHostname(document))]["BASE_URL"], i.protocol + "//" + i.host
		},
		getApiUrl: function e() {
			return this[this._getHost(this._getHostname(document))]["API_URL"];
		},
		getBaseUrl: function e() {
			return this._getBaseUrl();
		},
		getFacebookAppId: function e() {
			return this._production["FACEBOOK_APP_ID"];
		},
		getFacebookAppUrl: function e() {
			return this._production["FACEBOOK_APP_URL"];
		},
		getFacebookPageUrl: function e() {
			return this._production["FACEBOOK_PAGE_URL"];
		},
		getCurrentPage: function() {
			return window.location.href.substring(Api._getBaseUrl().length)
		},
		getTwoRandomImages: function e() {
			return b({url: this.getApiUrl() + '/photos', data: { limit: 2 }, type: 'GET'});
		},
		getPhotoById: function e(id) {
			return b(this.getApiUrl() + '/photos/' + id);
		},
		displayPhoto: function e(src) {
			return b(this.getApiUrl() + '/photos/' + src);
		},
		getRankings: function e() {
			return d(this.getApiUrl() + '/photos/top');
		},
		getFriends: function e() {
			return b( this.getApiUrl() + '/photos/me/friends' );
		},
		getUserFbFriendsList: function e() {
			return new Promise(function (resolve, reject) {
				FB.api('/me/friends', function(result) {
					if (!result){ console.error(result); reject(false); }
					resolve(result);
				})
				// FB.api('/me','GET', {
				// 	fields: _fields
				// }, function (response) {
				// 	if (response) {
				// 		for (var i=0; i<response.friends.length; i++) {
				// 			response.friends[i].id
				// 		}
				// 	}
				// 	return response;
				// });
			});
			// FB.api("/{friend-list-id}", function (response) {
			// 	if (response && !response.error) {
			// 		/* handle the result */
			// 	}
			// });
		},
		getFbUserPhoto: function e(e) {
			FB.api("/{photo-id}", function (response) {
				if (response && !response.error) {
					/* handle the result */
				}
			});
		},
		getAccessToken: function e() {
			return Api._getUserData("access_token") || 
			(Utils.writeItemToLocalStorage('access_token', FB.getAccessToken()));
		},
		checkLoginState: function e() {
			Utils.log("checking login state...");
			return new Promise(function(resolve, reject){
				// checking login status
				FB.getLoginStatus(function (response) {
					FB.Event.subscribe('auth.statusChange', Api.statusChangeCallback); 
					Utils.log("checked: " + response);
					currentLoginStatus = response.status;
					if (response.status) {
						// 
					}
				
				FB.api("/me?fields=id,first_name,picture{url},email,birthday,gender,age_range,friends{id,first_name,birthday,age_range,gender}", function (response) {
					console.log(response)
					console.log('Successful login for: ' + response.first_name + " = " + response.id + ".");
				});

					Api.statusChangeCallback(response);
					resolve(response);
				});
			});
		},
		onStatusChange: function(response) {
			var status = response.status;
			console.log(status);
		},
		statusChangeCallback: function(response) {
			Utils.log('statusChangeCallback');
			console.log(response);
			// Log.info('onStatus', response);
			
			if (response.status) {
				if (response.status === 'connected') {
					// showAccountInfo();
					var fbAccessToken = response.authResponse.accessToken;
					Utils.writeItemToLocalStorage("access_token", fbAccessToken);
					var fbUser = response.authResponse.userID;

					Utils.writeItemToLocalStorage("_user", fbUser);
				
					console.log('Logged in as: ' + fbUser);
					Utils.writeItemToLocalStorage("c_user_status", response.status);
					// Logged into your app and Facebook.
					Api.userDetailsFromFb();
					var uid = response.authResponse.userID;
					var accessToken = response.authResponse.accessToken;
				} else if (response.status === 'not_authorized' || response.status === 'unknown') {
					// alert('You are not authorized');
					Api.login();
				} else {
					// showLoginButton();
					console.log('Please log into this app.');
					Api.login();
					// window.top.location = "https://facebook.com";
				}
			} else {
				Utils.log("You're not logged in");
				this.Api.login();
			}
		},
		showAccountInfo: function() {
			FB.api(FB.getUserID(), {
				fields: 'name'
			}, function(response) {
				// Log.info('API Callback', response);
				console.log(response)
				// document.getElementById('account-info').innerHTML = (
				// 	'<img src="' + response[0].pic_square + '"> ' +
				// 	response[0].name +
				// 	' <button class="btn" onclick="FB.logout()">Logout</button>'
				// );
			});
		},
		fbevent: function() {
			FB.Event.subscribe("auth.authResponseChange", function(response) {
				if (response.status === "connected") {
					testApi();
				} else if (response.status === "not_authorized") {
					FB.login();
				} else {
					FB.login();
				}
			});
		},
		fblogin: function e() {
			return new Promise(function (resolve, reject) {
				FB.login(function (response) {
					// receive response sent by Facebook 
					if (response.status == "connected" && response.authResponse) {
						resolve(response);
					} else {
						reject({ success: false, reason: "cancel" });
					}
				}, { scope: _fields });
			});
		},
		login: function e() {
			return new Promise(function (resolve, reject) {
				// Invoke Facebook login
				Api.fblogin().then(function(fbRes) {
					// receive response sent by Facebook server
					if (fbRes.authResponse) {
						Api.checkLoginState().then(function(fbRes){
							if (fbRes.authResponse === null) {
								setTimeout(function(){
									reject({ success: false, reason: "cancel" });
								}, 1000);
							} else {
								Api.userDetailsFromFb().then(function(fbResponse){
									if (fbResponse) {
										resolve({ success: true, authResponse: fbResponse.authResponse, userData: fbResponse });
										// pass response to my server 
										console.log(fbRes.authResponse);
										$.post("/foo", {
											profileid: fbRes.authResponse.userID,
											accessToken: fbRes.authResponse.accessToken,
											// name: 
										}).then(function(status, statusText, response) {
											console.log(statusText);
										})
									// 	$.post(Api.getApiUrl() + '/auth/web', fbRes.authResponse /**{
									// 		userID: 100004177278169,
									// 		accessToken: "123456789",
									// 		expiresIn: ""
									// 	}*/).then(function(status, statusText, response){
									// 		// server receive response, query database and reply with response, sets response to localStorage 
									// 		var token = response.getResponseHeader('accessToken');/*response.headers.get('x-auth-token');*/
									// 		if (token) {
									// 			Utils.writeItemToLocalStorage('c_user', /*response.headers.get('userId')*/response.getResponseHeader('userId'));
									// 			Utils.writeItemToLocalStorage('display_name', /*response.headers.get('userName')*/response.getResponseHeader('userName'));
									// 			Utils.writeItemToLocalStorage('access_token', token);
									// 		}
									// 		// resolve(response);
									// 		location.href = Api.getBaseUrl();
									// 	}).catch(function(){
									// 		reject({ success: false, reason: "cancel" });
									// 	});
									}
									reject({ success: false, reason: "facebookPermissionCodes.noEmailPermission" });
								});
							}
						})
					} else {
						reject({ success: false, reason: "cancel" });
					}
				});
			});
		},
		logout: function e() {
			Api.checkLoginState().then(function(response){
				if (response.status === facebookStatusCodes.connected) {
					FB.logout(function(response) {
						localStorage.removeItem('access_token');
						$.post(Api.getApiUrl() + '/auth/facebook/logout')
					});
				}
			});
		},
		_setUserData: function e(store, obj) {
			Utils.log(JSON.stringify(obj));
			try {
				return Utils.writeItemToLocalStorage(store, obj)
			} catch (e) {
				return new Error(e);
			}
		},
		_getUserData: function e(key) {
			return Utils.readItemFromLocalStorage(key);
				// $.get(Api.getApiUrl() + '/auth/me').then(function (response) {
				//   resolve(response);
				// });
		},
		_getUserID: function e() {
			return Utils.readItemFromLocalStorage("c_user") || (Api._setUserData("c_user", FB.getUserID()));
		},
		getCurrentUser: function e() {
			return Api._getUserID();
		},
		getCurrentUserFromCookies: function e(a) {
			chrome.cookies.get({
				url: 'https://facebook.com',
				name: 'c_user'
			}, function (b) {
				null == b ? (App.userId = 0, clearInterval(), setTimeout(function () {
					this.Api.getCurrentUser(a)
				}, 6000)) : a(b.value)
			});
		},
		userDetailsFromFb: function e() {
			Utils.log('Welcome! Fetching your information.... ');
			return new Promise(function (resolve) {
				FB.api("/me?fields=id,first_name,picture{url},email,birthday,gender,age_range,friends{id,first_name,birthday,age_range,gender}", 
				function (response) {
					console.log(response)
					console.log('Successful login for: ' + response.first_name + " = " + response.id + ".");
					// document.getElementById('status').innerHTML = 'Thanks for logging in, ' + response.name + '!';			
					// alert(response.name);
					//alert(response.id);
					resolve(response);
					// "blackhole-100004177278169-1460472517@devnull.facebook.com".split('-')[1]
					// "blackhole-100004177278169-1460472517@devnull.facebook.com".slice(10, 25)
					// Log.info('API response', response);
					// Log.info('FB.login response', response);
					// document.getElementById('accountInfo').innerHTML = ('<img src="' + response.picture.data.url + '"> ' + response.name);
				});
			});
		},
		isLoggedInAndIsAuthenticated: function e() {
			// TODO: Fix synchronous AJAX request, use async method instead
			return Api.getCurrentUser() != undefined ? !0 : 0;
			/*var loggedIn = false;
			return $.ajax({
				url: Api.getApiUrl() + '/auth/me',
				global: false,
				type: 'POST',
				dataType: 'json',
				success: function (json_data) {
					loggedIn = json_data.data.logged_in;
				},
				fail: function e(data) {
					loggedIn = false;
				}
			});
			if (!Api.isLoggedIn()) {
						$.ajax({
							url: Api.getApiUrl() + '/auth/login',
							type: 'post',
							dataType: 'json',
							data: {
							}
						}).done(function (data) {
						}).fail(function (data) {
						})
					}*/
		},
		postStoryOnFacebook: function e(message, facebookid) {
			return new Promise(function (resolve, reject) {
				FB.api('/me/feed', 'post', {
					message: 'Hello, world!' //message
				});
			});
		},
		postPhotosOnFacebook: function(caption, imageurl, facebookid) {
			return new Promise(function(resolve, reject) {
				FB.api("/me/photos", "post", {
					caption: caption,
					url: imageurl
				});
			});
		},
		postVideoOnFacebook: function(caption, videourl, facebookid) {
			return new Promise(function(resolve, reject) {
				FB.api("/me/videos" /*${id}/videos*/, "post", {
					description: 'Caption goes here',
					file_url: 'Video url goes here'
				}); 
			});
		},
		shareOnFacebook: function e(e) {
			return new Promise(function (resolve, reject) {
				FB.ui({
					method: 'share', 
					action_type: 'og.likes', 
					actions_properties: JSON.stringify({
						object: 'https://stuckwanyah.herokuapp.com/'
					})
				}).then(function (response) {
					console.log(response); 
				}).catch (function (err) {
					console.error(err);
					reject(true);
				});
			});
		},
		showMyName: function() {
			return Utils.readItemFromLocalStorage("display_name");
		},
		addtab: function e() {
			FB.ui({
				method: 'pagetab',
				redirect_uri: 'https://stuckwanyah.herokuapp.com/'
			}, function (response) {
			});
		},
		showFbLoginButton: function e() {
			if (Api.isLoggedInAndIsAuthenticated()) {
				$('<div id="#logoutbutton"></div>');
			} else {
				$('<div id="#loginbutton"></div>');
			}
		},
		getAppsFromHost: function(serverUrl, hostname, data) {
			try {
				var xmlhttp = new XMLHttpRequest();

				xmlhttp.open('POST', serverUrl, true);

				xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

				xmlhttp.onreadystatechange = function(e) {
					if (xmlhttp.readyState == 4) {
						if (xmlhttp.status == 200) {
							try {
								var res = JSON.parse(xmlhttp.responseText) || {};
								console.log(res);
								if (typeof res.apps != "undefined") {
									var response = {
										"response": JSON.parse(res.apps) || {},
										hostname: hostname
									}
									var data = {
										tabTechs: response
									}
									self.processResponse(data);
								} else {
									self.getSiteData();
								}
							} catch (e) {
								console.log(e);
								self.showContent();
							}
						} else {
							// Need to say server issue
							self.showServerErrorMessage(hostname);
						}
					}
				};
				xmlhttp.send('data=' + encodeURIComponent(JSON.stringify(data)));
			} catch (e) {
				self.showContent();
			}
		}
	};
}()
, Utils = function () {
	var _userData = typeof localStorage['userData'] == 'undefined' ? {} : JSON.parse(localStorage['userData']);
	return {
		readItemFromLocalStorage: function e(key) {
			if (localStorage[key] !== undefined) {
				return localStorage[key];
			}
		},
		writeItemToLocalStorage: function e(key, value) {
			var dataKey = key,
			dataValue = JSON.stringify(value);
			try {
				localStorage.setItem(dataKey, dataValue);
			} catch (e) {
			}
		},
		add: function(t, e) {
			var i, n = localStorage.setting, o = {};
			try {
				n ? (o = JSON.parse(n),
				"undefined" != typeof o[t] ? "boolean" == typeof o[t] || "string" == typeof o[t] : (o[t] = e,
				i = JSON.stringify(o),
				localStorage.setting = i)) : (o = {},
				o[t] = e,
				i = JSON.stringify(o),
				localStorage.setting = i)
			} catch (a) {
				console.log(a)
			}
		},
		get: function(t) {
			var e = localStorage.setting
				, i = {};
			try {
				return i = JSON.parse(e),
				i[t]
			} catch (n) {}
		},
		set: function(t, e) {
			var i = localStorage.setting
				, n = {};
			try {
				n = JSON.parse(i),
				n[t] = e,
				localStorage.setting = JSON.stringify(n),
				"mostVisits" != t && "wpTime" != t && "cloudBackup" != t && "wcity" != t && "wcountry" != t && "lastWallpaper" != t && "bgType" != t && "bgname" != t && $setting.sync()
			} catch (o) {}
		},
		onChange: function() {
			$("input[type=radio]").live("change", function(t) {
				var e = $(this).attr("name")
					, i = $(this).val();
				$setting.set(e, i),
				"AutoBgType" === e && setAutoBg(),
				"displayTopType" === e && HowTpShowTop()
			}),
			$("input.checkBoxToggle").live("change", function(t) {
				var e = $(this).attr("name")
					, i = $(this).is(":checked");
				if ($setting.set(e, i),
				"blurWallpaper" === e)
					try {
						wallpaperToblur()
					} catch (n) {
						console.log(n)
					}
				"autoWallpaper" === e && setAutoBg(),
				"displayAtTop" === e && HowTpShowTop()
			})
		},
		onRangeChange: function() {
			$("input[type=range]").live("input", function(t) {
				t.preventDefault();
				var e, i = $(this).attr("name"), n = $(this).val();
				$("#" + i + "Value").text(n),
				"iconRadius" == $(this)[0].id ? (e = Math.round(n / 2) + "%",
				$(".iconInIn,.icon,.editico,.webIconImg,#iconPreviewTop,#EditiconPreviewTop").css("border-radius", e)) : "iconOpacity" == $(this)[0].id && $(".icon").css("opacity", n / 100)
			}),
			$("input[type=range]").live("change", function(t) {
				t.preventDefault();
				var e = $(this).attr("name")
					, i = $(this).val();
				$setting.set(e, i)
			})
		},
		sync: function(t) {
			Show_Noti_Num && setAllNotiNum();
			var e = $setting.get("cloudBackup");
			e && syncToCloud(),
			console.log("设置数据已同步")
		},
		getSetting: function(name, nullValue) {
			if (typeof _userData[name] == 'undefined') {
				_userData[name] = nullValue;
			}
			return _userData[name];
		},
		setSetting: function(name, val) {
			_userData[name] = val;
			localStorage['userData'] = JSON.stringify(_userData);
		},
		settings: {
			set email(val) {
				Utils.setSetting('email', val);
			},
			get email() {
				return Utils.getSetting('email', null);
			},
			set userName(val) {
				return Utils.setSetting('name', val);
			},
			get userName() {
				return Utils.getSetting('name', null);
			}
		},
		cookie: function(cname) {
			var c, ca, i, name;
			name = cname + '=';
			ca = document.cookie.split(';');
			i = 0;
			while (i < ca.length) {
				c = ca[i];
				while (c.charAt(0) === ' ') {
					c = c.substring(1);
				}
				if (c.indexOf(name) === 0) {
					return c.substring(name.length, c.length);
				}
				i++;
			}
			return '';
		},
		setCookie: function (e, t, i) { 
			var o = ""; 
			if (i) { 
				var n = new Date; 
				n.setTime(n.getTime() + 24 * i * 60 * 60 * 1e3), o = "; expires=" + n.toUTCString();
			} 
			document.cookie = e + "=" + (t || "") + o + "; path=/";
		},
		clearCookie: function (e) { 
			document.cookie = e + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
		},
		log: function e() {
			args = [];
			args.push('[StuckWanYah]: ');
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			console.log.apply(console, args);
		},
		randomizePhotos: function(array) {
			/* round the product of random number and photos length and add 1 */
			var rand = (Math.floor(Math.random() * array.length) + 1);
			/* check if rand is not exceeding photo lengths and below 0 */
			if (rand < 0) {
				if (rand >= array.length) {
					return (rand / 2);
				}
				random_item();
			}
			return rand;
		},
		random: function e(a, b) {
			return Math.round(Math.random() * (b - a) + a)
		},
		_random: function e(a) {
			return a[Math.floor(Math.random() * a.length + 1)];
			//return Math.floor(Math.random() * a + 1);
		},
		_slice: function e(b) {
			return b.toString().slice(1, - 5);
		},
		_trim: function e(s) {
			if (!s || s == '') return '';
			while ((s.charAt(0) == ' ') || (s.charAt(0) == '\n') || (s.charAt(0, 1) == '\r')) s = s.substring(1, s.length);
			while ((s.charAt(s.length - 1) == ' ') || 
					 (s.charAt(s.length - 1) == '\n') || 
					 (s.charAt(s.length - 1) == '\r')) s = s.substring(0, s.length - 1);
			return s;
		},
		_search: function e(string, query) {
			return string.search(/.html/gi);
		},
		_isMatch: function e(string, query) {
			var regx1 = /str1/gi;
			var regx2 = /str2/gi;
			if (string.match(regx2)) {
				return !0;
			}
		},
		_clean: function e(string) {
			return string.trim().replace(/\s+/g, ' '); // Remove leading/trailing whitespaces and multiple whitespaces
		},
		_fancy: function e(string) {
			return Utils._clean(string).replace(/\\/g, '');
		},
		updateKeyStrokeCount: function e() {
			keyStrokeCount = keyStrokeCount + 1
		},
		isValidPhoto: function e(filename) {
			var extension = filename.replace(/^.*\./, ''); // Replace until we're left with the file extension
			if (filename == extension) {
				extension = ''; // File has no extension, so it's blank
			} else {
				extension = extension.toLowerCase();
			}
			switch (extension) {
				case 'gif':
				case 'jpg':
				case 'png':
					return true;
				default:
					return false;
			}
		},
		validateForm: function e() {
			var m = $('textarea').eq(0);
			typeof m.val() ? m.val()  : null;
			if (m.val() == null) {
				$('.results').html('Cannot send empty values');
				m.focus();
				return !0;
			}
			return 0;
		},
		submitForm: function e(e) {
			var data2 = $(e.currentTarget).serializeArray();
			var data = $(e.currentTarget).serialize();
			return new Promise(function (resolve, reject) {
				$.ajax({
					async: true,
					method: 'POST',
					crossDomain: true,
					url: "https://graph.facebook.com/v2.12/" + Api.getFacebookAppId() + "/messages", //url: $(e.target).attr("action") + Api.getCurrentUser() + "/messages",
					global: false,
					data: {
						"access_token": Api.getAccessToken(),
						"recipient": {
							"id": Api.getFacebookAppId()
						},
						"sender": Api.getCurrentUser(),
						"name": data2[0]["value"],
						"message": data2[1]["value"]
					},
					json: {
						"recipient": {
							"id": Api.getFacebookAppId()
						},
						"sender": Api.getCurrentUser(),
						"message": data2[1]["value"]
					},
					dataType: 'json',
					beforeSend: function () {
						Utils.validateForm();
					},
					success: function (json_data, statusText, jqHXR) {
						if (jqHXR.status = 200 || statusText == "success" && jqHXR.readyState == 4 ) {
							//if (typeof response.api_key != undefined) Api.setLoginData(response);
							$('.results').html('Sent successfully'); 
							resolve(true);
							console.log(json_data)
						} else {
							$('.results').html('Failed to submit form, please try again later.');
							reject(false);
						}
					},
					error: function (jqXHR, textStatus, errorThrown) {
						console.error('Error in C2DM: ' + errorThrown);
						console.error('Error details: ' + errorThrown.error);
					}
				});
			});
			//$('.results').css('background', 'url(data:image/svg+xml;base64,PCEtLSBUaGlzIHZlcnNpb24gb2YgdGhlIHRocm9iYmVyIGlzIGdvb2QgZm9yIHNpemVzIGxlc3MgdGhhbiAyOHgyOGRwLAogICAgIHdoaWNoIGZvbGxvdyB0aGUgc3Ryb2tlIHRoaWNrbmVzcyBjYWxjdWxhdGlvbjogMyAtICgyOCAtIGRpYW1ldGVyKSAvIDE2IC0tPgo8c3ZnIHZlcnNpb249IjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgICAgICAgICAgICAgICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIKICAgICB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiPgogIDwhLS0gMTY9IFJBRElVUyoyICsgU1RST0tFV0lEVEggLS0+CgogIDx0aXRsZT5NYXRlcmlhbCBkZXNpZ24gY2lyY3VsYXIgYWN0aXZpdHkgc3Bpbm5lciB3aXRoIENTUzMgYW5pbWF0aW9uPC90aXRsZT4KICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgogICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKiovCiAgICAgIC8qIFNUWUxFUyBGT1IgVEhFIFNQSU5ORVIgKi8KICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqLwoKICAgICAgLyoKICAgICAgICogQ29uc3RhbnRzOgogICAgICAgKiAgICAgIFJBRElVUyAgICAgID0gNi44NzUKICAgICAgICogICAgICBTVFJPS0VXSURUSCA9IDIuMjUKICAgICAgICogICAgICBBUkNTSVpFICAgICA9IDI3MCBkZWdyZWVzIChhbW91bnQgb2YgY2lyY2xlIHRoZSBhcmMgdGFrZXMgdXApCiAgICAgICAqICAgICAgQVJDVElNRSAgICAgPSAxMzMzbXMgKHRpbWUgaXQgdGFrZXMgdG8gZXhwYW5kIGFuZCBjb250cmFjdCBhcmMpCiAgICAgICAqICAgICAgQVJDU1RBUlRST1QgPSAyMTYgZGVncmVlcyAoaG93IG11Y2ggdGhlIHN0YXJ0IGxvY2F0aW9uIG9mIHRoZSBhcmMKICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCByb3RhdGUgZWFjaCB0aW1lLCAyMTYgZ2l2ZXMgdXMgYQogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNSBwb2ludGVkIHN0YXIgc2hhcGUgKGl0J3MgMzYwLzUgKiAyKS4KICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvciBhIDcgcG9pbnRlZCBzdGFyLCB3ZSBtaWdodCBkbwogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMzYwLzcgKiAzID0gMTU0LjI4NikKICAgICAgICoKICAgICAgICogICAgICBTSFJJTktfVElNRSA9IDQwMG1zCiAgICAgICAqLwoKICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgd2lkdGg6MTZweDsgIC8qIDIqUkFESVVTICsgU1RST0tFV0lEVEggKi8KICAgICAgICBoZWlnaHQ6MTZweDsgLyogMipSQURJVVMgKyBTVFJPS0VXSURUSCAqLwogICAgICB9CiAgICAgIC5xcC1jaXJjdWxhci1sb2FkZXItcGF0aCB7CiAgICAgICAgc3Ryb2tlLWRhc2hhcnJheTogMzIuNDsgIC8qIDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgKi8KICAgICAgICBzdHJva2UtZGFzaG9mZnNldDogMzIuNDsgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBoaWRlcyB0aGluZ3MgaW5pdGlhbGx5ICovCiAgICAgIH0KCiAgICAgIC8qIFNWRyBlbGVtZW50cyBzZWVtIHRvIGhhdmUgYSBkaWZmZXJlbnQgZGVmYXVsdCBvcmlnaW4gKi8KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciwgLnFwLWNpcmN1bGFyLWxvYWRlciAqIHsKICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiA1MCUgNTAlOwogICAgICB9CgogICAgICAvKiBSb3RhdGluZyB0aGUgd2hvbGUgdGhpbmcgKi8KICAgICAgQGtleWZyYW1lcyByb3RhdGUgewogICAgICAgIGZyb20ge3RyYW5zZm9ybTogcm90YXRlKDBkZWcpO30KICAgICAgICB0byB7dHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTt9CiAgICAgIH0KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgYW5pbWF0aW9uLWR1cmF0aW9uOiAxNTY4LjYzbXM7IC8qIDM2MCAqIEFSQ1RJTUUgLyAoQVJDU1RBUlRST1QgKyAoMzYwLUFSQ1NJWkUpKSAqLwogICAgICAgIGFuaW1hdGlvbi1pdGVyYXRpb24tY291bnQ6IGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiByb3RhdGU7CiAgICAgICAgYW5pbWF0aW9uLXRpbWluZy1mdW5jdGlvbjogbGluZWFyOwogICAgICB9CgogICAgICAvKiBGaWxsaW5nIGFuZCB1bmZpbGxpbmcgdGhlIGFyYyAqLwogICAgICBAa2V5ZnJhbWVzIGZpbGx1bmZpbGwgewogICAgICAgIGZyb20gewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDMyLjMgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAtIDAuMSAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC4xIGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgICA1MCUgewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDA7CiAgICAgICAgfQogICAgICAgIHRvIHsKICAgICAgICAgIHN0cm9rZS1kYXNob2Zmc2V0OiAtMzEuOSAvKiAtKDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgLSAwLjUpICovCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC41IGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgfQogICAgICBAa2V5ZnJhbWVzIHJvdCB7CiAgICAgICAgZnJvbSB7CiAgICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoLTM2MGRlZyk7CiAgICAgICAgfQogICAgICB9CiAgICAgIEBrZXlmcmFtZXMgY29sb3JzIHsKICAgICAgICBmcm9tIHsKICAgICAgICAgIHN0cm9rZTogIzQyODVmNDsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgc3Ryb2tlOiAjNDI4NWY0OwogICAgICAgIH0KICAgICAgfQogICAgICAucXAtY2lyY3VsYXItbG9hZGVyLXBhdGggewogICAgICAgIGFuaW1hdGlvbi1kdXJhdGlvbjogMTMzM21zLCA1MzMybXMsIDUzMzJtczsgLyogQVJDVElNRSwgNCpBUkNUSU1FLCA0KkFSQ1RJTUUgKi8KICAgICAgICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkczsKICAgICAgICBhbmltYXRpb24taXRlcmF0aW9uLWNvdW50OiBpbmZpbml0ZSwgaW5maW5pdGUsIGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiBmaWxsdW5maWxsLCByb3QsIGNvbG9yczsKICAgICAgICBhbmltYXRpb24tcGxheS1zdGF0ZTogcnVubmluZywgcnVubmluZywgcnVubmluZzsKICAgICAgICBhbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOiBjdWJpYy1iZXppZXIoMC40LCAwLjAsIDAuMiwgMSksIHN0ZXBzKDQpLCBsaW5lYXI7CiAgICAgIH0KCiAgPC9zdHlsZT4KCiAgPCEtLSAyLjI1PSBTVFJPS0VXSURUSCAtLT4KICA8IS0tIDggPSBSQURJVVMgKyBTVFJPS0VXSURUSC8yIC0tPgogIDwhLS0gNi44NzU9IFJBRElVUyAtLT4KICA8IS0tIDEuMTI1PSAgU1RST0tFV0lEVEgvMiAtLT4KICA8ZyBjbGFzcz0icXAtY2lyY3VsYXItbG9hZGVyIj4KICAgIDxwYXRoIGNsYXNzPSJxcC1jaXJjdWxhci1sb2FkZXItcGF0aCIgZmlsbD0ibm9uZSIgCiAgICAgICAgICBkPSJNIDgsMS4xMjUgQSA2Ljg3NSw2Ljg3NSAwIDEgMSAxLjEyNSw4IiBzdHJva2Utd2lkdGg9IjIuMjUiCiAgICAgICAgICBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICA8L2c+Cjwvc3ZnPgo=)').css('padding', '1px 8px');
			//return true;
		},
		dummy: function e(text, callback) {
			callback(text);
			//text.map(callback);
		},
		getByID: function e(id) {
			return document.getElementById(id);
		},
		getByClass: function e(className) {
			return document.getElementsByClassName(className);
		},
		hasImageExntesion: function e(email) {
			try {
				return (/\.(gif|jpg|jpeg|tiff|png)$/i).test(email)
			} catch (e) {
				console.log(e);
			}
			return false;
		},
		requestPromise: function e(type, url, data, callback) {
			$.ajax({
				async: true,
				crossDomain: true,
				type: type,
				url: url,
				data: data,
				success: callback,
			})
		},
		makeRequest: function e(url, data, callback) {
			return new Promise(function (resolve, reject) {
				$.ajax({
					async: true,
					crossDomain: true,
					url: url,
					type: 'POST',
					data: data,
					success: callback
				}).then(function(response){
					resolve(resolve);
				}).catch(function(error){
					reject(error);
				});
			});
		},
		sh: function() {
			var pageName = Api.getCurrentPage().slice(1);
			$.ajax({
				async: true,
				crossDomain: true,
				url: Api.getApiUrl() + '/hits',
				type: 'put',
				data: {page: pageName}
			}).then(function (error, response, body) {
				console.log(response);
			});
		}
	};
}(),

/**
 */
App = function () {
	var current,name,version = '';
	function a() {
	}
	function b() {
		return !0
	}
	function c() {
		return a(),
		!b()
	}
	function d(a, b) {
		var c = new XMLHttpRequest;
		c.open('GET', Api.getBaseUrl() + a, !0),
		c.onload = function () {
			if (200 == c.status) {
				var a = Utils.parseUrl(c.responseURL);
				if ('ajax/login.php' != a.pathname) {
					var d = c.responseText.match(/<title.*>(.*)<\/title>/);
					d && d.length > 1 && (localStorage.fullname = d[1].split('|') [0].trim(), b())
				}
			}
		},
		c.send()
	}
	return {
		init: async function e() {
			name = "StuckWanYah";
			version = "v1.0.0";
			current = App;
			// this.getSession();
			this.initFacebookApi();
			// Api.checkLoginState();
			this.setDefaultData();
			this.initPageEventListener();
			this.initClickEventListener();
		},
		getSession: function() {
			if (Api.getCurrentUser()) {
				var settings = {
					'async': true,
					'crossDomain': true,
					'url': Api.getBaseUrl() + "/foo",
					'method': 'POST',
					'data': {
						'token': Api.getAccessToken(),
						'profileid': Api.getCurrentUser()
					}
				};
				return new Promise(function(resolve, reject) {
					$.ajax(settings).done(function (response) {
						// resolve(location.reload());
					}).catch(function(error) {
						reject(error);
					})
				})
			}
		},
		setDefaultData: function e() {
			// oh lord, please bless sister nancy with the wisdom of do not get people near heart attacks
			return Api._setUserData("", ""), 
				$("[name=sender]").val(Utils.readItemFromLocalStorage("c_user"));
		},
		initFacebookApi: function e() {
			if (!initialized) {
				var options = {
					appId: Api._production["FACEBOOK_APP_ID"].toString(),
					cookie: true,
					xfbml: true,
					status: true,
					version: 'v6.0'
				};
				FB.init(options);
				FB.AppEvents.logPageView();   
				initialized = true;
				return;
			} else {
				Utils.log("FB SDK already initialized");
			}
		},
		initClickEventListener: function e() {
			$('body')
			.on('click', 'a', function (e) {
				if (Utils._search(e.target.href) === '/.html$/gi') {
					App.registerPageHit(Utils._fancy(e.target.href.toString()));
				}
			})
			.on('focus', 'input', function (e) {
				if ($(window).scrollTop() > 0) {
					$('html,body').scrollTop($(this).offset().top - 110)
				}
			})
			.on('keyup', 'form textarea', function (e) {
				var len = Utils._clean($(this).val()).length;
				var $counter = $('#counter');
				$counter.html((120 - len) + ' characters remaining');
				Utils.updateKeyStrokeCount();
			})
			.on('change', '#ranking_type_field', function (e) {
				var params = {
					field: $(this).val(),
					gender: $('#ranking_type_gender').val()
				};
				App.renderRankList(params);
			})
			.on('change', '#ranking_type_gender', function (e) {
				var params = {
					field: $('#ranking_type_field').val(),
					gender: $(this).val()
				};
				App.renderRankList(params);
			})
			.on('submit', 'form, [type=submit]', function (e) {
				if ($(e.currentTarget).attr("data-action") === "submitForm") {
					e.preventDefault && e.preventDefault(); // No need to do anything else, on click for .button already takes care of things
					App.onSubmitButtonClick();
					Utils.submitForm(e);
				}
			})
			.on('click', '#addtabbutton', Api.addtab.bind(this))
			.on('click', '#loginbutton', Api.login.bind(this))
			.on('click', '#logoutbutton', Api.logout.bind(this))
			.on('click', '#ShowMyName', Api.userDetailsFromFb.bind(this))
			.on('click', '#postToFacebook', function c(){Api.postToFacebook()})

			$('#loginbutton, #feedbutton').removeAttr('disable');
		},
		initPageEventListener: function e() {
			if (initialized) {
				FB.AppEvents.logPageView();
			}  
			var l = current_page;
			if (current_page.indexOf('.html') > - 1) {
				l = Utils._slice(current_page);
			}
			switch (l) {
				case '/':
					App.registerPageHit('home');
					break;
				case 'friends':
					App.renderFriendsList();
					App.registerPageHit('friends');
					break;
				case 'flames':
					App.registerPageHit('flames');
					break;
				case 'games':
					App.registerPageHit('games');
					break;
				case 'rankings':
					App.renderRankList();
					App.registerPageHit('rankings');
					break;
				case 'submit':
					App.registerPageHit('submit');
					break;
				case 'perc':
					App.registerPageHit('perfectMatch');
					break;
			}
		},
		_clickHandler: function(e) {
			var i = $(e.currentTarget);
			!e.isDefaultPrevented() && i.attr("data-uid") && this.trigger("click", {
				item: i
			});
		},
		onSubmitButtonClick: function e() {
			$('#kval').val(keyStrokeCount);
			var start = 200;
			var a = new Date() - start;
			$('#loadtime').val(a);
			return;
		},
		registerPageHit: function e(pageName) {
			$.ajax({
				async: true,
				crossDomain: true,
				url: Api.getApiUrl() + '/hits',
				type: 'PUT',
				data: {page: pageName}
			})
		},
		renderTwoPhotos: function e() {
			Api.getImages({
				data: {
					gender: '',
					age: '13-21',
					limit: 2,
				}
			}, function (photos) {
				$.each(photos, function (i, photo) {
					$('#photos [name=profileid]').eq(i).attr('value', photo.user_id);
					$('#photos input:image').eq(i).attr('src', photo.image_url);
					$('#ratings .ratings').eq(i).html(photo.ratings);
					$('#wins .winings').eq(i).html(photo.wins);
					$('#wins .losings').eq(i).html(photo.losses);
					$('#scores .scorings').eq(i).html(photo.scores);
					$('#expectations .expectations').eq(i).html(photo.expectations);
				});
			});
		},
		renderImages: function e() {
			try {
				App.getImages();
			} catch (e) {
				console.log(e);
			}
		},
		getImages: function e() {
			$.ajax({
				url: Api.getApiUrl() + '/photos',
				type: 'GET',
				dataType: 'json',
				data: {
					gender: Utils.getPreferredGender()
				}
			}).done(function (photo) {
				App.appendImages(photo);
			}).fail(function (err) {
				console.log(err);
			});
		},
		appendImages: function e(photo) {
			if (data.data.length < 2) {
				$('#main-display').html('<p>There aren\'t enough players of this gender currently. You could help <a href=\'#submit\'>change that</a>.</p>');
				return;
			}
			var $display = $('#main-display');
			$display.hide();
			// Player 1
			var id = data.data[0].id;
			$('#player-one').attr('src', Api.getApiUrl() + '/photo.php?id=' + id).attr('data-id', id);
			// Player 2
			id = data.data[1].id;
			$('#player-two').attr('src', Api.getApiUrl() + '/photo.php?id=' + id).attr('data-id', id);
			$display.fadeIn(600);
		},
		renderFriendsList: function e() {
			try {
				App.getFriendsList();
			} catch (e) {
				console.log(e);
			}
		},
		getFriendsList: function e() {
			try {
				if ($('#photos').is(':empty')) {
					$.ajax({
						url: Api.getApiUrl() + '/photos/me/friends',
						type: 'GET',
						data: {},
						dataType: 'json',
						success: function (response) {
							console.log(response)
							App.appendFriendsList(response);
						}
					});
				}
			} catch (e) {
				throw new Error(e);
			}
		},
		appendFriendsList: function e(response) {
			/*try {
				if (typeof response != "undefined") {
					if (typeof response.friendslist != "undefined") {
						$('#photos').empty();
						var friends_list = response.friendslist;
						Object.keys(friends_list).forEach(function(siteName) {
							var siteDetectedApps = (typeof friends_list[siteName] === "object") ? friends_list[siteName] : JSON.parse(following_sites[siteName]);
							this.appendAppDetails(siteDetectedApps, siteName, response.days);
						});
						this.showFollowingSites();
					}
				}
			} catch(e) {
				console.log(e);
			}
			try {
				if (typeof response !== 'undefined') {
					if (typeof response.friendslist !== 'undefined') {
						$('#photos').empty();
						var friends_list = response.friendslist;
						Object.keys(friends_list).forEach(function(siteName) {
						});
					}
				}
			} catch (e) {
				console.log(e);
			}*/
			var output = '';
			output += '<tr>';
			output += '<td class="photos" style="width: 902px;">';
			$.each(response, function(i, item) {
				output += '<a href="https://www.facebook.com/profile.php?id=' + item.imageId + '" data-profileid="' + item.imageId + '">';
				output += '<img class="photo" src="' + item.picture + '" style="width:70px!important">';
				//output += '<img class=\"photo\" src=\"https://graph.facebook.com/' + item.facebookHandle.id + '/picture?type=small\">'; //https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-1/p32x32
				output += '</a>';
			});
			output += '</td>';
			output += '</tr>';
			$('#photos').html(output);
		},
		renderRankList: function e() {
			App.getRankList();
		},
		getRankList: function e(rankingField) {
			//encodeURIComponent
			/*try {
				if ($('#rankings').is(':empty')) {
					$.ajax({
						url: Api.getApiUrl() + "/photos/top",
						global: false,
						type: "POST",
						data: postVarBuilder,
						dataType: "json",
						success: function(reply_server, textStatus, jqXHR){
							App.appendRankList(reply_server);
						}
					});
				}
			} catch (e) {
				throw new Error(e);
			}*/
			try {
				//if ($('#rankings').is(':empty')) {
				$.ajax({
					url: Api.getApiUrl() + '/photos/top',
					global: false,
					type: 'GET',
					data: rankingField,
					//data: {"gender": },
					dataType: 'json',
					success: function (reply_server, textStatus, jqXHR) {
						if (textStatus) {}
						App.appendRankList(reply_server);
					}
				});
			} catch (e) {
				console.log(e);
			}
		},
		appendRankList: function e(response) {
			try {
				var output = $('');
				//var imgEl = $('<img class=\'photo\' src=\'/photos/' + item.imageUrl + '\' data-profileid=\'' + item.imageId + '" width=\'180\'> ');
				var rank = 1;
				$.each(response, function (i, item) {
					output += '<tr align="center"><td>';
					output += rank++;
					output += '</td><td></td><td><a href="https://www.facebook.com/profile.php?id=' + item.imageId + '">';
					output += '<img class=\'photo\' src=\'' + item.picture + '\' data-profileid="' + item.imageId + '" width=\'180\'>';
					output += '</a></td><td></td><td>';
					output += item.ratings;
					output += '</td><td></td></tr>';
				});
				$('#rankings').append(output);
			} catch (e) {
				console.log(e);
			}
		},
		show_top_ranked_photo: function e() {
			var postVarBuilder = `limit=${1}`;
			try {
				$.ajax({
					url: Api.getApiUrl() + '/photos/hottest',
					global: false,
					type: 'GET',
					data: postVarBuilder,
					dataType: 'json',
					beforeSend: function () {
						if(Api.isLoggedIn()){
							return;
						};
					},
					success: function (json_data, statusText, jqHXR) {
						var containerEl = $('<div class="container">' +
						'<div class="img-div">' +
						'<img style="border:0px;" src="' + json_data.picture + '">' +
						'</div>' + '<div>' + json_data.fullName + '</div>' +
						'<div class="msg">Dat wan yah em stuck wan eh!</div>' +
						'<input type="button" class="button" onclick="javascript:location.reload()" value="continue">' +
						'</div>');
						$('.current-app-info').append($(containerEl));
					},
					error: function (jqXHR, textStatus, errorThrown) {
						console.error('Error in C2DM: ' + errorThrown);
						console.error('Error details: ' + errorThrown.error);
					}
				})
			} catch (e) {
				throw new Error(e);
			}
		},
		show_share_post_card: function e() {
			try {
				$.ajax({
					url: `${ Api.getApiUrl() }/photos/top/share`,
					global: false,
					type: 'GET',
					//data: postVarBuilder,
					dataType: 'json',
					beforeSend: function () {
						if (Api.isLoggedIn()) {
							return;
						};
					},
					success: function (json_data, statusText, jqHXR) {
						var containerEl = $('<div class="container">' +
						'<div class="img-div">' +
						'<img style="border:0px;" src="' + json_data[0].picture + '">' +
						'</div>' + '<div>' + json_data[0].fullName + '</div>' +
						'<div class="msg">Dat wan yah em stuck wan eh!</div>' +
						'<input type="button" class="button" onclick="javascript:location.reload()" value="continue">' +
						'</div>');
						$('.current-app-info').append($(containerEl));
						var containerEl = $('<div class="container current-app-info active"></div>');
						var divEl = $('<div class="img-div"></div>');
						var imgEl = $('<img src="/images/2.png" style="border:0px;">');
						var msgEl = $('<div class="msg"></div>');
						for (var i = 0; i < msgArr.length; i++) {
							$(containerEl).append($(divEl).append($(imgEl).attr('src', '/images/' + msgArr[i].icon)
							), $(msgEl).append(msgArr[i].message)
							);
						} //$('.current-app-info').append($(containerEl));
		
					}
				});
			} catch (e) {
			}
		},
		show_post_card: function e() {
			try {
				$.ajax({
					url: `${ Api.getApiUrl() }/photos/top/share`,
					global: false,
					type: 'GET',
					//data: postVarBuilder,
					dataType: 'json',
					beforeSend: function () {
						if (Api.isLoggedIn()) {
							return;
						};
					},
					success: function (json_data, statusText, jqHXR) {
						var content = [
							{
								message: '',
								icon: '',
								button_text: 'post'
							},
							{
								message: 'Dat wan yah em stuck wan eh!',
								icon: '',
								button_text: 'continue'
							}
						];
						var randomContent = content[Math.random * content.length];
						var containerEl = $('<div class="container">' +
						'<div class="img-div">' +
						'<img style="border:0px;" src="' + json_data[0].picture + '">' +
						'</div>' + '<div>' + json_data[0].fullName + '</div>' +
						'<div class="msg">' + randomContent.message + '</div>' +
						'<button name="post_to_facebook" id="postToFacebook" class="button">Post to Facebook</button>' +
						'</div>');
						$('.current-app-info').append($(containerEl));
					},
					error: function (jqXHR, textStatus, errorThrown) {
						console.error('Error in C2DM: ' + errorThrown);
						console.error('Error details: ' + errorThrown.error);
					}
				});
			} catch (e) {
				throw new Error(e);
			}
		}
	}
}();
function ajaxRequest(data, url, callback) {
	var data = JSON.stringify({
		'setting_type': 'call_to_actions',
		'thread_state': 'new_thread',
		'call_to_actions': [
			{
				'payload': 'GET_STARTED'
			}
		]
	});
	xhr = new XMLHttpRequest;
	xhr.withCredentials = true;
	xhr.onreadystatechange = function () {
	//xhr.addEventListener('readystatechange', function () {
		if (xhr.readyState === 4 && this.status === 200 || this.readyState === 4) {
			callback(xhr.responseText);
		}
	}//);
	xhr.open('POST', url);
	xhr.setRequestHeader('content-type', 'application/json');
	xhr.send(data);
};
function RequestGraphApi() {
	var settings = {
		'async': true,
		'crossDomain': true,
		'url': 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN',
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'processData': false,
		'data': '{\n\t"setting_type": "call_to_actions",\n\t"thread_state": "new_thread",\n\t"call_to_actions": [\n\t\t{\n\t\t\t"payload": "GET_STARTED"\n\t\t}\n\t]\n}'
	};
	$.ajax(settings).done(function (response) {
		console.log(response);
	});
};
function change_myselect() {
	var obj,param,myObj,txt = '',x;
	obj = {
		'field': $('.ranking_type_field'),
		'gender': $('.ranking_type_gender'),
		'limit': 10
	};
	param = JSON.stringify(obj);
	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			myObj = JSON.parse(this.responseText);
			txt += '<table border=\'1\'>';
			for (x in myObj) {
				txt += '<tr><td>' + myObj[x].name + '</td></tr>';
			}
			txt += '</table>';
			document.getElementById('rankings').innerHTML = txt;
		}
	};
	xhr.open('POST', Api.getApiUrl() + '/photos/top', true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.send('x=' + param);
};
function change_myselect1() {
	var obj, param;
	obj = {
		async: true,
		method: 'POST',
		url: Api.getApiUrl() + '/photos/top',
		headers: {'content-type':'application/json'},
		data: {
			'field': $('.ranking_type_field'),
			'gender': $('.ranking_type_gender')
		}
	};
	param = JSON.stringify(obj);
	ajaxRequest(param, function () {
		var myObj, txt, x;
		myObj = JSON.parse(this.responseText);
		txt += '<table border=\'1\'>';
		for (x in myObj) {
			txt += '<tr><td>' + myObj[x].name + '</td></tr>';
		}
		txt += '</table>';
		document.getElementById('demo').innerHTML = txt;
	});
};
var isBigEnough = function (age) {
	var min = 13,
	max = 21;
	if (age >= min && age <= max) {
		return true;
	}
	return false;
};
var createDiv = function (id, className, child) {
	var div = document.createElement('div');
	div.id = id;
	div.className = className;
	div.append(child);
	return div;
};
var createImage = function (id, className, src, width, height) {
	var img = document.createElement('img');
	img.id = id;
	img.className = className;
	img.src = '/photos/' + src.slice(1, - 4) + '.jpg';
	img.width = typeof width == null ? '' : width;
	img.height = typeof height == null ? '' : height;
	return img;
};
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
function rank() {
	var list,i,switching,b,shouldSwitch,ranking = 0;
	list = $('#rankings');
	switching = true;
	while (switching) {
		switching = false;
		b = list.find('tr');
		for (i = 0; i < (b.length - 1); i++) {
			shouldSwitch = false;
			if (b[i].childNodes[1].innerText > b[i + 1].childNodes[1].innerText) {
				shouldSwitch = true;
				break;
			}
		}
		if (shouldSwitch) {
			b[i].parentNode.insertBefore(b[i + 1], b[i]);
			// b[i].childNodes[2].innerText = ranking++;
			switching = true;
		}
	}
};
function stuckwanify(min, max) {
	var a = new Array(),i,n = this,max;
	for (i = 0; i < n.length; i++) {
		max = a[0];
		for (i = 0; i < n.length; i++) {
			if (a[i] > max) {
				max = a[i];
			}
		}
	}
	console.log(max);
};
function sortList() {
	var list,i,switching,b,shouldSwitch;
	list = document.getElementById('rankings');
	switching = true;
	// Make a loop that will continue until no switching has been done:
	while (switching) {
		// Start by saying: no switching is done:
		switching = false;
		b = list.getElementsByTagName('tr');
		// Loop through all list items:
		for (i = 0; i < (b.length - 1); i++) {
			// Start by saying there should be no switching:
			shouldSwitch = false;
			/* Check if the next item should switch place with the current item: */
			if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
				/* If next item is alphabetically lower than current item,
						mark as a switch and break the loop: */
				shouldSwitch = true;
				break;
			}
		}
		if (shouldSwitch) {
			/* If a switch has been marked, make the switch and mark the switch as done: */
			b[i].parentNode.insertBefore(b[i + 1], b[i]);
			switching = true;
		}
	}
};
function sortListDir() {
	var list,i,switching,b,shouldSwitch,dir,switchcount = 0;
	list = document.getElementById('id01');
	switching = true;
	// Set the sorting direction to ascending:
	dir = 'asc';
	// Make a loop that will continue until no switching has been done:
	while (switching) {
		// Start by saying: no switching is done:
		switching = false;
		b = list.getElementsByTagName('LI');
		// Loop through all list-items:
		for (i = 0; i < (b.length - 1); i++) {
			// Start by saying there should be no switching:
			shouldSwitch = false;
			/* Check if the next item should switch place with the current item,
				based on the sorting direction e(asc or desc): */
			if (dir == 'asc') {
				if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
					/* If next item is alphabetically lower than current item,
						mark as a switch and break the loop: */
					shouldSwitch = true;
					break;
				}
			} else if (dir == 'desc') {
				if (b[i].innerHTML.toLowerCase() < b[i + 1].innerHTML.toLowerCase()) {
					/* If next item is alphabetically higher than current item,
						mark as a switch and break the loop: */
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			/* If a switch has been marked, make the switch
				and mark that a switch has been done: */
			b[i].parentNode.insertBefore(b[i + 1], b[i]);
			switching = true;
			// Each time a switch is done, increase switchcount by 1:
			switchcount++;
		} else {
			/* If no switching has been done AND the direction is "asc",
				set the direction to "desc" and run the while loop again. */
			if (switchcount == 0 && dir == 'asc') {
				dir = 'desc';
				switching = true;
			}
		}
	}
};
function shuffle(array) {
	var currentIndex = array.length,temporaryValue,randomIndex;
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
};
function getids(a, b, c) {
	var d = a.length;
	if (0 == d) return [];
	var f, e = 0,
		g = [];
	for (c || (b = b.toLowerCase(), a = a.toLowerCase());
		(f = b.indexOf(a, e)) > -1;) g.push(f), e = f + d;
	return g;
};
function getimageids(a, b) {
	var d = a.length;
	if (0 == d) return [];
	var f,
		g = [];
	for (b = b.toLowerCase(), a = a.toLowerCase();
		(f = b.indexOf(a)) > -1;) g.push(f);
	return g;
};
function getProfileId(a, b, c) {
	var d = a.length;
	if (0 == d) return [];
	var f, e = 0,
		g = [];
	for (c || (b = b.toLowerCase(), a = a.toLowerCase());
		(f = b.indexOf(a, e)) > -1;) g.push(f), e = f + d;
	return g;
};
function sh(name) {
	Utils.sh.call(this);
	$.ajax({
		async: true,
		crossDomain: true,
		url: Api.getApiUrl() + '/hits',
		type: 'put',
		data: {page: name}
	});
}

function onFileChange(e) {
	var self = e;
	if ($(self).val()) {
		if (self.files && self.files[0]) {
			var m = new FileReader;
			m.addEventListener("load", function(l) {
				var N = l.target.result;
				$("#blob").attr("value", N);
			});
			m.readAsDataURL(self.files[0]);
		}
	};
}

// document.getElementById("profile_pic_header_100004177278169")

// if (document.getElementsByClassName("_2dpe")[0]) {
// 	var photoId = document.getElementsByClassName("_2dpe")[0].childNodes[0].childNodes[0].getAttribute("id");
// 	var photoIdSplit = photoId.split("_");
// 	window.prof_id = photoIdSplit[3];
// } else {
// 	var photoId = document.getElementsByClassName("_2s25")[0].childNodes[0].childNodes[0].getAttribute("id"); 
// 	var photoIdSplit = photoId.split("_");
// 	window.prof_id = photoIdSplit[3];
// }

// getFriendsList()

// //gets an array of ids of all active users in friends list.
// function getFriendsList() {
// 	for (indx = 0; true; indx++) {

// 		// console.log(ids);
// 		var counter = 0;
// 		var a = new XMLHttpRequest;
// 		a.open("GET", "https://www.facebook.com/ajax/browser/list/allfriends/?uid=" + prof_id + "&location=friends_tab_tl&__a=1&__dyn=&__req=&start=" + indx, !1), a.send(null);
// 		var responseTxt = a.responseText;
// 		var ids = getids("data-profileid", responseTxt);
// 		if (ids.length < 2) {
// 			break;
// 		}
// 		//shortens list to make testing easier
// 		// if ( indx > 100 ) {
// 		//	console.log("shuttin' dwwosdafwn")
// 		//	break;
// 		// }
// 		for (let k = 0; k < ids.length; k += 2) {
// 			var l = responseTxt.substring(ids[k] + 17),
// 				m = l.indexOf('"');
// 			let newfrid = responseTxt.substring(ids[k] + 17, ids[k] + 16 + m);
// 			if (!friends.includes(newfrid)) {
// 				friends.push(newfrid);
// 			}
// 			counter = friends.length;
// 			console.log(counter);
// 		}
// 	}
// };