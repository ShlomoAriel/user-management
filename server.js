"use strict";
var express = require('express');
var app = express();
// var jwt = require('express-jwt');
var cors = require('cors');
var _ = require('lodash');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mongoose = require('mongoose');

// =============MODELS===================
var UserModel = require('./models/user');
var RoleModel = require('./models/role');


//------------------pasport
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/database'); // get db config file

var jwt = require('jwt-simple');
// log to console
app.use(morgan('dev'));
// Use the passport package in our application
app.use(passport.initialize());
//------------------pasport

var bodyParser = require('body-parser')
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing       application/x-www-form-urlencoded

app.use(cors());
app.roles = [{ value: 1, label: 'admin' },
{ value: 2, label: 'super' },
{ value: 3, label: 'manager' }];

//================================USERS=====================================================================
// create a new user account (POST http://localhost:8080/api/signup)
app.post('/api/signup', passport.authenticate('jwt', { session: false }), function (req, res) {
    if (!req.body.email || !req.body.password) {
        res.json({ success: false, msg: 'Please pass email and password.' });
    } else {
        var newUser = new UserModel({
            email: req.body.email.toLowerCase(),
            name: req.body.name,
            role: req.body.role,
            password: req.body.password
        });
        // save the user
        newUser.save(function (err) {
            if (err) {
                return res.json({ success: false, msg: 'Username already exists. ' + err });
            }
            res.json({ success: true, msg: 'Successful created new user.' });
        });
    }
});
//---------
// route to authenticate a user (POST http://localhost:8080/api/authenticate)
app.post('/api/authenticate', function (req, res) {
    UserModel.findOne({
        email: req.body.email.toLowerCase()
    }).populate('role').exec(function (err, user) {
        if (err) throw err;

        if (!user) {
            res.send({ success: false, msg: 'Authentication failed. User not found.' });
        } else {
            // check if password matches
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    console.log('err: ' + err + ' isMatch: ' + isMatch);
                    // if user is found and password is right create a token
                    var token = jwt.encode(user, config.secret);
                    // return the information including token as JSON
                    res.json({ success: true, token: 'JWT ' + token, user: user });
                } else {
                    console.log('err: ' + err + ' isMatch: ' + isMatch);
                    res.send({ success: false, msg: 'Authentication failed. Wrong password.' });
                }
            });
        }
    });
});
//------------
app.post('/api/changePassword', function (req, res) {
    console.log('changing password');
    UserModel.findOne({
        email: req.body.email.toLowerCase()
    }).populate('role').exec(function (err, user) {
        if (err) throw err;
        if (!user) {
            res.send({ success: false, msg: 'Authentication failed. User not found.' });
        } else {
            // check if password matches
            user.compareHashed(req.body.oldPassword,
                function (err, isMatch) {
                    console.log('after compareHashed \nerr: ' + err + ' isMatch: ' + isMatch);
                    if (isMatch && !err) {
                        user.password = req.body.newPassword;
                        user.save(function (err) {
                            if (err) {
                                console.log('in save err: ' + err);
                                res.send({ success: false, msg: 'Password change failed' });
                            }
                            console.log('in save no err ');
                            res.json({ success: true });
                        });
                    } else {
                        console.log('err: ' + err + ' isMatch: ' + isMatch);
                        res.send({ success: false, msg: 'Authentication failed. Wrong password.' });
                    }
                });
        }
    });
});
// route to authenticate a user (POST http://localhost:8080/api/authenticate)
// ...
var getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};
// route to a restricted info (GET http://localhost:8080/api/memberinfo)
app.get('/api/memberinfo', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        var decoded = jwt.decode(token, config.secret);
        UserModel.findOne({
            email: decoded.email.toLowerCase()
        }, function (err, user) {
            if (err) throw err;

            if (!user) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            } else {
                res.json({ success: true, msg: 'Welcome in the member area ' + user.email + '!' });
            }
        });
    } else {
        return res.status(403).send({ success: false, msg: 'No token provided.' });
    }
});

