// =============MODELS===================

const UserModel = require('./models/user');
const RoleModel = require('./models/role');

const configureRouters = require('./controllers');

const passport = require('passport');
const configurePassport = require('./config/passport');
module.exports = {
  init,
};

function init(app, { db, secret }) {
  // Use the passport package in our application
  app.use(passport.initialize());
  // pass passport for configuration
  configurePassport(passport, { secret });

  db.once('open', function() {
    initDB();
    UserModel.find(function(err, users) {
      if (err) {
        return console.error('find no good' + err);
      }
      // console.log('all users' + users);
    });
  });

  app.use(configureRouters({ secret }));
}

function initDB() {
  initRoles();
  initUsers();
}

function initRoles() {
  var role1 = new RoleModel({
    _id: '57d27d4313d468481b1fe12e',
    name: 'מנהל',
  });
  role1.save();
  var role2 = new RoleModel({
    _id: '57d2805f13d468481b1fe130',
    name: 'מנהל איזור',
  });
  role2.save();
  var role3 = new RoleModel({
    _id: '57d2837a13d468481b1fe133',
    name: 'מפקח',
  });
  role3.save();
}

function initUsers() {
  var user = new UserModel({
    email: 'shlomoariel@gmail.com',
    name: 'Shlomo',
    password: 'a1345678',
    role: {
      _id: '57d27d4313d468481b1fe12e',
      name: 'מנהל',
    },
  });
  user.save();
}
