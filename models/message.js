var mongoose = require('mongoose');
Schema = mongoose.Schema

MessageSchema = new Schema({
	from: String,
	content: String,
	date: String
});


Message = mongoose.model('Message', MessageSchema);

exports.Message = Message;
exports.MessageSchema = MessageSchema;