// =============MODELS===================

const UserModel = require('./models/user');
const RoleModel = require('./models/role');

const configureRouters = require('./controllers');

const passport = require('passport');
const configurePassport = require('./config/passport');
module.exports = {
  init,
};

function init(app, { db, secret }, roleNames, role) {
  // Use the passport package in our application
  app.use(passport.initialize());
  // pass passport for configuration
  configurePassport(passport, { secret });

  db.once('open', function() {
    initDB(roleNames, role).then(v => {
      UserModel.find(function(err, users) {
        if (err) {
          return console.error('find no good' + err);
        }
        console.log('init db with users: ' + users.length);
      });
    });
  });

  app.use(configureRouters({ secret }));
}

function initDB(roleNames, role) {
  return initRoles(roleNames).then(v => {
    return initUsers(role);
  });
}

function initRoles(roleNames) {
  return Promise.all(roleNames.map(v => {
    var role = new RoleModel({
      name: v,
    });
    return role.save();
  }));
}

function initUsers(rolename) {
  return new Promise((resolve, reject) => {
    let roles = RoleModel.findOne({
      name: rolename
    }, (err, data) => {
      if (err) {
        console.error('find no role' + err);
        return reject(err);
      }
      var user = new UserModel({
        email: 'shlomoariel@gmail.com',
        name: 'Shlomo',
        password: 'a1345678',
        role: {
          _id: data._id,
          name: data.name,
        },
      });
      user.save().then(resolve);
    });
  });
}
