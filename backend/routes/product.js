const express = require('express')
const router = express.Router()

//controller
const { findAllProduct, addProduct, updateProduct, deleteProduct, withdraw, returns, findOneProduct, findOneProduct2 } = require('../controllers/product')

//@Endpoint http://localhost:3001/api/findAllproduct
//@method GET
//@Access Publish
router.get('/findAllProduct', findAllProduct)

//@Endpoint http://localhost:3001/api/findOneProduct
//@method GET
//@Access Publish
router.get('/findOneProduct/:id', findOneProduct)

//@Endpoint http://localhost:3001/api/findOneProduct2
//@method GET
//@Access Publish
router.get('/findOneProduct2/:id', findOneProduct2)

//@Endpoint http://localhost:3001/api/addProduct
//@method POST
//@Access Publish
router.post('/addProduct', addProduct)

//@Endpoint http://localhost:3001/api/updateProduct
//@method PUT
//@Access Publish
router.put('/updateProduct', updateProduct)

//@Endpoint http://localhost:3001/api/deleteProduct
//@method DELETE
//@Access Publish
router.delete('/deleteProduct/:id', deleteProduct)

//@Endpoint http://localhost:3001/api/withdraw 
//@method PATCH
//@Access Publish
router.patch('/withdraw', withdraw)

//@Endpoint http://localhost:3001/api/return
//@method PATCH
//@Access Publish
router.patch('/returns', returns)

module.exports = router