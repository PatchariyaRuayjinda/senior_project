const Disbursement = require('../models/disbursement')

exports.findAllDisbursement = async(req, res) => {
    try{
        // const disbursement = await Disbursement.find({})
        const disbursement = await Disbursement.aggregate(
            [
                {$lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product"
                }},
                {$lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }},
                {"$project": {
                    "user_id": 1,
                    "product_id": 1,
                    "quantity": 1,
                    "date": 1,
                    "state": 1,
                    "product.productName": 1,
                    "user.firstname": 1
                }}
            ]
        )
        res.send(disbursement)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.findOneDisbursement = async(req, res) => {
    try{
        const {id} = req.params
        const disbursement = await Disbursement.findOne({_id: id}).exec()
        res.send(disbursement)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addDisbursement = async(req, res) => {
    try{
        const {user_id, product_id, quantity, date, state} = req.body
        var disbursement = new Disbursement({
            user_id, 
            product_id, 
            quantity, 
            date,
            state
        })
        await disbursement.save()
        res.send('Add Disbursement Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.updateDisbursement = async(req, res) => {
    try{
        // req.body.value
        const {
            _id, 
            user_id, 
            product_id, 
            quantity, 
            date,
            state
        } = req.body
        var newDisbursement = {
            user_id, 
            product_id, 
            quantity, 
            date,
            state
        }
        await Disbursement.updateOne(
            {_id: _id},
            {$set: newDisbursement}
        )
        res.send('Update Disbursement Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.deleteDisbursement = async(req, res) => {
    try{
        const {id} = req.params;
        await Disbursement.deleteOne(
            {_id: id}
        ).exec()
        res.send('Delete Disbursement Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}