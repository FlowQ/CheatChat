var mongoose = require('mongoose');
Schema = mongoose.Schema

MailSchema = new Schema({
	from: String,
	to: Array,
	subject: String, 
	text: String,
	html: String
});


Mail = mongoose.model('Mail', LienSchema);

exports.Mail = Mail;
exports.MailSchema = MailSchema;