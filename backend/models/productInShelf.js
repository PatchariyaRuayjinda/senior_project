const mongoose = require('mongoose')

const productInShelfSchema = new mongoose.Schema(
    {
        product_id:{type: mongoose.ObjectId},
        shelf_id:{type: mongoose.ObjectId}
    }
)
module.exports = productinshelf = mongoose.model('productinshelf', productInShelfSchema)