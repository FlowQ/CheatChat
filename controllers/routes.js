var log = require('../models/log').Log
var usr = require('../models/user').User
var usrAction = require('../models/userAction').UserAction
var msg = require('../models/message').Message

exports.index = function(req, res){
  console.log('desktop');
  res.render('index', { isMobile: false} );
};


exports.mobile = function(req, res){
  console.log('mobile');
  res.render('index', { isMobile: true} );
};


exports.account = function(req, res){
  res.render('account');
};

exports.init = function(req, res){
	var usr,mongoose;
	usr = require('../models/user').User
	var list = [
				['florian', 'popo', 'Flo'],
				['bertrand', 'tennis', 'Pépé'],
				['zakaria', 'bienoubien', 'Zak'],
				['constance', 'pokipoki', 'Cons'],
				['pauline', 'constance', 'Popy'],
				['auriane', 'bouboule', 'Bru'],
				['laure-anne', 'leonardo', 'LA']
			];
	usr.remove({}, function(err) {
		if(err)	
			console.log(err);
		else {
			for(var qqun in list) {
				var saveUser = new usr({
					login: list[qqun][0],
					password: list[qqun][1],
					pseudo: list[qqun][2]
				});
				saveUser.save(function(err) {
					if(err)
				    	console.log(err);
				}); 
			}
		}
	});
	res.send('re-init OK');
};

exports.changePwd = function(req, res) {
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
};

exports.connection = function(req, res) {
	var pseudo = 'no';

	usr.find({login: req.body.name}).limit(1).exec(function(err, data) {
		if(data.length > 0 && data[0].password == req.body.password) {
			pseudo = data[0].pseudo;
			var usrAction = new UserAction({name: pseudo, action: 'log-in', date: new Date()});
			usrAction.save(function(error) {
				if(error)
					console.log('Error log-in saving');
			});
		}
		res.send({pseudo: pseudo});
	});	
};
