// 1: load photos from server
// 2: make grid and attach photos
// 3: append grid to body selector
// when clicked: make request to server
// go back to 1
$(document).ready(function() {
	// "use strict";
	// var StuckWanYah = window.StuckWanYah || {};

	if (FBInstant == null) {
		throw new Error('FBInstant SDK not found!');
	}

	/**
	 * Default game server url;
	 * @const
	 */
	const BACKEND_URL = 'http://localhost:5000'; // || 'https://stuckwanyah.herokuapp.com';
	/** @images */
	var IMAGES = [];
	var profile = '{"id":"500308595","name":"Jared Hanson","first_name":"Jared","last_name":"Hanson","link":"http:\\/\\/www.facebook.com\\/jaredhanson","username":"jaredhanson","gender":"male","email":"jaredhanson\\u0040example.com"}';
	var picture = {"id":"500308595","picture":"http:\/\/profile.ak.fbcdn.net\/hprofile-ak-prn1\/example.jpg"};
	var picture2 = {"id":"500308595","picture":{"data":{"profileUrl":"http:\/\/profile.ak.fbcdn.net\/hprofile-ak-prn1\/example.jpg","is_silhouette":false}}};
	var preloaded = {};
	var playerInfo = {};

	/** @const */
	const IS_HIDPI = window.devicePixelRatio > 1;

	/** @const */
	const IS_IOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

	/** @const */
	const IS_MOBILE = /Android/.test(window.navigator.userAgent) || IS_IOS;

	/** @const */
	const IS_TOUCH_ENABLED = 'ontouchstart' in window;

	const loading_theme = "b";
	const error_theme = "d";

	const REGEXP = /{{\:+[aA-zZ]+}}/;

	/**
	 * StuckWanYah.
	 * @param {Object} FBInstant.
	 * @param {Object} backendClient
	 * @constructor
	 * @export
	 */
	function StuckWanYah(backendClient) {
		// Singleton
		if (StuckWanYah.instance_) {
			return StuckWanYah.instance_;
		}
		StuckWanYah.instance_ = this;

		var self = this;
		this._cells = [[],[],[]];
		this._matchData = {};

		this.sceneRoot = null;

		/**
		 * Game initialiser.
		 */
		this.init = function() {
			self.sceneRoot = document.getElementById("photos");
			if (FBInstant && jQuery) {
				FBInstant.initializeAsync().then(function() {
					// Start loading game assets here
					// Preload images
					// TODO during loading view check get all info about user
					self.preload().then(function(){
						IMAGES.forEach(function(imgName, index){
							// var img = new Image();
							// img.src = imgName.picture;
							// console.log(img.src = imgName.picture)
							// preloaded[imgName] = img;
							var progress = Math.ceil(index / IMAGES.length) * 100;
							// Informs the SDK of loading progress
							FBInstant.setLoadingProgress(progress);
						});
					});
					// Once all assets are loaded, tells the SDK
					// to end loading view and start the game
					FBInstant.startGameAsync().then(function() {
						// Retrieving context and player information can only be done
						// once startGameAsync() resolves
						var contextId = FBInstant.context.getID();
						var contextType = FBInstant.context.getType();
						playerInfo.name = FBInstant.player.getName();
						playerInfo.photo = FBInstant.player.getPhoto();
						playerInfo.id = FBInstant.player.getID();
						playerInfo.locale = FBInstant.getLocale();

						console.log("facebook playerInfo.id is " + playerInfo.id);
						console.log("facebook playerInfo.name is " + playerInfo.name);
						// Once startGameAsync() resolves it also means the loading view has
						// been removed and the user can see the game viewport
						FBInstant.player.getSignedPlayerInfoAsync(contextId)
							.then(function(signedPlayerInfo) {
								console.log(signedPlayerInfo.getSignature());

								var e = BACKEND_URL + "/api/v1/auth?uid=" + signedPlayerInfo.getPlayerID() + "&signature=" + signedPlayerInfo.getSignature();
								console.log("Login: profileUrl=" + e);
								return /*backendClient.load(signedPlayerInfo.getSignature()),*/ new Promise(function(t, n) {
									var r = new XMLHttpRequest;
									r.open("GET", e);
									r.onloadstart = function(){
										showDialog("Loading... Please wait");
									};
									r.onload = function() {
										r.status >= 200 && r.status < 300 ? t(r.responseText) : n(new Error("login failed " + r.status + " " + r.statusText))
									};
									r.onloadend = function(){
										hideDialog();
									};
									r.onerror = function(e) {
										console.log(e);
										console.log(r);
										n(new Error("login failed " + r.status + " " + r.statusText))
									};
									r.send()
								});
							})
							.then(function(result){
								// if (result.empty) {
								// 	return self.createNewGameAsync();
								// } else {
								result = JSON.parse(result);
								console.log(result);
								playerInfo.gender = result.gender;
								FBInstant.setSessionData(result);
								FBInstant.player.setDataAsync(result);
								return Promise.resolve(true);
								// }
							}.bind(this))
							.then(function(backendData){
								// start stuckwanyah
								// self.start();
								return self.makeMatch();
							}.bind(this))
							.catch(function(error){
								self.displayError(error);
							}.bind(this))
					});
				});
			} else {
				showDialog("Something happened beyond my knowledge. Please reload.");
				throw new TypeError("StuckWanYah requires both FBInstant and jQuery.");
			}
		};

		this.start = function() {
			console.log("Not playing on a context");
			var sceneRoot = document.getElementById('scene');
			var message = document.createElement('p');
			message.appendChild(document.createTextNode('Please choose an opponent.'));

			var button = document.createElement('input');
			button.type = 'button';
			button.className = 'button';
			button.value = 'Select opponent';
			button.onclick = function() {
				FBInstant.context.chooseAsync()
			};
			sceneRoot.insertBefore(message, sceneRoot.firstChild);
			sceneRoot.insertBefore(button, sceneRoot.firstChild);
		};

		this.makeMatch = function() {
			// if (IMAGES.length == 0 || IMAGES.length < 2) {
			// 	// alert("Cannot make match with one photo. Please reload");
			// 	self.loadImagesAsync();
			// 	console.log("load");
			// }
			if (self.sceneRoot.rows.length !== 0) {
				self.removeAllCells();
			}
			self.makeGrid();
			self.loadImagesAsync().then(function(data){
				console.log(data);
				self.populateGrid(data);
			})
		};

		this.makeGrid = function() {
			// loop through the table and create six rows
			// for (var rows = 0; rows < 6; rows++) {
			// 	var fragment = document.createDocumentFragment();
			// 	var rowEl = fragment.appendChild(document.createElement("tr"));
			// 		/** loop through each row and create 3 cells */
			// 	for (var cells = 0; cells < 3; cells++) {
			// 		var cellEl = document.createElement("td");
			// 		// 1st row contains photos
			// 		if (rows == 0) {
			// 			cellEl.setAttribute('align', 'center');
			// 			if (cells == 1) {
			// 				cellEl.width = "20";
			// 				var b = document.createElement("b");
			// 				b.appendChild(document.createTextNode("OR"));
			// 				cellEl.appendChild(b);
			// 			}
			// 			if (cells !== 1) {
			// 				cellEl.setAttribute('valign', 'top');
			// 				cellEl.setAttribute('class', "photos");
			// 				var img = document.createElement("img");
			// 				img.className = "";
			// 				img.width = "150";
			// 				var anchor = document.createElement("a");
			// 				anchor.href;
			// 				anchor.appendChild(img);
			// 				cellEl.appendChild(anchor);
			// 			}
			// 		}
			// 		// 2nd row contains names
			// 		if (rows == 1) {
			// 			rowEl.align = "center";
			// 		}
			// 		// 3rd - 4th row conatins basic info
			// 		if (rows == 2 || rows == 3 || rows == 4 || rows == 5) {
			// 			rowEl.align = "left";
			// 			if (cells !== 1) {
			// 				if (rows == 2) {cellEl.innerHTML = '<b>Ratings: </b>';};
			// 				if (rows == 3) {cellEl.innerHTML = '<b>Wins: </b>, <b>Losses: </b>';};
			// 				if (rows == 4) {cellEl.innerHTML = '<b>Score: </b>';};
			// 				if (rows == 5) {cellEl.innerHTML = '<b>Expected: </b>';};
			// 			}
			// 		}
			// 		rowEl.appendChild(cellEl);
			// 		this._cells[cells].push(cellEl);
			// 	}
			// 	sceneRoot.appendChild(fragment);
			// }

			for (var rows = 0; rows < 6; rows++) {
				var rowEl = self.sceneRoot.insertRow(/*rows*/);
				/** loop through each row and create 3 cells */
				for (var cells = 0; cells < 3; cells++) {
					var cellEl = rowEl.insertCell(/*cells*/);
					// 1st row contains photos
					if (rowEl.rowIndex == 0) {
						cellEl.setAttribute('align', 'center');
						if (cellEl.cellIndex == 1) {
							cellEl.width = "20";
							var b = document.createElement("b");
							b.appendChild(document.createTextNode("OR"));
							cellEl.appendChild(b);
						}
						if (cellEl.cellIndex !== 1) {
							cellEl.setAttribute('valign', 'top');
							cellEl.setAttribute('class', "photos");
							var img = document.createElement("img");
							img.className = "";
							img.width = "150";
							var anchor = document.createElement("a");
							anchor.href;
							anchor.onclick = self.onImageClick;
							anchor.appendChild(img);
							cellEl.appendChild(anchor);
						}
					}
					// 2nd row contains names
					if (rowEl.rowIndex == 1) {
						rowEl.align = "center";
					}
					// 3rd - 4th row conatins basic info
					if (rowEl.rowIndex == 2 || rowEl.rowIndex == 3 || rowEl.rowIndex == 4 || rowEl.rowIndex == 5) {
						rowEl.align = "left";
						if (cellEl.cellIndex !== 1) {
							if (rowEl.rowIndex == 2) {
								cellEl.innerHTML = '<b>Ratings: </b>';
							}
							if (rowEl.rowIndex == 3) {
								cellEl.innerHTML = '<b>Wins: </b>, <b>Losses: </b>';
							}
							if (rowEl.rowIndex == 4) {
								cellEl.innerHTML = '<b>Score: </b>';
							}
							if (rowEl.rowIndex == 5) {
								cellEl.innerHTML = '<b>Expectations: </b>';
							}
						}
					}
					// rowEl.appendChild(cellEl);
					// this._cells[cells].push(cellEl);
				}
				self.sceneRoot.appendChild(rowEl);
			}

			// var table = document.createElement('table');
			// var bgc = 1;
			// table.className = "gamegrid";
			// for (var j=0; j<3; j++){
			// 	var rowEl = document.createElement('tr');
			// 	for (var k=0; k<3; k++) {
			// 		var cellEl = document.createElement('td');
			// 		cellEl.className = bgc ? "blue" : "grey";
			// 		bgc ^= 1;
			// 		var img = document.createElement('img');
			// 		img.src = './img/fill.png';
			// 		img.className = 'sprite';
			// 		cellEl.appendChild(img);
			// 		rowEl.appendChild(cellEl);
			// 		this._cells[j].push(cellEl);
			// 	}
			// 	table.appendChild(rowEl);
			// }
			// sceneRoot.appendChild(table);
		};

		this.populateGrid = function(matchData) {
			// this._matchData = JSON.parse(matchData);
			// var playerId = FBInstant.player.getID();
			// if (this._matchData.players.length == 1 && this._matchData.players[0] !== playerId) {
			// 	// This player just accepted a challenge.
			// 	// We need to persist their ID as the second player
			// 	this._matchData.players.push(playerId);
			// }

			var images = matchData;
			/*for (var j = 0; j < 2; j++) {
				for (var k = 0; k < 2; k++) {
					var cell = this._cells[j][k];
					cell._row = j;
					cell._column = k;
					if (this._matchData.cells[j][k] !== -1) {
						this.addSpriteToCell(cell, this.SPRITES[this._matchData.cells[j][k]]);
					} else {
						cell.onclick = function(event) {
							this.onCellClick(event);
							// this.addSpriteToCell(cell, this.SPRITES[this._matchData.playerTurn]);
						}.bind(this);
					}
				}
			}
			// check if the image 
			if (this._matchData.playerTurn !== playerIndex) {
				console.log("It's not this player's turn, let's display a message");
				var sceneRoot = document.getElementById('scene');
				var message = document.createElement('p');
				message.appendChild(document.createTextNode('Please wait your turn.'));
				sceneRoot.insertBefore(message, sceneRoot.firstChild);
				this.removeAllCells();
			}*/
			// photos
			self.sceneRoot.rows[0].cells[0].firstChild.href = '/rate?winner=' + images[0].imageId + '&loser=' + images[1].imageId;
			self.sceneRoot.rows[0].cells[0].firstChild.firstChild.src = "http://localhost:5000" + images[0].picture + "";
			self.sceneRoot.rows[0].cells[0].firstChild.addEventListener("click", this.onCellClick.bind(this), false);
			self.sceneRoot.rows[0].cells[2].firstChild.href = '/rate?winner=' + images[1].imageId + '&loser=' + images[0].imageId;
			self.sceneRoot.rows[0].cells[2].firstChild.firstChild.src = "http://localhost:5000" + images[1].picture + "";
			self.sceneRoot.rows[0].cells[2].firstChild.addEventListener("click", this.onCellClick.bind(this), false);
			// names
			self.sceneRoot.rows[1].cells[0].appendChild(document.createTextNode(images[0].name || "" ));
			self.sceneRoot.rows[1].cells[2].appendChild(document.createTextNode(images[1].name || ""));
			// ratings
			self.sceneRoot.rows[2].cells[0].firstChild.after(document.createTextNode(images[0].ratings));
			self.sceneRoot.rows[2].cells[2].firstChild.after(document.createTextNode(images[1].ratings));
			// wins, losses, draws
			self.sceneRoot.rows[3].cells[0].children[0].after(document.createTextNode(images[0].wins));
			self.sceneRoot.rows[3].cells[0].children[1].after(document.createTextNode(images[0].losses));
			self.sceneRoot.rows[3].cells[2].children[0].after(document.createTextNode(images[1].wins));
			self.sceneRoot.rows[3].cells[2].children[1].after(document.createTextNode(images[1].losses));
			// scores
			self.sceneRoot.rows[4].cells[0].firstChild.after(document.createTextNode(Math.round(images[0].ratings / (images[0].wins + images[0].losses + images[0].draws))));
			self.sceneRoot.rows[4].cells[2].firstChild.after(document.createTextNode(Math.round(images[1].ratings / (images[1].wins + images[1].losses + images[1].draws))));
			// expectations
			self.sceneRoot.rows[5].cells[0].firstChild.after(document.createTextNode(Math.round(calculateExpectations(images[0].ratings, images[1].ratings) * 100) + "%"));
			self.sceneRoot.rows[5].cells[2].firstChild.after(document.createTextNode(Math.round(calculateExpectations(images[1].ratings, images[0].ratings) * 100) + "%"));

			// var playerIndex = this._matchData.players.indexOf(playerId);
			// for (var j=0; j<3; j++){
			// 	for (var k=0; k<3; k++) {
			// 		var cell = this._cells[j][k];
			// 		cell._row = j;
			// 		cell._column = k;
			// 		if (this._matchData.cells[j][k] !== -1) {
			// 			this.addSpriteToCell(cell, this.SPRITES[this._matchData.cells[j][k]]);
			// 		} else {
			// 			cell.onclick= function(event) {
			// 				this.onCellClick(event);
			// 			}.bind(this);
			// 		}
			// 	}
			// }
			// if (this._matchData.playerTurn !== playerIndex) {
			// 	console.log("It's not this player's turn, let's display a message");
			// 	var sceneRoot = document.getElementById('scene');
			// 	var message = document.createElement('p');
			// 	message.appendChild(document.createTextNode('Please wait your turn.'));
			// 	sceneRoot.insertBefore(message, sceneRoot.firstChild);
			// 	this.disableAllCells();
			// };
		};

		this.createNewGameAsync = function() {
			var playerId = FBInstant.player.getID();
			this._matchData = {
				'winner': '',
				'loser': '',
				'cells': [[-1,-1,-1],[-1,-1,-1],[-1,-1,-1]],
				'playerTurn': 0,
				'players': [
					playerId
				],
			};
			return new Promise(function(resolve, reject){
				this.saveDataAsync()
					.then((savedData) => resolve(JSON.stringify(savedData)))
					.catch(reject);
			}.bind(this));
		};

		this.saveDataAsync = function() {
			var matchData = this._matchData;
			console.log(matchData);
			return new Promise(function(resolve, reject){
				console.log('going to save', JSON.stringify(matchData));
				// do some magic with FBInstant then invoke below line
				FBInstant.player.getSignedPlayerInfoAsync(JSON.stringify(matchData)).then(function(result){
					return backendClient.save(
						FBInstant.context.getID(),
						result.getPlayerID(),
						result.getSignature(),
						matchData
					)
				})
					.then(function(){
						resolve(matchData);
					})
					.catch(function(error){
						reject(error);
					})
			});
		};

		this.addSpriteToCell = function(cell, spriteName) {
			cell.removeChild(cell.firstChild);
			var img = document.createElement('img');
			img.src = '' + spriteName + '.png';
			img.className = 'sprite';
			cell.appendChild(img);
		};

		this.removeAllCells = function() {
			for (var row in self.sceneRoot.rows) {
				self.sceneRoot.deleteRow(row);
			}
			// for (var j=0; j<3; j++){
			// 	for (var k=0; k<3; k++) {
			// 		var cell = this._cells[j][k];
			// 		cell.onclick = null;
			// 	}
			// }
		};

		this.displayError = function (error) {
			console.log('Error loading from backend', error)
		};

		this.onCellClick = function(event) {
			event.preventDefault();
			var sourceEl = event.srcElement;
			var cell = null;
			if (sourceEl.tagName === 'IMG') {
				cell = sourceEl.parentNode;
			} else {
				cell = sourceEl;
			}
			var data = event.srcElement.parentNode.getAttribute("href").split(/[\?=&]/);
			this._matchData[data[1]] = data[2];
			this._matchData[data[3]] = data[4];
			// this.addSpriteToCell(cell, this.SPRITES[this._matchData.playerTurn]);
			// this._matchData.cells[cell._row][cell._column] = this._matchData.playerTurn;
			// this._matchData.playerTurn ^= 1;

			// self.removeAllCells();
			// self.makeGrid();
			// IMAGES.shift();
			// IMAGES.shift();
			self.makeMatch();

			// While saving data to the server, also request for user id
			self.saveDataAsync()
				.then(function(){
					return this.getPlayerImageAsync()
				}.bind(this))
				.then(function(image){
					var updateConfig = this.getUpdateConfig(image);
					return FBInstant.updateAsync(updateConfig)
				}.bind(this))
				.then(function() {
					// closses the game after the update is posted.
					// FBInstant.quit();
				});
		};

		this.preload = function(){
			// Preload images
			return new Promise(function(resolve, reject){
				self.loadImagesFromServer().then(function(json){
					json.forEach((images)=>{
						IMAGES.push(images);
					});
					resolve(true);
				}).catch(function(e){
					self.displayError(e);
				});
			});
		};

		this.getUpdateConfig = function(base64Picture) {
			var isMatchWon = this.isMatchWon();
			var isBoardFull = this.isBoardFull();
			var updateData = null;
			var playerName = FBInstant.player.getName();

			if (isMatchWon) {
				// Game over, player won
				updateData = {
					action: 'CUSTOM',
					cta: 'Rematch!' ,
					image: base64Picture,
					text: {
						default: playerName + ' has won!',
						localizations: {
							pt_BR: playerName + ' venceu!',
							en_US: playerName + ' has won!',
							de_DE: playerName + ' hat gewonnen'
						}
					},
					template: 'match_won',
					data: { rematchButton:true },
					strategy: 'IMMEDIATE',
					notification: 'NO_PUSH',
				};
			} else if (isBoardFull) {
				// Game over, tie
				updateData =
					{
						action: 'CUSTOM',
						cta: 'Rematch!' ,
						image: base64Picture,
						text: {
							default: 'It\'s a tie!',
							localizations: {
								pt_BR: 'Deu empate!',
								en_US: 'It\'s a tie!',
								de_DE: 'Es ist ein unentschiedenes Spiel!'
							}
						},
						template: 'match_tie',
						data: { rematchButton:true },
						strategy: 'IMMEDIATE',
						notification: 'NO_PUSH',
					};
			} else {
				// Next player's turn
				updateData = {
					action: 'CUSTOM',
					cta: 'Play your turn!' ,
					image: base64Picture,
					text: {
						default: playerName + ' has played. Now it\'s your turn',
						localizations: {
							pt_BR: playerName + ' jogou. Agora é sua vez!',
							en_US: playerName + ' has played. Now it\'s your turn',
							de_DE: playerName + ' hat gespielt. Jetzt bist du dran.'
						}
					},
					template: 'play_turn',
					data: { rematchButton: false },
					strategy: 'IMMEDIATE',
					notification: 'NO_PUSH',
				};
			}

			return updateData;
		};

		this.isMatchWon = function() {
			function checkMatchAll(cells) {
				return (cells[0] != -1) && (cells[0] == cells[1]) && (cells[1] == cells[2]);
			}

			var cells = this._matchData.cells;

			var matchRow =
				checkMatchAll(cells[0]) ||
				checkMatchAll(cells[1]) ||
				checkMatchAll(cells[2]);
			var matchColumn =
				checkMatchAll([cells[0][0], cells[1][0], cells[2][0]]) ||
				checkMatchAll([cells[0][1], cells[1][1], cells[2][1]]) ||
				checkMatchAll([cells[0][2], cells[1][2], cells[2][2]]);
			var matchAcross =
				checkMatchAll([cells[0][0], cells[1][1], cells[2][2]]) ||
				checkMatchAll([cells[2][0], cells[1][1], cells[0][2]]);

			var won = matchRow || matchColumn || matchAcross;
			return won;
		};

		this.isBoardFull = function() {
			for (var j=0; j<3; j++){
				for (var k=0; k<3; k++) {
					if (this._matchData.cells[j][k] == -1) {
						return false;
					}
				}
			}
			return true;
		};

		this.getPlayerImageAsync = function() {
			return new Promise(function(resolve, reject){
				var sceneRoot = document.getElementById('scene');
				var sceneWidth = sceneRoot.offsetWidth;
				FBInstant.getPlayerID;

				html2canvas(sceneRoot, {width:sceneWidth*3, x:-(sceneWidth)})
					.then(function(canvas){
						resolve(canvas.toDataURL("image/png"));
					})
					.catch(function(err){
						reject(err);
					})
			})
		};
	}
	window['StuckWanYah'] = StuckWanYah;

	StuckWanYah.prototype = {
		shim: function(gender){
			return gender == 'female' ? 'male' : 'female';
		},
		loadImagesFromServer: function() {
			return new Promise(function(resolve, reject) {
				$.ajax({
					dataType: 'json',
					type: 'get',
					url: BACKEND_URL + "/api/v1/photos/",
					data: "SendData",
					success: function(json) {
						resolve(json);
					},
					complete: function(jqXHR, textStatus) {
						//$(document).triggerHandler('analyticsTick', [SendData, jqXHR, textStatus]);
					},
					error: function(error) {
						reject(error);
					}
				});
			});
		},
		loadImagesAsync: function() {
			return new Promise(function(resolve, reject){
				$.getJSON(BACKEND_URL + "/api/v1/photos/twophotos?gender=" + playerInfo.gender, function(photos) {
					IMAGES = photos;
					resolve(photos);
				});
				// self.loadImagesFromServer().then(function(json){
				// 	// json.forEach((images)=>{
				// 	// 	IMAGES.push(images.picture);
				// 	// });
				// 	self.populateGrid(photos);
				// }).catch(function(e){
				// 	self.displayError(e);
				// });
			});
		},
		createTouchController: function() {
			this.touchController;
		}
	};

	// this updates the person being rated as stuckan if only the person is a player also
	FBInstant.updateAsync({
		action: 'CUSTOM',
		cta: 'Play',
		image: "base64Picture",
		text: {
			default: 'Edgar played their move',
			localizations: {
				en_US: 'Edgar played their move',
				es_LA: '\u00A1Edgar jug\u00F3 su jugada!'
			}
		},
		template: 'play_turn',
		data: { myReplayData: '...' },
		strategy: 'IMMEDIATE',
		notification: 'NO_PUSH'
	}).then(function() {
		// closses the game after the update is posted.
		// FBInstant.quit();
	});
	FBInstant.updateAsync({
		action: 'CUSTOM',
		template: 'play_turn',
		text: 'Kun just played HELLO. Now it\'s Alissa\'s turn!',
		image: '...',
		data: '...',
	});

	var connectedPlayers = FBInstant.player.getConnectedPlayersAsync()
		.then(function(players) {
			console.log(players.map(function(player) {
				return {
					id: player.getID(),
					name: player.getName(),
				}
			}));
		});

	function backendClient(backendURL) {
		this.request = function (url, method, params) {
			var ignoreCache = function(url) {
				var randomNumber = Math.random();
				return url + '?ignore_cache=' + randomNumber;
			};

			return new Promise(function(resolve, reject) {
				var xmlhttp = new XMLHttpRequest;
				xmlhttp.onrequestchange = function() {
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
						var json = JSON.parse(xmlhttp.responseText);
						resolve(json);
					} else {
						reject(false);
					}
				};
				// xmlhttp.onload = function() {
				// 	xmlhttp.status >= 200 && xmlhttp < 300 ? resolve(xmlhttp.responseText) : reject(new Error("login failed " + xmlhttp.status + " " + xmlhttp.statusText));
				// }
				xmlhttp.onerror = function () {
					console.log(xmlhttp)
					// reject(new Error("login failed " + xmlhttp.status + " " + xmlhttp.statusText));
				};
				xmlhttp.open(method, url, true);
				xmlhttp.setRequestHeader('Content-Type', 'application/json');
				xmlhttp.send(JSON.stringify(params))
			});
		};

		this.save = function(contextId, player, signature, data) {
			console.log(contextId);
			console.log(player);
			console.log(signature);
			var url = backendURL + `/rate?${$.param(data)}`;
			var method = 'GET';
			var payload = {'contextId': contextId, 'signature': signature, 'player': player};
			return this.request(url, method, payload);
		};

		this.load = function(signature) {
			var url = backendURL + '/api/v1/photos/twophotos';
			var method = 'GET';
			var payload = {'signature': signature};
			return this.request(url, method, payload);
		};
	}
	var isLoaded = null;
	document.addEventListener('readystatechange', function() {
		if (isLoaded === true) return;
		if (document.readyState === 'interactive' || document.readyState === 'complete') {
			isLoaded = true;
			document.removeEventListener('readystatechange', this);
			new StuckWanYah(new backendClient(BACKEND_URL)).init();
		}
	});


	function share(event) {
		var base64Picture = event.picture;
		FBInstant.shareAsync({
			intent: 'REQUEST',
			image: base64Picture,
			text: 'X is asking for your help!',
			data: { myReplayData: '...' },
		}).then(function() {
			// continue with the game.
		});
	}

	function logger(event) {
		var logged = FBInstant.logEvent(
			'my_custom_event',
			42,
			{custom_property: 'custom_value'},
		);
	}

	function leaderboard() {
		FBInstant.getLeaderboardAsync('my_leaderboard')
			.then(function(leaderboard) {
				console.log(leaderboard.getName()); // my_leaderboard
				return {
					entryCount: leaderboard.getEntryCountAsync(),
					score: leaderboard.setScoreAsync(42, '{race: "elf", level: 3}'),
					entries: leaderboard.getEntriesAsync()
				}
			})
			.then(function(count) { console.log(count); }) // 24
			.then(function(entry) {
				console.log(entry.getRank()); // 2
				console.log(entry.getScore()); // 42
				console.log(entry.getExtraData()); // '{race: "elf", level: 3}'
			});
	}

	/* var io = {
		load: function(profileUrl, callback, sync) {
			var xhr = new XMLHttpRequest();
			
			if (xhr.overrideMimeType) {
				xhr.overrideMimeType('text/plain');
			}
	
			xhr.open('GET', profileUrl, !sync);
	
			xhr.addEventListener('load', function io_load(e) {
				if (e.target.status === 200 || e.target.status ===0) {
					callback(null, e.target.responseText);
				} else {
					callback(new Error('Not Found: ' + profileUrl));
				}
			});
			xhr.addEventListener('error', callback);
			xhr.addEventListener('timeout', callback);

			try {
				xhr.send(null);
			} catch (e) {
				callback(new Error('Not Found: ' + profileUrl));
			}
		},
		loadJSON: function loadJSON(profileUrl, callback) {
			var xhr = new XMLHttpRequest();

			if (xhr.overrideMimeType) {
				xhr.overrideMimeType('application/json');
			}

			xhr.open('GET', profileUrl);

			xhr.responseType = 'json';
			xhr.addEventListener('load', function io_loadjson(e) {
				if (e.target.status === 200 || e.target.status === 0) {
					callback(null, e.target.response);
				} else {
					callback(new L10nError('Not found: ' + profileUrl));
				}
			});
			xhr.addEventListener('error', callback);
			xhr.addEventListener('timeout', callback);

			// the app: protocol throws on 404, see https://bugzil.la/827243
			try {
				xhr.send(null);
			} catch (e) {
				callback(new L10nError('Not found: ' + profileUrl));
			}
		}
	}; */

	var Logger = FBInstant.logEvent.prototype;
	function logger(event) {
		var logged = FBInstant.logEvent('my_custom_event', 42, {
			custom_property: 'custom_value'
		});
	}
	function message(mess, param) {
		if (FBInstant) {
			FBInstant.logEvent(mess, ...param);
		}
	}
	/**
	 *
	 */
	function calculateExpectations(Ra, Rb) {
		return parseFloat(1 / (1 + Math.pow(10, (Rb - Ra) / 400))).toFixed(2);
	}
	/**
	 *
	 */
	function calculateWins(score, expected, k = 24) {
		return score + k * (1 - expected);
	}
	/**
	 *
	 */
	function calculateLosses(score, expected, k = 24) {
		return score + k * (0 - expected);
	}
	/**
	 *
	 */
	function renderRankings() {
		showDialog("Loading", !0);
		$.getJSON(BACKEND_URL + '/api/v1/photos/top?gender=' + StuckWanYah.prototype.shim(playerInfo.gender)).then(function renderRankings(list) {
			hideDialog.call(this);
			displayPicture(list, "#rank-list");
		});
	}
	function renderPhotos() {
		showDialog("Loading", !0);
	}
	function renderFriendsList() {
		showDialog("Loading", !0);
		$.getJSON(BACKEND_URL + '/api/v1/photos/me/friends', function renderFriendsList(response) {
			hideDialog.call(this);
			displayPicture(response, "#friends-list");
		});
	}
	function simplePreload() {
		var args = simplePreload.arguments;
		window.imageArray = new Array( args.length );
		for(var i = 0; i < args.length; i++ ) {
			window.imageArray[i] = new Image;
			window.imageArray[i].src = args[i];
		}
	}
	//simplePreload('pictures/cat2.jpg', 'pictures/dog10.jpg');

	/**
	 *
	 */
	function displayPicture(list, parentDiv) {
		hideDialog.call(this);
		var output = '';
		for (var i = 0; i < list.length; i++) {
			//create link to profile and when mouse hovers display name
			output += "<a href=\"https://www.facebook.com" + list[i].profileUrl + "\" title=\"Go to this person\'s page\" target='_blank'>";
			// output += "<img src=\"https://graph.facebook.com/" + list[i].facebookHandle.id + "/picture?type=small\">"; //small, square, album, large 
			if (displayPicture.caller && displayPicture.caller.name === renderRankings.name) {
				output += `<div class='container'>
						<img src="http://localhost:5000${list[i].picture}" style="width: 57px"/>
						<div class='details'>
							<span>${list[i].name}</span>
							<span><b>Ratings: </b>${list[i].ratings}</span>
							<span><b>Wins: </b>${list[i].wins}, <b>Losses: </b>${list[i].losses}</span>
						</div>
					</div>`;
				//<b>Score: </b>${(list[i].wins*1) + (list[i].losses*0)}</span>

			} else {
				output += "<img src=\"http://localhost:5000" + list[i].picture + "\" style=\"width: 57px\">";
			}
			output += '</a>';
		}
		$(parentDiv).html(output);
	}
	// $(".photo").click(function onImageClick(e) {
	// 	e.preventDefault() && e.preventDefault;
	// 	var profileUrl = e.currentTarget.firstChild.href;
	// 	try {
	// 		var xhr = new XMLHttpRequest();
	// 	} catch {
	// 		var xhr = new ActiveXObject("Microsoft.XMLHTTP");
	// 	};
	// 	xhr.onrequestchange = function() {
	// 		if (xhr.statusState == 4 && xhr.status == 200) {
	// 			console.log("voted");
	// 			console.log(xhr.responseText);
	// 		}
	// 	};
	// 	xhr.onerror = function(error) {
	// 		return new Error(error);
	// 	};
	// 	console.log(e.target.parentNode.href);
	// 	console.log(profileUrl);
	// 	xhr.open('GET', profileUrl, true);
	// 	xhr.send();
	// });

	$("body")
		.on("pagebeforechange", function(e){
		})
		.on("pagechange", function(e){
			var e = e.currentTarget.baseURI.split(/[\#]/);
			switch (e[e.length-1]) {
				case 'play':
					// render photos
					// renderPhotos.call(this)
					break;
				case 'story':
					// render about page
					// showDialog("Error", 0);
					break;
				case 'leaderboard':
					// render leaderboard
					renderRankings();
					break;
				case 'friends':
					// render friends
					renderFriendsList();
					break;
			}
		})
		.on("pagebeforeshow", function(e){
		})
		.on("pageshow", function(e){
		});

	function showDialog(text, loading = true) {
		$.mobile.loading("show", {
			text: text,
			textVisible: !0,
			theme: loading == true ? loading_theme : error_theme
		});
	}
	function hideDialog() {
		$.mobile.loading("hide");
	}

	function ErrorMessage(b) {
		$('<div class="ui-loader ui-corner-all ui-body-' + error_theme + ' ui-loader-verbose ui-loader-textonly"><span class="ui-icon ui-icon-loading"></span><h1>' + b + "</h1></div>").css({
			display: "block"
		}).appendTo($.mobile.pageContainer).delay(4E3).fadeOut(600, function() {
			$(this).remove()
		})
	}

	if ($("[data-url=leaderboard]").is($.mobile.activePage)) {
		console.log("ello");
		var el = `<li class="ui-li-has-thumb" data-icon="false">
			<a rel="nofollow" href="/#!{{:url}}" style="padding-right: 64px;">
				<img src="img/profile.jpg" alt="" />
				<h3>${name}</h3>
				<p>Rank: ${rank}</p>
				<p>Wins: ${wins}; Losses: ${losses}</p>
				<!-- <span class="ui-li-count">{{>~b2size(size)}}</span> -->
			</a>
		</li>`;

		$("#rank-list").html(el);
	}

});
