const express = require('express')
const router = express.Router()

const {addInShelf} = require('../controllers/productInShelf')

//@Endpoint http://localhost:3001/api/addShelf
//@method POST
//@Access Publish
router.post('/addInShelf', addInShelf)

module.exports = router