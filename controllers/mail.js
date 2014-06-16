var async = require('async');
var moment = require('moment');
var nodemailer = require("nodemailer");
var lk = require('../models/link').Lien
var user = require('../models/user').User
var mail = require('../models/mail').Mail


var listMails = ['florianquattrocchi@gmail.com', 'pauline.clavelloux@gmail.com', 'constance.laborie@gmail.com', 'abrusseaux@gmail.com', 'bertrand.dautun@gmail.com'];
var listMailsStr = '';
for(var email in listMails) {
	listMailsStr += (listMails[email] + ',');
}
// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "master.flows.services@gmail.com",
        pass: "chat2014"
    }
});

// setup e-mail data with unicode symbols
var mailOptions = {
    from: "The Master <master.flows.services@gmail.com>", // sender address
    to: listMailsStr, // list of receivers
    subject: "Today's list ", // Subject line
    text: "Hello world ✔", // plaintext body
    html: "<b>Hello world ✔</b>" // html body
}

function sendMail (body) {
	mailOptions.subject += moment().format('dddd MMM Do');
	mailOptions.html = body;

	var saveMail = new mail(mailOptions);

	saveMail.save(function (err) {
		if(err)
			console.log('Error in saving mail: ' + err);
		else
			console.log('Mail saved');
	});
	//send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
	        console.log(error);
	    }else{
	        console.log("Message sent: " + response.message);
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    smtpTransport.close(); // shut down the connection pool, no more messages
	});
}

function getDate() {
	return moment().format('DDMMYYYY');
}
exports.sendLinks = function () {
	createBody(function (result) {
		sendMail(result);
	})
}
function createBody (cb) {
	var body = '<h3>Coucou, c\'est encore The Master! Voici la liste des liens de la journée: ';
	user.find({}).sort({pseudo: 1}).exec(function(err, res){
		async.eachSeries(res, function(person, callback){
			if(person.pseudo != 'L-A')
				getLinks(person.pseudo, function (part) {
					body += part;
					callback();
				});

		}, function(err1) {
			if(err1)
				console.log('Error1: ' + err1);

			cb(body);
		});		
	});
};
//get the links from a pseudo
function getLinks (person, cb) {
	var part = '<h4>' + person + ':</h4>';
	var d = getDate();
	lk.find({date: parseInt(d), from: person}, function(err, data){

		async.eachSeries(data, function (link, callback) {
			part += '<p>- <a href="' + link.link + '">' + link.link + '</a></p>';
			callback();
		}, function (err2) {
			if(err2)
				console.log('Error2: ' + err2);
		});

		cb(part);
	});
}