const { Router } = require('express');
const router = Router();

const configureUserRoutes = require('./userController');
const configureRoleRoutes = require('./roleController');

module.exports = configureRoutes;

function configureRoutes({ secret }) {
  router.use(configureUserRoutes(secret));
  router.use(configureRoleRoutes());
  return router;
}
