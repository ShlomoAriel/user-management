var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SiteSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required : true
    },
    user_ids: [{type: Schema.Types.ObjectId, ref: 'User'}]
});
SiteSchema.index({'user_ids':1});
var Site = mongoose.model('Site', SiteSchema);
module.exports = Site;
console.log('in site modle file');