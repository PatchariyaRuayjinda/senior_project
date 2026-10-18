const express = require('express')
const router = express.Router()

//controller
const {
    findAllPosition,
    addPosition,
    updatePosition,
    deletePostion
} = require('../controllers/Position')

//@Endpoint http://localhost:3001/api/findAllPosition
//@method GET
//@Access Publish
router.get('/findAllPosition', findAllPosition)

//@Endpoint http://localhost:3001/api/addPosition
//@method POST
//@Access Publish
router.post('/addPosition', addPosition)

//@Endpoint http://localhost:3001/api/updatePosition
//@method PUT
//@Access Publish
router.put('/updatePosition', updatePosition)

//@Endpoint http://localhost:3001/api/deletePostion
//@method DELETE
//@Access Publish
router.delete('/deletePostion/:id', deletePostion)

module.exports = router