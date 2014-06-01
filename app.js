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
	//créer tableau avec prénoms en clef puis valeurs en colonnes (pour ajouter les couleurs)
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

var list_connected = [];
//socket.io
var io = require('socket.io').listen(server, { log: false });
io.sockets.on('connection', function (socket) {
	//event when someone connects to inform the others
	socket.on('connected', function(user) {
		console.log(user.pseudo + ' is connected');
		socket.set('pseudo', user.pseudo);
		if(list_connected.indexOf(user.pseudo) == -1)
			list_connected.push(user.pseudo);
		console.log(list_connected);
		socket.emit('new_user', {list: list_connected});
		socket.broadcast.emit('new_user', {list: list_connected});
	});
	//event when someone disconnects, to inform the others
	socket.on('disconnect', function(user) {
		socket.get('pseudo', function (error, pseudo) {
			console.log(pseudo + ' is disconnected');

			var index = list_connected.indexOf(pseudo);
			if(index == -1) {
				console.log(' ========== ERROR ============= ');
			} else {
				list_connected.splice(index, 1);
			}
			socket.broadcast.emit('gone_user', {list: list_connected});
		});
	});
	socket.on('message', function (message) {
		console.log('MSG from: ' + message.from + ' - content: ' + message.content + ' - date: ' +message.date);
	    socket.broadcast.emit('new_message', message);
	});
});