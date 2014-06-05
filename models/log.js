var mongoose = require('mongoose');
Schema = mongoose.Schema

LogSchema = new Schema({
	type: String,
	error: String,
	url: String, 
	line: String,
	date: String
});


Log = mongoose.model('Log', LogSchema);

exports.Log = Log;
exports.LogSchema = LogSchema;