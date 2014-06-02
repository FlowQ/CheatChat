var mongoose = require('mongoose');
Schema = mongoose.Schema

UserSchema = new Schema({
	name: String,
	action: String,
	date: String
});


User = mongoose.model('User', UserSchema);

exports.User = User;
exports.UserSchema = UserSchema;