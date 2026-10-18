const express = require('express')
const router = express.Router()

//controller 
const { findAllZone, addZone, updateZone, deleteZone, findOneZone } = require('../controllers/zone')

//@Endpoint http://localhost:3001/api/findAllZone
//@method GET
//@Access Publish
router.get('/findAllZone', findAllZone)

//@Endpoint http://localhost:3001/api/findOneZone
//@method GET
//@Access Publish
router.get('/findOneZone/:id', findOneZone)

//@Endpoint http://localhost:3001/api/addZone
//@method POST
//@Access Publish
router.post('/addZone', addZone)

//@Endpoint http://localhost:3001/api/updateZone
//@method PUT
//@Access Publish
router.put('/updateZone', updateZone)

//@Endpoint http://localhost:3001/api/deleteZone
//@method DELETE
//@Access Publish
router.delete('/deleteZone/:id', deleteZone)

module.exports = router