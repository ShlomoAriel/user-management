var express = require('express')
  , router = express.Router()

router.use('/', require('./userController'))
router.use('/', require('./roleController'))

module.exports = router