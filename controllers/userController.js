var express = require('express')
  , router = express.Router()
  , passport = require('passport')
  , UserModel = require('../models/user')
  , app = express()
  , config = require('../config/database')
  , jwt = require('jwt-simple');

app.use(passport.initialize());
require('../config/passport')(passport);

//================================USERS=====================================================================
// create a new user account (POST http://localhost:8080/api/signup)
router.post('/api/signup', passport.authenticate('jwt', { session: false }), function (req, res) {
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
//-------------------------------------------------------------------------------------------------
// route to authenticate a user (POST http://localhost:8080/api/authenticate)
router.post('/api/authenticate', function (req, res) {
    if (!req.body.email || !req.body.password) {
        res.status(400).send('Invalid JSON string')
        // res.json({ success: false, msg: 'Please pass email and password.' });
        return
    }
    console.log("body: " + Object.keys(req.body))
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
//----------------------------------------------------------------------------------------------------
router.post('/api/changePassword', function (req, res) {
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
//----------------------------------------------------------------------------------------------------
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
//----------------------------------------------------------------------------------------------------
router.get('/api/memberinfo', passport.authenticate('jwt', { session: false }), function (req, res) {
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
//----------------------------------------------------------------------------------------------------
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
//----------------------------------------------------------------------------------------------------
router.get('/api/getUsers', passport.authenticate('jwt', { session: false }), function (req, res) {
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
//----------------------------------------------------------------------------------------------------
router.put('/api/updateUser/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
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
//----------------------------------------------------------------------------------------------------
router.post('/api/addUser', passport.authenticate('jwt', { session: false }), (req, res, next) => {
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
//----------------------------------------------------------------------------------------------------
router.get('/api/getUser/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
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
//----------------------------------------------------------------------------------------------------
router.delete('/api/deleteUser/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
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
//----------------------------------------------------------------------------------------------------
router.get('/api/findUserLike', passport.authenticate('jwt', { session: false }), function (req, res) {
    var searchString = req.param('searchString');
    let objectArray = _.filter(app.users, function (o) {
        return o.name.includes(searchString);
    });
    res.json(objectArray);
});

module.exports = router