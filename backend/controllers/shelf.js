const Shelf = require('../models/shelf')

exports.findAllShelf = async(req, res) => {
    try{
        const shelf = await Shelf.find({})
        // const shelf = await Shelf.aggregate([
        //     {$lookup: {
        //         from: 'zones',
        //         localField: 'zone_id',
        //         foreignField: '_id',
        //         as: 'zone'
        //     }}
        // ])
        res.send(shelf)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.findOneShelf = async(req, res, next) => {
    try{
        const {id} = req.params
        const shelf = await Shelf.findOne({_id: id}).exec()
        res.send(shelf)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addShelf = async(req, res) => {
    try{
        // const {shelfNumber, floorNumber, lockNumber, shelfStatus, zone} = req.body;
        const {shelfNumber, floorNumber, lockNumber, zone} = req.body;
        var shelf = await Shelf.findOne({shelfNumber: shelfNumber, floorNumber: floorNumber, lockNumber: lockNumber})
        if(shelf){
            return res.status(400).send('shelf and floor and lock already exist!')
        }
        shelf = new Shelf({
            shelfNumber,
            floorNumber,
            lockNumber,
            // shelfStatus,
            zone
        })
        await shelf.save();
        res.send('Add Shelf Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.updateShelf = async(req, res) => {
    try{
        // req.body.value
        const {
            _id,
            shelfNumber,
            floorNumber, 
            lockNumber, 
            // shelfStatus, 
            zone
        } = req.body;
        var newShelf = {
            shelfNumber,
            floorNumber, 
            lockNumber, 
            // shelfStatus, 
            zone
        }
        await Shelf.updateOne(
            {_id: _id},
            {$set: newShelf}
        )
        res.send('Update Shelf Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.deleteShelf = async(req, res) => {
    try{
        const {id} = req.params
        await Shelf.deleteOne({_id: id}).exec()
        res.send('Delete Shelf Success!!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}