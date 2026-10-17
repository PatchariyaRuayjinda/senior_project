const Zone = require('../models/zone')

exports.findAllZone = async(req, res) => {
    try{
        const zone = await Zone.find({})
        res.send(zone)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.findOneZone = async(req, res, next) => {
    try{
        const {id} = req.params
        const zone = await Zone.findOne({_id: id}).exec()
        res.send(zone)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addZone = async(req, res) => {
    try{
        const {zonetype} = req.body
        var zone = await Zone.findOne({zonetype: zonetype})
        if(zone){
            return res.status(400).send('Zone have already exist.')
        }
        zone = new Zone({
            zonetype
        })
        await zone.save()
        res.send('Add Zone Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.updateZone = async(req, res) => {
    try{
        console.log(req.body)
        // req.body.value
        const {_id, zonetype} = req.body
        await Zone.updateOne(
            {_id: _id},
            {zonetype: zonetype}
        )
        res.send('Update Zone Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.deleteZone = async(req, res) => {
    try{
        const {id} = req.params;
        await Zone.deleteOne(
            {_id: id}
        ).exec()
        res.send('Delete Zone Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}