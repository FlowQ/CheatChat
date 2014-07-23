var express = require('express');
var routes = require('./controllers/routes');
var mongoose = require('mongoose');
var msg = require('./models/message').Message
var usrAction = require('./models/userAction').UserAction
var log = require('./models/log').Log
var usr = require('./models/user').User
var http = require('http');
var path = require('path');
var CronJob = require('cron').CronJob;
var nodemailer = require("nodemailer");

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
app.get('/new', routes.newUser);
app.get('/mail', routes.sendMail);

app.post('/connection', routes.connection);
app.post('/changePwd', routes.changePwd);
app.post('/create', routes.createUser);
app.post('/saveLk', routes.saveLink);

app.put('/prefs', routes.updatePrefs);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

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

		msg.find().sort({date: -1}).limit(user.number).exec(function(err, res) {
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


	  //envoie un mail à Trello pour ajouter une tâche
	  socket.on('trello', function (content) {
	  	var smtpTransport = nodemailer.createTransport("SMTP",{
		    service: "Gmail",
		    auth: {
		        user: "master.flows.services@gmail.com",
		        pass: "chat2014"
		    }
		});

		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: "<master.flows.services@gmail.com>", // sender address
		    to: 'florianquattrocchi+mrhdcbsa7pvtnfimzpek@boards.trello.com', //adresse de la board 
		    subject: '', // Subject line
		    text: '', // plaintext body
		    html: '' // html body
		}

		var subject = content.slice(content.indexOf('[') + 1, content.indexOf(']'));
		var end = content.indexOf(',');
		var content =  content.slice(content.indexOf('[', end) + 1, content.indexOf(']', end));
		mailOptions.subject = subject;
		mailOptions.html = content;
		mailOptions.text = content;
		console.log(mailOptions);

		smtpTransport.sendMail(mailOptions, function(error, response){
		    if(error){
		        console.log(error);
		    }else{
		        console.log("Message sent: " + response.message);
		    }

		    // if you don't want to use this transport object anymore, uncomment following line
		    smtpTransport.close(); // shut down the connection pool, no more messages
		});


	  });






	});
});
new CronJob('0 30 20 * * 1-5', function(){
    routes.sendMail();
    console.log("CRON EXECUTED");

}, null, true, "Europe/Paris");


function decrypt (message) {
	var node_cryptojs = require('node-cryptojs-aes');
	var CryptoJS = node_cryptojs.CryptoJS;
	var decrypted = CryptoJS.AES.decrypt(message, "thefatchatator");
	console.log("Message decrypte:" + CryptoJS.enc.Utf8.stringify(decrypted));
}