/*
 * GET home page.
 */

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
				['auriane', 'bouboule', 'Bru']
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