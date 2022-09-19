const { default: mongoose } = require('mongoose')
const ProductDetail = require('../models/productDetail')

exports.findAllProductDetail = async(req, res) => {
    try{
        // const productDetail = await ProductDetail.find({})
        const productDetail = await ProductDetail.aggregate([
            {$lookup:{
                from: 'products',
                localField: 'product_id',
                foreignField: '_id',
                as: 'product'
            }}
        ]).sort({_id: -1})
        res.send(productDetail)
    }catch{
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.findOneProductDetail = async(req, res, next) => {
    try{
        const {id} = req.params
        console.log(id)
        // const productDetail = await ProductDetail.findOne({_id: id}).exec()
        const productDetail = await ProductDetail.aggregate([
            {$lookup:{
                from: 'products',
                localField: 'product_id',
                foreignField: '_id',
                as: 'product'
            }},
            {$match: {
                _id: mongoose.Types.ObjectId(id)
            }}
        ])
        res.send(productDetail)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addProductDetail = async(req, res) => {
    try{
        console.log(req.body)
        const {receiveDate, expireDate, receiveQuantity, product_id} = req.body
        var ProductDeatil = new ProductDetail({
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
        // req.body.value
        const {
            _id, 
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
            {_id: _id},
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