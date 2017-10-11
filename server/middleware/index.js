const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

module.exports = configureMiddleware;

function configureMiddleware(app) {
  // log to console
  app.use(morgan('dev'));

  app.use(bodyParser.json()); // for parsing application/json
  app.use(bodyParser.urlencoded({ extended: true })); // for parsing       application/x-www-form-urlencoded

  app.use(cors());
}
