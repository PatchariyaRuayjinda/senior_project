const express = require('express')
const router = express.Router()

const {findAllProductInShelf , addInShelf} = require('../controllers/productInShelf')

//@Endpoint http://localhost:3001/api/findAllProductInShelf
//@method GET
//@Access Publish
router.get('/findAllProductInShelf', findAllProductInShelf)

//@Endpoint http://localhost:3001/api/addShelf
//@method POST
//@Access Publish
router.post('/addInShelf', addInShelf)

module.exports = router