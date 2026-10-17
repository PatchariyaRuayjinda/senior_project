const express = require('express')
const router = express.Router()

//controller 
const { findAllDisbursement, addDisbursement, deleteDisbursement, updateDisbursement, findOneDisbursement } = require('../controllers/disbursement')

//@Endpoint http://localhost:3001/api/findAllDisbursement
//@method GET
//@Access Publish
router.get('/findAllDisbursement', findAllDisbursement)

//@Endpoint http://localhost:3001/api/findOneDisbursement
//@method GET
//@Access Publish
router.get('/findOneDisbursement/:id', findOneDisbursement)

//@Endpoint http://localhost:3001/api/addDisbursement
//@method POST
//@Access Publish
router.post('/addDisbursement', addDisbursement)

//@Endpoint http://localhost:3001/api/updateDisbursement
//@method PATCH
//@Access Publish
router.patch('/updateDisbursement', updateDisbursement)

//@Endpoint http://localhost:3001/api/deleteDisbursement
//@method DELETE
//@Access Publish
router.delete('/deleteDisbursement/:id', deleteDisbursement)

module.exports = router