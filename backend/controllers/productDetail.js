const ProductDetail = require('../models/productDetail')

exports.findAllProductDetail = async(req, res) => {
    try{
        const productDetail = await ProductDetail.find({})
        res.send(productDetail)
    }catch{
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addProductDetail = async(req, res) => {
    try{
        const {productStatus, receiveDate, expireDate, receiveQuantity, product_id} = req.body
        var ProductDeatil = new ProductDetail({
            productStatus, 
            receiveDate, 
            expireDate, 
            receiveQuantity, 
            product_id
        })
        await ProductDeatil.save()
        res.send('add ProductDetail Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.updateProductDetail = async(req, res) => {
    try{
        const {
            id, 
            productStatus, 
            receiveDate,
            expireDate, 
            receiveQuantity, 
            product_id
        } = req.body
        console.log(req.body)
        var newProductDetail = {
            productStatus, 
            receiveDate, 
            expireDate, 
            receiveQuantity, 
            product_id
        }
        await ProductDetail.updateOne(
            {_id: id},
            {$set: newProductDetail}
        )
        res.send('Update ProductDetail Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.deleteProductDetail = async(req, res) => {
    try{
        const {id} = req.params
        // console.log( id )
        const productDetail = await ProductDetail.deleteOne({_id: id})
        .exec()
        res.send('Delete ProductDetail Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}