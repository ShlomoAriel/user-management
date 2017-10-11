'use strict';
var express = require('express');
var app = express();
// var jwt = require('express-jwt');
var router = express.Router();
var userManagement = require('../user-management-package');
var mongoose = require('mongoose');

//----------------------------------------------------------------------------------------------------------pasport
var config = require('./config/database'); // get db config file

mongoose.connect(config.database, { useMongoClient: true });

var db = mongoose.connection;

userManagement.init(app, { db, secret: config.secret });

app.listen(process.env.PORT || 3001, () => {
  //eslint-disable-next-line no-console
  console.log('Listening on localhost 3001');
});

db.on('error', console.error.bind(console, 'connection error:'));

app.use('/', router);
