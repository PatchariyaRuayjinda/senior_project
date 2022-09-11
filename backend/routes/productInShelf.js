const express = require('express')
const router = express.Router()

const {findAllProductInShelf , addInShelf, findShelfByZone, updateShelf, updateShelfProduct, findProductInShelf} = require('../controllers/productInShelf')

//@Endpoint http://localhost:3001/api/findAllProductInShelf
//@method GET
//@Access Publish
router.get('/findAllProductInShelf', findAllProductInShelf)

//@Endpoint http://localhost:3001/api/findProductInShelf
//@method GET
//@Access Publish
router.get('/findProductInShelf', findProductInShelf)

//@Endpoint http://localhost:3001/api/addShelf
//@method POST
//@Access Publish
router.post('/addInShelf', addInShelf)

//@Endpoint http://localhost:3001/api/findShelfByZone
//@method GET
//@Access Publish
router.get('/findShelfByZone/:zone', findShelfByZone)

//@Endpoint http://localhost:3001/api/updateShelf
//@method PUT
//@Access Publish
router.put('/updateShelf', updateShelf)

module.exports = router