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
var SiteModel = require('./models/site');
var UserModel = require('./models/user');
var WorkerModel = require('./models/worker');
var DailyWorkerModel = require('./models/dailyWorker');
var TypeModel = require('./models/type');
var DailyDefaultModel = require('./models/dailyDefault');
var ResourceModel = require('./models/resource');
var RoleModel = require('./models/role');
var DailyResourceModel = require('./models/dailyResource');
var DailyCommentModel = require('./models/dailyComment');


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

var _defaultResources = ['57e4c351c383b7bc38daacc5',
    '57e4c35bc383b7bc38daacc7',
    '57e4c360c383b7bc38daacc8',
    '57e4c36ec383b7bc38daacc9',
    '57e4c379c383b7bc38daaccb',
    '57e4c382c383b7bc38daaccc'];


app.use(cors());
app.roles = [{ value: 1, label: 'admin' },
{ value: 2, label: 'super' },
{ value: 3, label: 'manager' }];

// var authCheck = jwt({
//     secret: new Buffer('V2tICkXzvkrTDZBeoNQggQ4B9jJV4RjL6b7jovB7VOahBQiL4gGxyt4G_2nFA8_J', 'base64'),
//     audience: 'j3xGUmcC6Br8PczpxOgRunZDwApBjwXP'
// });
//================================RESOURCE============================================================================
app.get('/api/getResources', passport.authenticate('jwt', { session: false }), function (req, res) {
    ResourceModel.find().populate('type').exec(function (err, resources) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(resources);
        }
    })
});
app.post('/api/addResource', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    var resource = new ResourceModel(req.body);
    resource.save((err, newItem) => {
        if (err) {
            return next(err);
        }
        res.status(200).send('OK');
    });
});
app.get('/api/getResource/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    ResourceModel.findOne({ _id: req.params.id })
        .exec(function (err, resource) {
            if (err) {
                res.send('error retriving resource\n' + err);
            }
            else {
                console.log(resource);
                res.json(resource);
            }
        });
});
app.put('/api/updateResource/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    ResourceModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { name: req.body.name, type: req.body.type } },
        { upsert: true },
        function (err, newResource) {
            if (err) {
                res.send('Error updating Resource\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.delete('/api/deleteResource/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    ResourceModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newResource) {
            if (err) {
                res.send('Error deleting Resource\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.get('/api/findResourceLike', passport.authenticate('jwt', { session: false }), function (req, res) {
    var searchString = req.param('searchString');
    findLike(ResourceModel, searchString).then((result) => {
        res.json(result);
    }).catch((res) => {
        res.send(res);
    });
});
//================================RESOURCE END============================================================================
//================================SITE============================================================================
app.post('/api/addSite', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    var site = new SiteModel(req.body);
    site.save((err, newItem) => {
        if (err) {
            return next(err);
        }
        res.status(200).send('OK');
    });
});
app.get('/api/getSite/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    SiteModel.findOne({ _id: req.params.id })
        .exec(function (err, site) {
            if (err) {
                res.send('error retriving site\n' + err);
            }
            else {
                console.log(site);
                res.json(site);
            }
        });
});
app.get('/api/getSites', passport.authenticate('jwt', { session: false }), function (req, res) {
    SiteModel.find(function (err, sites) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(sites);
        }
    })
});
app.put('/api/updateSite/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    SiteModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { name: req.body.name } },
        { upsert: true },
        function (err, newSite) {
            if (err) {
                res.send('Error updating site\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.delete('/api/deleteSite/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    SiteModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newSite) {
            if (err) {
                res.send('Error deleting site\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.get('/api/findSiteLike', passport.authenticate('jwt', { session: false }), function (req, res) {
    SiteModel.find(function (err, sites) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            var searchString = req.param('searchString');
            let objectArray = _.filter(sites, function (o) {
                return o.name.includes(searchString);
            });
            res.json(objectArray);
        }
    });
});
app.post('/api/addUserToSite/', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    SiteModel.findOne({ _id: req.param('siteId') })
        .exec(function (err, site) {
            if (err) {
                res.send('error retriving site\n' + err);
            }
            else {
                let newUserId = req.param('userId');
                let isInArray = site.user_ids.some(function (user) {
                    return user.equals(newUserId);
                });
                console.log('isInArray: ' + isInArray);
                if (isInArray === false) {
                    site.user_ids.push(req.param('userId'));
                    site.save((err, newItem) => {
                        if (err) {
                            return next(err);
                        }
                        res.status(200).send('OK');
                    });
                }
            }
        });
});
app.post('/api/removeUserFromSite/', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    SiteModel.findOne({ _id: req.param('siteId') })
        .exec(function (err, site) {
            if (err) {
                res.send('error retriving site\n' + err);
            }
            else {
                site.user_ids.pull(req.param('userId'));
                site.save((err, newItem) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send('OK');
                });
            }
        });
});

