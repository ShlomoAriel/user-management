var express = require('express')
  , router = express.Router()
  , passport = require('passport')
  , RoleModel = require('../models/role')
  , app = express()

app.use(passport.initialize());
require('../config/passport')(passport);

router.get('/api/getRoles', passport.authenticate('jwt', { session: false }), function (req, res) {
    RoleModel.find().populate('type').exec(function (err, roles) {
        if (err) {
            res.send('find no good' + err);
        }
        else {
            res.json(roles);
        }
    })
});


//-------------------------------------------------------------------------------------------------
router.post('/api/addRole', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    console.log('adding role');
    var role = new RoleModel(req.body);
    role.save((err, newItem) => {
        if (err) {
            return next(err.code);
        }
        res.status(200).send('OK');
    });
});
//----------------------------------------------------------------------------------------------------
router.put('/api/updateRole/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
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
//----------------------------------------------------------------------------------------------------
router.delete('/api/deleteRole/:id', passport.authenticate('jwt', { session: false }), function (req, res) {
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

module.exports = router
