const ProductDetail = require('../models/productDetail')
const Disbursement = require('../models/disbursement')
const Product = require('../models/product')

exports.outMovement = async(req, res) =>{
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

        var totalMovement = 0;

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
    var productABC = []
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
    // console.log(momenttotal)
    for (let index = 0; index < productDetail.length; index++) {
        totalMovement = totalMovement + productDetail[index].totalQuantity;
        // console.log(productDetail[index].totalQuantity ," = ", totalMovement)
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
    // console.log(producName)
    // console.log(producName)
    // productDetail.forEach(element => {
    //     console.log(element.totalQuantity)
    // });
    // console.log(productDetail)
    
    // หา ZONE ของ สิ่นค้า
    let scoreA = 80;
    let scoreB = 15;
    for (let index = 0; index < productDetail.length; index++) {
                // console.log("...................")
                if(scoreA >= 0 && scoreA){
                    scoreA = scoreA - productDetail[index].totalQuantity
                    productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "A"})
                    // productDetail[index].totalQuantity = "A"
                    // productDetail.push("A")
                }else if(scoreB >= 0){
                    scoreB = scoreB - productDetail[index].totalQuantity
                    // console.log(productDetail[index]._id, "B" , productDetail[index].totalQuantity)
                    productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "B"})
                    // productDetail[index].totalQuantity = "B"
                }else{
                    // console.log(productDetail[index]._id, "C" , productDetail[index].totalQuantity)
                    productABC.push({_id: productDetail[index]._id , Name: producName[index] , movement: momenttotal[index] , totalQuantity: productDetail[index].totalQuantity.toFixed(2) , group: "C"})
                    // productDetail[index].totalQuantity = "C"
                }
    }
    // console.log(productABC)
    // console.log(JSON.stringify(productABC[0]._id))
    // console.log(productABC)
    // for (let index = 0; index < productDetail2.length; index++) {
    //         console.log()
    // }
    // console.log(productABC)
    res.send(productABC)
    
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addGroupABC = async(req, res) => {
    try{
        const {id, group} = req.body
        await Product.updateOne(
            {_id: id},
            {group: group}
        )
        res.send('Success!!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

// tset