const ProductInShelf = require('../models/productInShelf')

exports.addInShelf = async(req, res) => {
    try {
        // console.log(req.body)
        const {product_id, shelf_id} = req.body
        var payload = new ProductInShelf({
            product_id,
            shelf_id,
        })
        await payload.save()
        res.send('add Product Shelf Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}