var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DailyDefaultSchema = new Schema({
     name: { type: String, required: true, unique: true }
    // resources: [{type: Schema.Types.ObjectId, ref: 'ResourceType'}]
});
var DailyDefault = mongoose.model('dailyDefault', DailyDefaultSchema);
module.exports = DailyDefault;