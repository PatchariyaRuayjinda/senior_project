const ProductInShelf = require('../models/productInShelf')

exports.findAllProductInShelf = async(req, res)=>{
    try{
        const findInShelf = await ProductInShelf.aggregate([
            {$lookup:{
                from: 'products',
                localField: 'product_id',
                foreignField: '_id',
                as: 'product'
            }},
            {$lookup: {
                from: "shelves",
                localField: "shelf_id",
                foreignField: "_id",
                as: "shelf"
            }},
            {"$project": {
                "product.productName": 1,
                "product.group": 1,
                "shelf.shelfNumber": 1,
                "shelf.floorNumber": 1,
                "shelf.lockNumber": 1
            }}
        ])
        console.log(findInShelf)
        res.send(findInShelf)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

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