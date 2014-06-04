var mongoose = require('mongoose');
Schema = mongoose.Schema

KickSchema = new Schema({
	last: String,
	victim: String,
	date: String
});


Kick = mongoose.model('Kick', KickSchema);

exports.Kick = Kick;
exports.KickSchema = KickSchema;