app.get('/api/getSiteUsers/:id', (req, res) => {
    SiteModel.findOne(
        { _id: req.params.id }).populate('user_ids') // <==
        .exec(function (err, site) {
            if (err) {
                res.send('Error updating Resource\n' + err);
            }
            else {
                res.send(site.user_ids);
            }
        });
})
//==========================================END SITE========================================================
app.post('/api/addType', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    var type = new TypeModel(req.body);
    type.save((err, newItem) => {
        if (err) {
            return next(err);
        }
        res.status(200).send('OK');
    });
});
app.get('/api/getType/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    TypeModel.findOne({ _id: req.params.id })
        .exec(function (err, type) {
            if (err) {
                res.send('error retriving type\n' + err);
            }
            else {
                console.log(type);
                res.json(type);
            }
        });
});
app.get('/api/getTypes', passport.authenticate('jwt', { session: false }), function (req, res) {
    TypeModel.find(function (err, types) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(types);
        }
    })
});
app.put('/api/updateType/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log('updating type: ' + req.body.name + ' ' + req.body.value);
    TypeModel.findOneAndUpdate(
        { _id: req.params.id },
        {
            $set: {
                name: req.body.name
                // , value: req.body.value 
            }
        },
        { upsert: true },
        function (err, newType) {
            if (err) {
                res.send('Error updating Type\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.delete('/api/deleteType/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    TypeModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newType) {
            if (err) {
                res.send('Error deleting Type\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.get('/api/findTypeLike', passport.authenticate('jwt', { session: false }), function (req, res) {
    TypeModel.find(function (err, types) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            var searchString = req.param('searchString');
            let objectArray = _.filter(types, function (o) {
                return o.name.includes(searchString);
            });
            res.json(objectArray);
        }
    });
});
//==========================================END SITE========================================================
//========================================== WORKER ========================================================
app.post('/api/addWorker', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    var worker = new WorkerModel(req.body);
    worker.save((err, newItem) => {
        if (err) {
            return next(err);
        }
        res.status(200).send('OK');
    });
});
app.get('/api/getWorker/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    WorkerModel.findOne({ _id: req.params.id })
        .exec(function (err, worker) {
            if (err) {
                res.send('error retriving worker\n' + err);
            }
            else {
                console.log(worker);
                res.json(worker);
            }
        });
});
app.get('/api/getWorkers', passport.authenticate('jwt', { session: false }), function (req, res) {
    WorkerModel.find(function (err, workers) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(workers);
        }
    })
});
app.put('/api/updateWorker/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log('updating Worker: ' + req.body.name + ' ' + req.body.value);
    WorkerModel.findOneAndUpdate(
        { _id: req.params.id },
        {
            $set: {
                name: req.body.name,
                hourlyRate: req.body.hourlyRate 
            }
        },
        { upsert: true },
        function (err, newWorker) {
            if (err) {
                res.send('Error updating worker\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.delete('/api/deleteWorker/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    WorkerModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newWorker) {
            if (err) {
                res.send('Error deleting worker\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.get('/api/findWorkerLike', passport.authenticate('jwt', { session: false }), function (req, res) {
    WorkerModel.find(function (err, workers) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            var searchString = req.param('searchString');
            let objectArray = _.filter(workers, function (o) {
                return o.name.includes(searchString);
            });
            res.json(objectArray);
        }
    });
});
//========================================== DailyWorker ========================================================
app.post('/api/addDailyWorker', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    var dailyWorker = new DailyWorkerModel(req.body);
    dailyWorker.save((err, newItem) => {
        if (err) {
            return next(err);
        }
        res.status(200).send('OK');
    });
});
app.get('/api/getDailyWorker/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyWorkerModel.findOne({ _id: req.params.id })
        .exec(function (err, dailyWorker) {
            if (err) {
                res.send('error retriving dailyWorker\n' + err);
            }
            else {
                console.log(dailyWorker);
                res.json(dailyWorker);
            }
        });
});
app.get('/api/getDailyWorkers', passport.authenticate('jwt', { session: false }), function (req, res) {
    let siteIds = req.param('sites');
    if (!Array.isArray(siteIds)) {
        siteIds = siteIds.split(',');
    }
    let date = req.param('date');
    DailyWorkerModel
        .find({
            date: req.param('date'),
            site:
            { $in: siteIds.map(function (o) { return mongoose.Types.ObjectId(o); }) }
        })
        .populate('worker')
        .exec(function (err, items) {
            if (err) {
                res.send('find no good' + err);
            }
            else {
                res.json(items);
            }
        })
});
app.get('/api/getAllDailyWorkers', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyWorkerModel
        .find()
        .populate([{
            path: 'worker',
            model: 'Worker'
        }, {
            path: 'site',
            model: 'Site'
        }])
        .exec(function (err, items) {
            if (err) {
                res.send('find no good' + err);
            }
            else {
                res.json(items);
            }
        })
});
app.put('/api/updateDailyWorker/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log('updating dailyWorker: ' + req.body.name + ' ' + req.body.value);
    DailyWorkerModel.findOneAndUpdate(
        { _id: req.params.id },
        {
            $set: {
                hourlyRate: req.body.hourlyRate,
                hours: req.body.hours,
                date: req.body.date,
                site: req.body.site,
                worker: req.body.worker,
                commute: req.body.commute,
                user: req.body.user
            }
        },
        { upsert: true },
        function (err, newDailyWorker) {
            if (err) {
                res.send('Error updating dailyWorker\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.delete('/api/deleteDailyWorker/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyWorkerModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newDailyWorker) {
            if (err) {
                res.send('Error deleting dailyWorker\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.get('/api/findDailyWorkerLike', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyWorkerModel.find(function (err, dailyWorkers) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            var searchString = req.param('searchString');
            let objectArray = _.filter(dailyWorkers, function (o) {
                return o.name.includes(searchString);
            });
            res.json(objectArray);
        }
    });
});
//=======================================================DEFAULT
app.delete('/api/deleteDailyDefault/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyDefaultModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newType) {
            if (err) {
                res.send('Error deleting Type\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.post('/api/addDailyDefault', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    var type = new DailyDefaultModel(req.body);
    type.save((err, newItem) => {
        if (err) {
            return next(err);
        }
        res.status(200).send('OK');
    });
});
app.get('/api/getDailyDefaults', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyDefaultModel.find(function (err, types) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(types);
        }
    })
});
//=======================================================DEFAULT
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
app.get('/api/getUserSites/:id', (req, res) => {
    UserModel.findById(req.params.id)
        .populate('role')
        .exec(function (err, user) {
            let searchObject = {};
            if (user.role._id == '57d27d4313d468481b1fe12e') {
                SiteModel.find(function (err, sites) {
                    if (err) {
                        res.send('find no good' + err);
                    }
                    else {
                        res.json(sites);
                    }
                });
            }
            else {
                SiteModel.find({ user_ids: req.params.id }, function (err, sites) {
                    if (err) {
                        res.send('find no good' + err);
                    }
                    else {
                        res.json(sites);
                    }
                });
            }
        });
});
//==========================================END USERS========================================================
//==========================================Daily Resources========================================================
app.get('/api/getDailyResources', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log('date: ' + req.param('date'));
    DailyResourceModel
        .find({ date: req.param('date'), site: req.param('site') })
        .populate([{
            path: 'resourceType',
            model: 'ResourceType'
        }, {
            path: 'site',
            model: 'Site'
        }])
        .exec(function (err, items) {
            if (err) {
                res.send('find no good' + err);
            }
            else {
                res.json(items);
            }
        })
});
app.get('/api/getAllDailyResources', passport.authenticate('jwt', { session: false }), function (req, res) {
    let siteIds = req.param('sites');
    if (!Array.isArray(siteIds)) {
        siteIds = siteIds.split(',');
    }
    let date = req.param('date');
    DailyResourceModel
        .find({
            date: req.param('date'),
            site:
            { $in: siteIds.map(function (o) { return mongoose.Types.ObjectId(o); }) }
        })
        .populate([{
            path: 'resourceType',
            model: 'ResourceType'
        }, {
            path: 'site',
            model: 'Site'
        }])
        .exec(function (err, items) {
            if (err) {
                res.send('find no good' + err);
            }
            else {
                res.json(items);
            }
        })
});
app.post('/api/addDailyResource', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log(req.body);
    var dailyResource = new DailyResourceModel(req.body);
    dailyResource.save((err, newItem) => {
        if (err) {
            res.send('Error adding DailyResource\n' + err);
        }
        res.status(200).send('OK');
    });
});
app.post('/api/addLastSiteResources', passport.authenticate('jwt', { session: false }), function (req, res) {
    let siteId = req.param('siteId');
    let date = req.param('date');

    console.log('\n SITE ID: ' + siteId + ' \n')

    DailyResourceModel.findOne({ 'site': siteId })
        .populate([{
            path: 'resourceType',
            model: 'ResourceType'
        }, {
            path: 'site',
            model: 'Site'
        }])
        .sort('-date').exec(function (err, resource) {
            console.log('Last known date: ' + resource.date);
            if (err) {
                res.send('Error adding DailyResource\n' + err);
            }
            else {
                //res.send(resource)
                DailyResourceModel
                    .find({
                        date: resource.date,
                        site: siteId
                    })
                    .populate([{
                        path: 'resourceType',
                        model: 'ResourceType'
                    }, {
                        path: 'site',
                        model: 'Site'
                    }])
                    .exec(function (err, items) {
                        if (err) {
                            res.send('find no good' + err);
                        }
                        else {
                            _.forEach(items, (item) => {
                                var dailyResource = new DailyResourceModel();
                                dailyResource.resourceType = item.resourceType;
                                dailyResource.date = date;
                                dailyResource.site = item.site;
                                dailyResource.amount = item.amount;
                                dailyResource.save((err, newItem) => {
                                    if (err) {
                                        res.send('Error adding default DailyResource\n' + err);
                                    }
                                });
                            })
                            res.json("Success");
                        }
                    })
            }
        });
});
app.put('/api/updateDailyResource/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyResourceModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { date: req.body.date, site: req.body.site, resourceType: req.body.resourceType, amount: req.body.amount, } },
        { upsert: true },
        function (err, newDailyResource) {
            if (err) {
                res.send('Error updating DailyResource\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.delete('/api/deleteDailyResource/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyResourceModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newDailyResource) {
            if (err) {
                res.send('Error deleting DailyResource\n' + err);
            }
            else {
                res.send(204);
            }
        });
});

