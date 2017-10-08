"use strict";
var express = require('express');
var app = express();
// var jwt = require('express-jwt');
var router = express.Router();
var cors = require('cors');
var _ = require('lodash');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoose = require('mongoose');

// =============MODELS===================
var UserModel = require('./models/user');
var RoleModel = require('./models/role');

//----------------------------------------------------------------------------------------------------------pasport
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/database'); // get db config file

var jwt = require('jwt-simple');
// log to console
app.use(morgan('dev'));
// Use the passport package in our application
app.use(passport.initialize());
//----------------------------------------------------------------------------------------------------------pasport

var bodyParser = require('body-parser')
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing       application/x-www-form-urlencoded

app.use(cors());


app.listen(process.env.PORT || 3001);
console.log('Listening on localhost 3001');
mongoose.connect('mongodb://shlomoariel:a1345678@ds153413.mlab.com:53413/user-management');


var db = mongoose.connection;
// pass passport for configuration
require('./config/passport')(passport);
function initDB() {
    var role1 = new RoleModel({
        _id: "57d27d4313d468481b1fe12e",
        name: "מנהל"
    });
    role1.save();
    var role2 = new RoleModel({
        _id: "57d2805f13d468481b1fe130",
        name: "מנהל איזור"
    });
    role2.save();
    var role3 = new RoleModel({
        _id: "57d2837a13d468481b1fe133",
        name: "מפקח"
    });
    role3.save();
    var user = new UserModel(
        {
            email: "shlomoariel@gmail.com",
            name: "Shlomo",
            password: "a1345678",
            role: {
                _id: "57d27d4313d468481b1fe12e",
                name: "מנהל"
            }
        }
    );
    user.save();
}
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    initDB();
    UserModel.find(function (err, users) {
        if (err) { return console.error('find no good' + err) };
        console.log('all users' + users);
    })
});
app.use(require('./controllers'))

app.use('/', router);


