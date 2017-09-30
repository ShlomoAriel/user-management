var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DailyWorkerSchema = new Schema({
    date: { 
        type: Date,
        required: true},
    endTime: { 
        type: Date,
        required: true},
    startTime: { 
        type: Date,
        required: true},
    site:{
        type:Schema.ObjectId,
        ref:'Site', 
        required: true
    },
    worker:{
        type:Schema.ObjectId,
        ref:'Worker', 
        required: true
    },
    user:{
        type:Schema.ObjectId,
        ref:'User', 
        required: true
    }
    ,
    hourlyRate: { 
        type: Number,
        required: true,
        unique: false 
    },
    commute: { 
        type: Number,
        required: true,
        unique: false 
    },
    hours: { 
        type: Number,
        required: true,
        unique: false 
    }
});
var DailyWorker = mongoose.model('DailyWorker', DailyWorkerSchema);
module.exports = DailyWorker;