function getDailyResources(date, siteId) {
    return DailyResourceModel
        .find({ date: date, site: { _id: siteId } })
        .populate([{
            path: 'resourceType',
            model: 'ResourceType'
        }, {
            path: 'site',
            model: 'Site'
        }])
        .exec(function (err, items) {
            if (err) {
                res.send('find no good' + err);
            }
            else {
                // console.log('items = ' + items);
                return items;
            }
        })
}
app.post('/api/addDailyDefaultResources', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyDefaultModel
        .find()
        .exec(function (err, items) {
            if (err) {
                res.send('find no good' + err);
            }
            else {
                _.forEach(items, (object) => {
                    var dailyResource = new DailyResourceModel(req.body);
                    dailyResource.resourceType = object;
                    dailyResource.amount = 0;
                    console.log('dailyResource= ' + dailyResource);
                    dailyResource.save((err, newItem) => {
                        if (err) {
                            res.send('Error adding default DailyResource\n' + err);
                        }
                    });
                });
                res.status(200).send('OK');
            }
        })
});
//==========================================END Daily Resources========================================================




























app.get('/api/getAllDailyComments', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log('site ============ ' + req.param('sites'));
    let siteIds = req.param('sites');
    if (!Array.isArray(siteIds)) {
        siteIds = siteIds.split(',');
    }
    let date = req.param('date');
    DailyCommentModel
        .find({
            date: req.param('date'),
            site:
            { $in: siteIds.map(function (o) { return mongoose.Types.ObjectId(o); }) }
        })
        .populate([{
            path: 'user',
            model: 'User'
        }, {
            path: 'site',
            model: 'Site'
        }])
        .exec(function (err, items) {
            if (err) {
                res.send('find no good' + err);
            }
            else {
                res.json(items);
            }
        })
});
app.post('/api/addDailyComment', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log(req.body);
    var dailyComment = new DailyCommentModel(req.body);
    dailyComment.save((err, newItem) => {
        if (err) {
            res.send('Error adding DailyComment\n' + err);
        }
        res.status(200).send('OK');
    });
});
app.put('/api/updateDailyComment/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyCommentModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { date: req.body.date, site: req.body.site, user: req.body.user, amount: req.body.amount, } },
        { upsert: true },
        function (err, newDailyComment) {
            if (err) {
                res.send('Error updating DailyComment\n' + err);
            }
            else {
                res.send(204);
            }
        });
});
app.delete('/api/deleteDailyComment/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
    DailyCommentModel.findOneAndRemove(
        { _id: req.params.id },
        function (err, newDailyComment) {
            if (err) {
                res.send('Error deleting DailyComment\n' + err);
            }
            else {
                res.send(204);
            }
        });
});

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
mongoose.connect('mongodb://user1:a1345678@ds015995.mlab.com:15995/velevltest');
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

    //db.example.update({}, {$unset: {words:1}} , {multi: true});

    TypeModel.update({}, { $unset: { value: 1 } }, { multi: true });
    RoleModel.update({}, { $unset: { value: 1 } }, { multi: true });
    SiteModel.find(function (err, sites) {
        if (err) { return console.error('find no good' + err) };
        console.log('all sites' + sites);
    })
    UserModel.find(function (err, users) {
        if (err) { return console.error('find no good' + err) };
        console.log('all users' + users);
    })
});



// app.get('/api/public', passport.authenticate('jwt', { session: false }), function (req, res) {
//     res.json({ message: 'Hello from public blah blah' });
// });
// app.get('/api/private', authCheck, function (req, res) {
//     res.json({ message: 'Hello from private blah blah' });
// });
// app.get('/api/enteries', passport.authenticate('jwt', { session: false }), function (req, res) {
//     var objectArray = [{ Name: 'shlomo1' }, { Name: 'shlomo1' }];
//     res.json(objectArray);
// });
// app.get('/api/secretEnteries', authCheck, function (req, res) {
//     var objectArray = [{ Name: 'shlomo2 Secret' }, { Name: 'shlomo Secret' }];
//     res.json(objectArray);
// });
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