var express = require('express');
var routes = require('./controllers/routes');
var mongoose = require('mongoose');
var msg = require('./models/message').Message
var usr = require('./models/user').User
var kck = require('./models/kick').Kick
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

app.configure('development', function() {
	app.use(express.errorHandler());
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
app.post('/connection', function(req, res) {
	var pseudo = 'no';
	//créer tableau avec prénoms en clef puis valeurs en colonnes (pour ajouter les couleurs)
	switch(req.body.name) {
		case 'florian':
			if(req.body.password == 'popo')
				pseudo = 'Flo';
			break;
		case 'constance':
			if(req.body.password == 'pokipoki')
				pseudo = 'Cons';
			break;
		case 'auriane':
			if(req.body.password == 'bouboule')
				pseudo = 'Bru';
			break;
		case 'pauline':
			if(req.body.password == 'constance')
				pseudo = 'Popy';
			break;
		case 'bertrand':
			if(req.body.password == 'tennis')
				pseudo = 'Pépé';
			break;
		case 'zakaria':
			if(req.body.password == 'bienoubien')
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

var pseudoList = {'pepe': 0, 'zak': 0, 'flo': 0, 'popy': 0, 'bru': 0, 'cons': 0};
var kick = pseudoList;
var usernames = {};
// //socket.io
var io = require('socket.io')(server);
io.on('connection', function (socket) {
	var addedUser = false;

	socket.on('connected', function(user) {
		socket.pseudo = user.pseudo;
		usernames[user.pseudo] = user.pseudo;
		addedUser = true;

		msg.find().sort({date: -1}).limit(40).exec(function(err, res) {
			socket.emit('old_messages', {listMsg: res});
		});
		console.log(user.pseudo + ' is connected');
		socket.emit('new_user', {list: usernames});
		socket.broadcast.emit('new_user', {list: usernames});
	});
	//event when someone disconnects, to inform the others
	socket.on('disconnect', function () {
		if (addedUser) {
			var pseudo = socket.pseudo;
			console.log(pseudo + ' is disconnected');
			var usr = new User({name: pseudo, action: 'log-out', date: new Date()});
			usr.save(function(error) {
				if(error)
					console.log('Error log-out saving');
			});
			delete usernames[pseudo];
			socket.broadcast.emit('gone_user', {list: usernames});
		}
	});

	socket.on('message', function (message) {
		console.log('MSG from: ' + message.from + ' - content: ' + message.content + ' - date: ' +message.date);
		var saveMsg = new msg(message);
		saveMsg.save(function(error) {
			if(error)
				console.log("Saving message err: " + error);
		});

		Object.size = function(obj) {
		    var size = 0, key;
		    for (key in obj) {
		        if (obj.hasOwnProperty(key)) size++;
		    }
		    return size;
		};
		//for kicking someone
		var index = message.content.indexOf("kick@");
		if( index > -1) {
			var tmp = message.content.slice(index + 5);
			index = tmp.indexOf(' ');
			var victim = null;
			if(index == -1)
				victim = tmp.slice(0);
			else
				victim = tmp.slice(0, index);
			victim = victim.toLowerCase();
			var now = new Date();
			
			++kick[victim];
			//si plus de la moitié veut kicker
			if(kick[victim] > Math.floor(Object.size(pseudoList) / 2) - 1) {
				console.log(victim + ' kicked!');
				socket.broadcast.emit('kick', {name: victim});
				kick[victim] = 0;
				var d = new Date();
				var saveKick = new kck({last: message.from, victim: victim, date: d});
				saveKick.save(function(error) {
					if(error)
						console.log("Saving kick err: " + error);
				});
			}
		}




	    socket.broadcast.emit('new_message', message);



	  // when the client emits 'typing', we broadcast it to others
	  socket.on('typing', function () {
	    socket.broadcast.emit('typing', {
	      pseudo: socket.pseudo
	    });
	  });
	  socket.on('stop typing', function () {
	    socket.broadcast.emit('stop typing', {
	      pseudo: socket.pseudo
	    });
	  });
	});
});