var mongoose = require('mongoose');
Schema = mongoose.Schema

UserSchema = new Schema({
	login: String,
	pseudo: String,
	password: String
//	date: String
});


User = mongoose.model('User', UserSchema);

exports.User = User;
exports.UserSchema = UserSchema;