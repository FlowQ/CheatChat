var express = require('express');
var routes = require('./controllers/routes');
var mongoose = require('mongoose');
var msg = require('./models/message').Message
var usrAction = require('./models/userAction').UserAction
var kck = require('./models/kick').Kick
var log = require('./models/log').Log
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

//catches all unknown errors 
process.on('uncaughtException', function(err) {
  var d = new Date();
  var saveLog = new log({type: 'server', error: err,date: d});
  saveLog.save(function(error) {
  	if(error)
  		console.log('Error saving log: ' + error);
  });
  console.log('Caught exception: ' + err);
  process.exit(0);
});

app.get('/account', routes.account);
app.get('/m', routes.mobile);
app.get('/', routes.index);
app.get('/init', routes.init);
app.post('/connection', function(req, res) {
	var pseudo = 'no';

	usr.find({login: req.body.name}).limit(1).exec(function(err, data) {
		if(data[0].password == req.body.password) {
			pseudo = data[0].pseudo;
			var usrAction = new UserAction({name: pseudo, action: 'log-in', date: new Date()});
			usrAction.save(function(error) {
				if(error)
					console.log('Error log-in saving');
			});
		}
		res.send({pseudo: pseudo});
	});	
});
app.post('/changePwd', function(req, res) {
	console.log('changing password');
	console.log(req.body);
	usr.find({login: req.body.login}).limit(1).exec(function(err, data){
		console.log(data);
		var ret = 'Error';
		if(err)
			console.log('Error in changing password');
		else {
			data[0].password = req.body.newPassword;
			data[0].save(function(err) {
				if(err) 
					console.log("Error in saving new pwd");
				else
					res.send({status: 'OK'});
			})
		}
	});
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var pseudoList = {'pepe': 0, 'zak': 0, 'flo': 0, 'popy': 0, 'bru': 0, 'cons': 0};
var kick = pseudoList;
var usernames = {};
// //socket.io
var io = require('socket.io')(server);

app.get('/panic', function(req, res) {
	io.emit('panic');
	res.send('We survived the attack captain!');
});
io.on('connection', function (socket) {
	socket.secure = true;
	var addedUser = false;
	socket.on('logs', function(data) {
		console.log('log error');
		var saveLog = new log(data);
		saveLog.save(function(error) {
			if(error)
				console.log("Saving log err: " + error);
		});
	});
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
			var usrAction = new UserAction({name: pseudo, action: 'log-out', date: new Date()});
			usrAction.save(function(error) {
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
				socket.emit('kick', {name: victim});
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
	      name: socket.pseudo
	    });
	  });
	  socket.on('stop_typing', function () {
	    socket.broadcast.emit('stop_typing', {
	      name: socket.pseudo
	    });
	  });
	});
});