var validateUser = function (req) {
    var token = getToken(req.headers);
    if (token) {
        var decoded = jwt.decode(token, config.secret);
        console.log('decoded.email: ' + decoded.email);
        UserModel.findOne({
            email: decoded.email.toLowerCase()
        }).exec(function (err, user) {
            if (err) {
                return false;
            }
            if (!user) {
                console.log('!user: ' + user);
                return false;
            } else {
                console.log('user: ' + user);
                return true;
            }
        });
    } else {
        return false;
    }
};

app.get('/api/getUsers', passport.authenticate('jwt', { session: false }), function (req, res) {
    // if(!validateUser(req)){
    //     res.send('Error authenticating User\n');
    // }
    UserModel.find().populate('role').exec(function (err, users) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(users);
        }
    })
});

app.put('/api/updateUser/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    UserModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { name: req.body.name, email: req.body.email, role: req.body.role } },
        { upsert: true },
        function (err, newUser) {
            if (err) {
                res.send('Error updating User\n' + err);
            }
            else {
                res.send(204);
            }
        });
});

app.post('/api/addUser', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    console.log('add user');
    var user = new UserModel(req.body);
    user.email = user.email.toLowerCase();
    user.save((err, newItem) => {
        if (err) {
            return next(err.code);
        }
        res.status(200).send('OK');
    });

});
app.get('/api/getUser/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    UserModel.findOne({ _id: req.params.id })
        .populate('role')
        .exec(function (err, user) {
            if (err) {
                res.send('error retriving user\n' + err);
            }
            else {
                console.log(user);
                res.json(user);
            }
        });
});

app.delete('/api/deleteUser/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    UserModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newUser) {
            if (err) {
                res.send('Error deleting User\n' + err);
            }
            else {
                res.send(204);
            }
        });
});

app.get('/api/findUserLike', passport.authenticate('jwt', { session: false }), function (req, res) {
    var searchString = req.param('searchString');
    let objectArray = _.filter(app.users, function (o) {
        return o.name.includes(searchString);
    });
    res.json(objectArray);
});

app.get('/api/test', (req, res) => {
    res.status(200).send('OK');
});

//==========================================END USERS========================================================
function findLike(model, searchString) {
    let results = [];
    console.log('Model: ' + model + '\n Search string: ' + searchString)
    return model
        .find({ name: { $regex: new RegExp(searchString, "i") } })
        // .where('name').includes(searchString)
        .exec((err, items) => {
            if (err) {
                return false;
            }
            else {
                // console.log('items: ' + items);
                // return _.filter(items, function (o) {
                //     return o.name.includes(searchString);
                // });
            }
        });
}
app.listen(process.env.PORT || 3001);
console.log('Listening on localhost 3001');
mongoose.connect('mongodb://shlomoariel:a1345678@ds153413.mlab.com:53413/user-management');
// mongoose.connect('mongodb://localhost/example');

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
    console.log('greeting');
    initDB();
    RoleModel.update({}, { $unset: { value: 1 } }, { multi: true });
    UserModel.find(function (err, users) {
        if (err) { return console.error('find no good' + err) };
        console.log('all users' + users);
    })
});
app.get('/api/getRoles', passport.authenticate('jwt', { session: false }), function (req, res) {
    RoleModel.find().populate('type').exec(function (err, roles) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(roles);
        }
    })
});
app.post('/api/addRole', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    console.log('adding role');
    var role = new RoleModel(req.body);
    role.save((err, newItem) => {
        if (err) {
            return next(err.code);
        }
        res.status(200).send('OK');
    });
});
app.put('/api/updateRole/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log('updating Role: ' + req.body.name + ' ' + req.body.value);
    RoleModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { name: req.body.name } },
        { upsert: true },
        function (err, newRole) {
            if (err) {
                res.send('Error updating Role\n' + err);
            }
            else {
                res.send(204);
            }
        });
});

app.delete('/api/deleteRole/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    RoleModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newRole) {
            if (err) {
                res.send('Error deleting Role\n' + err);
            }
            else {
                res.send(204);
            }
        });
});