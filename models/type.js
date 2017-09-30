var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var typeSchema = new Schema({
    name: { type: String, required: true, unique: true }
    // , value: { type: Number, required: false, unique: false }
});
var Type = mongoose.model('ResourceType', typeSchema);
module.exports = Type;