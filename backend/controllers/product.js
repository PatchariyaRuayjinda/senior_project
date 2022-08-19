const Product = require('../models/product')
const ProductDetail = require('../models/productDetail')
const Disbursement = require('../models/disbursement')
var mongoose = require('mongoose');

exports.findAllProduct = async(req, res, next) => {
    try{
        const product = await Product.find({})
        res.send(product)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.findOneProduct = async(req, res, next) => {
    try{
        const {id} = req.params
        const product = await Product.findOne({_id: id}).exec()
        res.send(product)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addProduct = async(req, res) => {
    try{
        const disbursementPlus = await Disbursement.aggregate([
            {
                $match:{state:true}
            },
            {
                $group:{_id:"$product_id", totalQuantity:
                {$sum:"$quantity"}
            }
            },
        ]).sort({totalQuantity:-1})
        const disbursementMinus = await Disbursement.aggregate([
            {
                $match:{state:false}
            },
            {
                $group:{_id:"$product_id", totalQuantity:
                {$sum:"$quantity"}
            }
        }]).sort({totalQuantity:-1})
        const productDetail = await ProductDetail.aggregate([
            {$lookup:{
                from: 'products',
                localField: 'product_id',
                foreignField: '_id',
                as: 'product'
            }},
            {$group:{_id:"$product_id", 
            totalQuantity:
            {
                $sum:"$receiveQuantity"
            }
        }
        }]).sort({totalQuantity:-1})
        var percentABC
        var totalMovement = 0;
        for(let i =0 ; i < disbursementPlus.length ; i++){
            for(let j=0 ; j < disbursementMinus.length ; j++){
                if(JSON.stringify(disbursementPlus[i]._id) == JSON.stringify(disbursementMinus[j]._id)){
                    disbursementPlus[i].totalQuantity = disbursementPlus[i].totalQuantity - disbursementMinus[j].totalQuantity
                    break;
                }
        }
        }
        var momenttotal = []
        // เบิกจ่าย + บวกสินค้าเข้าคลัง ให้เป็น Movement
        for(let i =0 ; i < productDetail.length ; i++){
            if(disbursementPlus.length != 0){
                for(let j=0 ; j < disbursementPlus.length ; j++){
                    // console.log("11111111111111")
                    if(JSON.stringify(productDetail[i]._id) == JSON.stringify(disbursementPlus[j]._id)){
                        // productABC.push({ movement: productDetail[i].totalQuantity + disbursementPlus[j].totalQuantity})
                        // productDetail[i].totalQuantity = productDetail[i].totalQuantity + disbursementPlus[j].totalQuantity
                        momenttotal[i] = productDetail[i].totalQuantity + disbursementPlus[j].totalQuantity
                        break;
                    }else{
                        momenttotal[i] = productDetail[i].totalQuantity + disbursementPlus[j].totalQuantity
                    }
                }
            }else{
                momenttotal[i] = productDetail[i].totalQuantity
            }
        }

        for (let index = 0; index < productDetail.length; index++) {
            totalMovement = totalMovement + productDetail[index].totalQuantity;
        }

        var {productName, quantity, productStatus, price, group } = req.body;
        totalMovement = totalMovement + parseInt(quantity);
        // console.log("quantity",quantity)
        percentABC = (parseInt(quantity) / totalMovement) * 100;
        console.log(percentABC)
        if(percentABC >= 80){
            group = 'A'
        }else if(percentABC >= 5 && percentABC <= 15){
            group = 'B'
        }else{
            group = 'C'
        }

        var product = await Product.findOne({productName})
        
        if(product) {
            return res.status(400).send('Product have been in stock.')
        } 
        product = new Product({
            productName,
            quantity,
            productStatus,
            price,
            group
        })
        await product.save();
        // console.log(product)
        // res.send('Add Product Success!')
        res.send(product)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.updateProduct = async(req, res) => {
    try{
        console.log('updateproduct',req.body)
        const {_id, productName, productStatus, price, group } = req.body;
        var newProudct = {
            productName,
            productStatus,
            price,
            group
        }
        await Product.updateOne(
            {_id: _id},
            {$set: newProudct}
        )
        res.send('Update Product Success!!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.deleteProduct = async(req, res) => {
    try{
        const {id} = req.params
        const product = await Product.deleteOne({_id: id}).exec()
        res.send('Delete Product Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.disbursement = async(req, res) => {
    try { 
        const {id, quantity} = req.body
        const total = await Product.findOne({_id: id})
        .select('quantity').exec()
        // console.log('total',total.quantity)
        var newQuantity = parseInt(total.quantity) - parseInt(quantity);
        await Product.updateOne(
            {_id: id},
            {quantity: newQuantity}
        )
        res.send('Withdraw Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.withdraw = async(req, res) => {
    try{
        const {id, quantity} = req.body
        const total = await Product.findOne({_id: id})
        .select('quantity').exec()
        // console.log('total',total.quantity)
        var newQuantity = parseInt(total.quantity) + parseInt(quantity);
        await Product.updateOne(
            {_id: id},
            {quantity: newQuantity}
        )
        res.send('Return Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}