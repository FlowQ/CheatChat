var mongoose = require('mongoose');
Schema = mongoose.Schema

UserActionSchema = new Schema({
	name: String,
	action: String,
	date: String
});


UserAction = mongoose.model('UserAction', UserActionSchema);

exports.UserAction = UserAction;
exports.UserActionSchema = UserActionSchema;