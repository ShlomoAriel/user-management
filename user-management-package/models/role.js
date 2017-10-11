var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roleSchema = new Schema({
    name: { type: String, required: true, unique: true }
    // value: { type: Number, required: true, unique: true },
});
var Role = mongoose.model('Role', roleSchema);
module.exports = Role;