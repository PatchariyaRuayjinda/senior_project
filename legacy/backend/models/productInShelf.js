const mongoose = require('mongoose');

const ProductInShelfSchema = new mongoose.Schema({
    product_id:{type: mongoose.ObjectId},
    shelf_id:{type: mongoose.ObjectId}
})

module.exports = productInShelf = mongoose.model('productInShelf', ProductInShelfSchema)