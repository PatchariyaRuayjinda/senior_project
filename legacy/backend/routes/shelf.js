const express = require('express')
const router = express.Router()

//controller 
const { findAllShelf, addShelf, updateShelf, deleteShelf, findOneShelf, findShelfByZoneFalse } = require('../controllers/shelf')

//@Endpoint http://localhost:3001/api/findAllShelf
//@method GET
//@Access Publish
router.get('/findAllShelf', findAllShelf)

//@Endpoint http://localhost:3001/api/findOneShelf
//@method GET
//@Access Publish
router.get('/findOneShelf/:id', findOneShelf)

//@Endpoint http://localhost:3001/api/findShelfByZoneFalse
//@method GET
//@Access Publish
router.get('/findShelfByZoneFalse/:zone', findShelfByZoneFalse)

//@Endpoint http://localhost:3001/api/addShelf
//@method POST
//@Access Publish
router.post('/addShelf', addShelf)

//@Endpoint http://localhost:3001/api/updateShelf
//@method PUT
//@Access Publish
router.put('/updateShelf', updateShelf)

//@Endpoint http://localhost:3001/api/deleteShelf
//@method DELETE
//@Access Publish
router.delete('/deleteShelf/:id', deleteShelf)

module.exports = router