const express = require('express')
const router = express.Router()

const { outMovement, addGroupABC } = require('../controllers/movement')

//@Endpoint http://localhost:3001/api/outMovement
//@method GET
//@Access Publish
router.get('/outMovement', outMovement)

//@Endpoint http://localhost:3001/api/appGroupABC
//@method put
//@Access Publish
router.patch('/addGroupABC', addGroupABC)

module.exports = router