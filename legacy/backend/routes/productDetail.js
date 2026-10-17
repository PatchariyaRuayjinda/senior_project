const express = require('express')
const router = express.Router()

//controller
const {addProductDetail, findAllProductDetail, updateProductDetail, deleteProductDetail, findOneProductDetail} = require('../controllers/productDetail')

//@Endpoint http://localhost:3001/api/findAllProductDetail
//@method GET
//@Access Publish
router.get('/findAllProductDetail', findAllProductDetail)

//@Endpoint http://localhost:3001/api/findOneProductDetail
//@method GET
//@Access Publish
router.get('/findOneProductDetail/:id', findOneProductDetail)

//@Endpoint http://localhost:3001/api/addProductDetail
//@method POST
//@Access Publish
router.post('/addProductDetail', addProductDetail)

//@Endpoint http://localhost:3001/api/updateProductDetail
//@method PUT
//@Access Publish
router.put('/updateProductDetail', updateProductDetail)

//@Endpoint http://localhost:3001/api/deleteProductDetail
//@method delete
//@Access Publish
router.delete('/deleteProductDetail/:id', deleteProductDetail)

module.exports = router