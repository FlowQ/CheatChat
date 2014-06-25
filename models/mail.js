var mongoose = require('mongoose');
Schema = mongoose.Schema

MailSchema = new Schema({
	from: String,
	to: String,
	subject: String, 
	text: String,
	html: String
});


Mail = mongoose.model('Mail', MailSchema);

exports.Mail = Mail;
exports.MailSchema = MailSchema;