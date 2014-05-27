var express = require('express');
var routes = require('./controllers/index');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.get('/dev', function(req, res) {
	res.render('dev');
});
app.get('/', routes.index);
app.get('/connection', function(req, res) {
	var pseudo = 'no';
	switch(req.query.name) {
		case 'florian':
			if(req.query.password == 'popo')
				pseudo = 'Flow';
			break;
		case 'constance':
			if(req.query.password == 'pokipoki')
				pseudo = 'Cons';
			break;
		case 'auriane':
			if(req.query.password == 'bouboule')
				pseudo = 'Bru';
			break;
		case 'pauline':
			if(req.query.password == 'coucou')
				pseudo = 'Popy';
			break;
		case 'bertrand':
			if(req.query.password == 'tennis')
				pseudo = 'Pépé';
			break;
		default: pseudo = 'no';
	}
	res.send({pseudo: pseudo});
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//socket.io
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {

	socket.on('message', function (message) {
		console.log(message);
	    socket.broadcast.emit('new_message', message);
	});
});