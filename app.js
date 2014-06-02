var express = require('express');
var routes = require('./controllers/routes');
var mongoose = require('mongoose');
var msg = require('./models/message').Message
var usr = require('./models/user').User
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
  console.log('DEV');
}

app.configure('development', function() {
	app.use(express.errorHandler());
	console.log('DEVE');
	mongoose.connect('mongodb://localhost/cheatchat', function(err) {
	  if (err) { throw err; }
	  else console.log('Okay mongoose');
	});
});

app.configure('production', function() {
  mongoose.connect(process.env.MONGOLAB_URI + '/cheatchat', function(err) {
	  if (err) { throw err; }
	  else console.log('Okay mongoose');
	});
});

app.get('/m', routes.mobile);
app.get('/', routes.index);
app.get('/connection', function(req, res) {
	var pseudo = 'no';
	//créer tableau avec prénoms en clef puis valeurs en colonnes (pour ajouter les couleurs)
	switch(req.query.name) {
		case 'florian':
			if(req.query.password == 'popo')
				pseudo = 'Flo';
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
		case 'zakaria':
			if(req.query.password == 'bienoubien')
				pseudo = 'Zak';
			break;
		default: pseudo = 'no';
	}
	var usr = new User({name: pseudo, action: 'log-in', date: new Date()});
	usr.save(function(error) {
		if(error)
			console.log('Error log-in saving');
	});
	res.send({pseudo: pseudo});
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var list_connected = [];
// //socket.io
var io = require('socket.io')(server);
io.on('connection', function (socket) {
	//event when someone connects to inform the others
	//db.messages.find().sort({date: -1}).limit(3).pretty()
	socket.on('connected', function(user) {
		msg.find().sort({date: -1}).limit(40).exec(function(err, res) {
			socket.emit('old_messages', {listMsg: res});
		});
		console.log(user.pseudo + ' is connected');
		socket.pseudo = user.pseudo;
		if(list_connected.indexOf(user.pseudo) == -1)
			list_connected.push(user.pseudo);
		console.log(list_connected);
		socket.emit('new_user', {list: list_connected});
		socket.broadcast.emit('new_user', {list: list_connected});
	});
	//event when someone disconnects, to inform the others
	socket.on('disconnect', function(user) {
		var pseudo = socket.pseudo;
		console.log(pseudo + ' is disconnected');

		var usr = new User({name: pseudo, action: 'log-out', date: new Date()});
		usr.save(function(error) {
			if(error)
				console.log('Error log-out saving');
		});

		var index = list_connected.indexOf(pseudo);
		if(index == -1) {
			console.log(' ========== ERROR ============= ');
		} else {
			list_connected.splice(index, 1);
		}
		socket.broadcast.emit('gone_user', {list: list_connected});
	});
	socket.on('message', function (message) {
		console.log('MSG from: ' + message.from + ' - content: ' + message.content + ' - date: ' +message.date);
		var saveMsg = new msg(message);
		saveMsg.save(function(error) {
			if(error)
				console.log("Saving message err: " + error);
		});
	    socket.broadcast.emit('new_message', message);
	});
});
// var io = require('socket.io').listen(server, { log: false });
// io.sockets.on('connection', function (socket) {
// 	//event when someone connects to inform the others
// 	//db.messages.find().sort({date: -1}).limit(3).pretty()
// 	socket.on('connected', function(user) {
// 		msg.find().sort({date: -1}).limit(40).exec(function(err, res) {
// 			socket.emit('old_messages', {listMsg: res});
// 		});
// 		console.log(user.pseudo + ' is connected');
// 		socket.set('pseudo', user.pseudo);
// 		if(list_connected.indexOf(user.pseudo) == -1)
// 			list_connected.push(user.pseudo);
// 		console.log(list_connected);
// 		socket.emit('new_user', {list: list_connected});
// 		socket.broadcast.emit('new_user', {list: list_connected});
// 	});
// 	//event when someone disconnects, to inform the others
// 	socket.on('disconnect', function(user) {
// 		socket.get('pseudo', function (error, pseudo) {
// 			console.log(pseudo + ' is disconnected');

// 			var usr = new User({name: pseudo, action: 'log-out', date: new Date()});
// 			usr.save(function(error) {
// 				if(error)
// 					console.log('Error log-out saving');
// 			});

// 			var index = list_connected.indexOf(pseudo);
// 			if(index == -1) {
// 				console.log(' ========== ERROR ============= ');
// 			} else {
// 				list_connected.splice(index, 1);
// 			}
// 			socket.broadcast.emit('gone_user', {list: list_connected});
// 		});
// 	});
// 	socket.on('message', function (message) {
// 		console.log('MSG from: ' + message.from + ' - content: ' + message.content + ' - date: ' +message.date);
// 		var saveMsg = new msg(message);
// 		saveMsg.save(function(error) {
// 			if(error)
// 				console.log("Saving message err: " + error);
// 		})
// 	    socket.broadcast.emit('new_message', message);
// 	});
// });