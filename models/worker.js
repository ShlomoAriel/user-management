var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkerSchema = new Schema({
    name: { type: String, required: true, unique: true },
    hourlyRate: { type: Number, required: false, unique: false }
});
var Worker = mongoose.model('Worker', WorkerSchema);
module.exports = Worker;