const Position = require('../models/position')

exports.findAllPosition = async(req, res, next) => {
    try{
        const position = await Position.find({})
        res.send(position)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addPosition = async(req, res, next) => {
    try{
        const {positionName} = req.body
        var position = await Position.findOne({positionName})
        if(position) {
            return res.status(400).send('Position Name have been in database.')
        }
        position = new Position({
            positionName
        })
        await position.save();
        res.send('Add Position Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.updatePosition = async(req, res, next) => {
    try{
        const {_id, positionName} = req.body
        await Position.updateOne(
            {_id: _id},
            {positionName: positionName}
        )
        res.send('Update Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.deletePostion = async(req, res, next) => {
    try{
        const {id} = req.params
        await Position.findOneAndDelete({_id: id}).exec()
        res.send('Delete Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}