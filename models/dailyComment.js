var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DailyCommentSchema = new Schema({
    date: { 
        type: Date,
        required: true},
    site:{
        type:Schema.ObjectId,
        ref:'Site', 
        required: true
    },
    text:{
        type: String,
        required: true,
    },
    user:{
        type:Schema.ObjectId,
        ref:'User', 
        required: true
    }
});
// submissionSchema.index({ email: 1, sweepstakes_id: 1 }, { unique: true });
var DailyComment = mongoose.model('DailyComment', DailyCommentSchema);
module.exports = DailyComment;