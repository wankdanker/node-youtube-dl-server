/*
 * TODO: 
 * 	- Allow save path from interface
 * 	- enable all options for youtube-dl
 * 	- generic download function which then calls functions for specific sites besides youtube / plugin based?
 * 
 */

var connect = require('connect'),
	 fs = require('fs')
	 spawn = require('child_process').spawn;
	 
var queue = [], downloading = false;

var downloadPath = "/mnt/media2/Video/Music Videos";
var status = "Nothing.";


var server = connect.createServer();
var io = require('socket.io').listen(server);
io.set('log level', 1);


server.use(
	connect.query()
)

.use(  	
	connect.static(__dirname + '/static')
)
.listen(3001);

setInterval(function () {
	io.sockets.emit('updateStatus', status);
}, 1000);

io.sockets.on('connection', function (socket) {
	socket.on('add', function ( request ) {
		queue.push(request);

		if (!downloading) {
			downloadFile(queue.shift());
		}
		else {
			io.sockets.emit('updateQueue', queue);
		}
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
		status = data.toString();
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
