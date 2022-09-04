const ProductInShelf = require('../models/productInShelf')
const ProductDetail = require('../models/productDetail')
const Disbursement = require('../models/disbursement')

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
                "product_id": 1,
                "product.productName": 1,
                "product.group": 1,
                "shelf.shelfNumber": 1,
                "shelf.floorNumber": 1,
                "shelf.lockNumber": 1
            }}
        ])
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
            {$group:{_id:"$product_id", 
            totalQuantity:
            {
                $sum:"$receiveQuantity"
            }
        }
        }]).sort({totalQuantity:-1})
        const productDetail2 = await ProductDetail.aggregate([
            {$lookup:{
                from: 'products',
                localField: 'product_id',
                foreignField: '_id',
                as: 'product'
            }}
        ])

        // เบิกจ่าย ลบ เบิกคืน 
        for(let i =0 ; i < disbursementPlus.length ; i++){
                for(let j=0 ; j < disbursementMinus.length ; j++){
                    // console.log("disbursementPlus",disbursementPlus[i]._id)
                    // console.log("disbursementMinus",disbursementMinus[j]._id)
                    if(JSON.stringify(disbursementPlus[i]._id) == JSON.stringify(disbursementMinus[j]._id)){
                        // console.log("Disbursement + ",disbursementPlus[i].totalQuantity)
                        // เบิกจ่าย - เบิกคืน แล้วเอาไปเก็บที่เบิกจ่าย
                        disbursementPlus[i].totalQuantity = disbursementPlus[i].totalQuantity - disbursementMinus[j].totalQuantity
                        // console.log("Disbursement == ",disbursementPlus[i].totalQuantity)
                        break;
                    }
            }
        }

    // ผลจากการลบของ = เบิกจ่าย - เบิกคืน
    // console.log("Disbursement ",disbursementPlus)
    
    var momenttotal = []
    // เบิกจ่าย + บวกสินค้าเข้าคลัง ให้เป็น Movement
    for(let i =0 ; i < productDetail.length ; i++){
        if(disbursementPlus.length != 0){
            for(let j=0 ; j < disbursementPlus.length ; j++){
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

    var totalMovement = 0;
    // console.log(momenttotal)
    for (let index = 0; index < productDetail.length; index++) {
        totalMovement = totalMovement + productDetail[index].totalQuantity;
    }
    // console.log(totalMovement)
    
    // หาเปอร์เซ็นต์ ABC
    for (let index = 0; index < productDetail.length; index++) {
        // console.log(productDetail[index].totalQuantity , "เริ่ม")
        // console.log(totalMovement , "ตัวคำนวน")
        productDetail[index].totalQuantity = (productDetail[index].totalQuantity / totalMovement) * 100
        // console.log(productDetail[index].totalQuantity , "จบ")
    }

    // lookup product name
    producName = []
    for (let i = 0; i < productDetail.length; i++) {
        for (let j = 0; j < productDetail2.length; j++) {
            if(JSON.stringify(productDetail[i]._id) == JSON.stringify(productDetail2[j].product_id)){
                producName[i] =  productDetail2[j].product[0].productName
            }
        }
        // console.log(producName)
    }
    testom = []
    let scoreA = 80;
    let scoreB = 15;

    var productABC = []
    // หา ZONE ของ สิ่นค้า
    // let scoreA = 80;
    // let scoreB = 15;
    for (let index = 0; index < productDetail.length; index++) {
        if(scoreA >= 0 && scoreA){
            for (let j = 0; j < findInShelf.length; j++){
                if(JSON.stringify(findInShelf[j].product_id) == JSON.stringify(productDetail[index]._id)){
                    if("A" == findInShelf[j].product[0].group){
                        productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "A" , shelfNumber : findInShelf[j].shelf[0].shelfNumber , floorNumber : findInShelf[j].shelf[0].floorNumber , lockNumber : findInShelf[j].shelf[0].lockNumber})
                    }else{
                        productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "A" , shelfNumber : "" , floorNumber : "" , lockNumber : ""})
                    }
                    break;
                }
            }
            scoreA = scoreA - productDetail[index].totalQuantity
        }else if(scoreB >= 0){
            for (let j = 0; j < findInShelf.length; j++){
                if(JSON.stringify(findInShelf[j].product_id) == JSON.stringify(productDetail[index]._id)){
                    if("B" == findInShelf[j].product[0].group){
                        productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "B" , shelfNumber : findInShelf[j].shelf[0].shelfNumber , floorNumber : findInShelf[j].shelf[0].floorNumber , lockNumber : findInShelf[j].shelf[0].lockNumber})
                    }else{
                        productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "B" , shelfNumber : "" , floorNumber : "" , lockNumber : ""})
                    }
                    break;
                }
            }
            scoreB = scoreB - productDetail[index].totalQuantity
        }else{
            for (let j = 0; j < findInShelf.length; j++){
                if(JSON.stringify(findInShelf[j].product_id) == JSON.stringify(productDetail[index]._id)){
                    if("C" == findInShelf[j].product[0].group){
                        productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "C" , shelfNumber : findInShelf[j].shelf[0].shelfNumber , floorNumber : findInShelf[j].shelf[0].floorNumber , lockNumber : findInShelf[j].shelf[0].lockNumber})
                    }else{
                        productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "C" , shelfNumber : "" , floorNumber : "" , lockNumber : ""})
                    }
                    break;
                }
            }
            // console.log(productDetail[index]._id, "C" , productDetail[index].totalQuantity)
            // productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "C"})
            // productDetail[index].totalQuantity = "C"
        }
}
        console.log(productABC)
        res.send(productABC)
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