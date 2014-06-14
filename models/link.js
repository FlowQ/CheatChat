var mongoose = require('mongoose');
Schema = mongoose.Schema

LienSchema = new Schema({
	from: String,
	link: String,
	context: String, 
	date: Number
});


Lien = mongoose.model('Lien', LienSchema);

exports.Lien = Lien;
exports.LienSchema = LienSchema;