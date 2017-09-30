var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ResourceSchema = new Schema({
    name: String,
    value: Number,
    type:{
        type:Schema.ObjectId,
        ref:'ResourceType'
    }
});
var Resource = mongoose.model('Resource', ResourceSchema);
module.exports = Resource;