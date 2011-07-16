var connect = require('connect'),
	 fs = require('fs');
	 
var index = 0;

var server = connect.createServer()
// .use(
// 	connect.logger()
//  )
.use(
	connect.query()
)
.use(  	
	connect.static(__dirname + '/static')
)
.use('/add', function (request, response) {
	//fs.writeFile(filename, data, encoding='utf8', [callback]
	index++;
	
	fs.writeFile(__dirname + '/queue/' + index, request.query.url + '\n', function (error) {
		
		response.end(JSON.stringify(error));
		
	});
})
.listen(3000);
