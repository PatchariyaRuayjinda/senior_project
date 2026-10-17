const express = require('express')
const router = express.Router()

//controller
const {
    findAllDepartment,
    addDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/department')

//@Endpoint http://localhost:3001/api/findAllDepartment
//@method GET
//@Access Publish
router.get('/findAllDepartment', findAllDepartment)

//@Endpoint http://localhost:3001/api/addDepartment
//@method POST
//@Access Publish
router.post('/addDepartment', addDepartment)

//@Endpoint http://localhost:3001/api/updateDepartment
//@method PUT
//@Access Publish
router.put('/updateDepartment', updateDepartment)

//@Endpoint http://localhost:3001/api/deleteDepartment
//@method DELETE
//@Access Publish
router.delete('/deleteDepartment/:id', deleteDepartment)

module.exports = router