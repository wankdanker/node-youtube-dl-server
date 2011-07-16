var connect = require('connect'),
	 fs = require('fs')
	 spawn = require('child_process').spawn;
	 
var queue = [], downloading = false;

var server = connect.createServer()
.use(
	connect.query()
)
.use(  	
	connect.static(__dirname + '/static')
)
.use('/add', function (request, response) {
	response.end('ok');
	
	queue.push(request.query.url);
	
	if (!downloading) {
		downloadVideo(queue.shift());
	}
})
.listen(3000);

function downloadVideo(url) {
	var proc = spawn('youtube-dl'
		, ['-t', '--max-quality=37', url]
	);
	
	downloading = true;
	
	proc.stdout.on('data', function (data) {
		console.log('stdout: ' + data);
	});

	proc.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});

	proc.on('exit', function (code) {
		
		downloading = false;
		
		if (queue.length) {
			downloadVideo(queue.shift());
		}
	});
}