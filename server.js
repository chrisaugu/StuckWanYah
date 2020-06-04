var http = require('http');

http.createServer(function(req, res){
	res.writeHeader("Content-Type": "");
	res.end("Hello WOrld");
}).listen(process.env.PORT);