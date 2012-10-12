/*
 * TODO: 
 * 	- Allow save path from interface
 * 	- enable all options for youtube-dl
 * 	- generic download function which then calls functions for specific sites besides youtube / plugin based?
 * 
 */

var express = require('express')
	, app = express()
	, http = require('http')
	, server = http.createServer(app)
	, io = require('socket.io').listen(server)
	, fs = require('fs')
	, spawn = require('child_process').spawn
	, queue = []
	, downloading = false
	, downloadPath = "./"
	, status = "Nothing."
	;

io.set('log level', 0);

app.use(express.static(__dirname + '/static'))

server.listen(3001);

setInterval(function () {
	io.sockets.emit('updateStatus', status);
}, 1000);

io.sockets.on('connection', function (socket) {
	console.log('socket.connection');
	socket.on('add', function ( request ) {
		console.log('socket.add');
		getFileDetails(request, function () {
			queue.push(request);
			socket.emit('addResponse', { success : true });

			if (!downloading) {
				downloadFile(queue.shift());
			}
			else {
				io.sockets.emit('updateQueue', queue);
			}
		});
	});

	socket.on('ready', function () {
		socket.emit('updateQueue', queue);
		socket.emit('updateStatus', status);
	});
});

function downloadFile(query) {
	io.sockets.emit('updateQueue', queue);
	
	if (/youtube/gi.test(query.url)) {
		downloadFromYouTube(query)
	}
	else {
		downloadGeneric(query);
	}
}

function downloadGeneric(query) {
	var proc = spawn('wget'
		, ['--progress=bar:force', query.url]
		, {
			cwd : downloadPath
		}
	);

	downloading = true;

	proc.stderr.on('data', function (data) {
		console.log(data.toString());
		
		status = {
			file : query,
			message : data.toString()
		};
	});

	proc.on('exit', function (code) {
		downloading = false;
		
		if (queue.length) {
			downloadFile(queue.shift());
		}
	});
}

function getFileDetails(query, callback) {
	if (/youtube/gi.test(query.url)) {
		getFileDetailsFromYouTube(query, callback);
	}
	else {

		query.title = query.url;
		query.description = query.url;
		callback(null, query);
	}
}

function downloadFromYouTube(query) {
	var proc = spawn('youtube-dl'
		, ['-t', '--cookies=cookies.txt', '--max-quality=37', query.url],
		{
			cwd : downloadPath
		}
	);
	
	downloading = true;
	
	proc.stdout.on('data', function (data) {
		console.log('stdout: ' + data);
		status = {
			file : query,
			message : data.toString()
		};
	});

	proc.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});

	proc.on('exit', function (code) {
		
		downloading = false;
		
		if (queue.length) {
			downloadFile(queue.shift());
		}
	});
}

function getFileDetailsFromYouTube(query, callback) {
	var buffer = [];

	var proc = spawn('youtube-dl'
		, ['--get-title', '--get-url', '--get-description', '--get-thumbnail', query.url]
	);

	proc.stdout.on('data', function (data) {
		buffer.push(data.toString());
	});

	proc.on('exit', function (code) {
		var data = buffer.join('\n').split('\n');
		
		query.title = data[0];
		query.downloadUrl = data[1];
		query.thumbnail = data[2];
		query.description = data[3];

		callback(query);
	});
}
