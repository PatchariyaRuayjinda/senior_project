const Department = require('../models/department')

exports.findAllDepartment = async(req, res, next) => {
    try{
        const department = await Department.find({}).sort({_id: -1})
        res.send(department)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.addDepartment = async(req, res, next) => {
    try{
        const {departmentName} = req.body
        var department = await Department.findOne({departmentName})
        if(department) {
            return res.status(400).send('Department Name have been in database.')
        }
        department = new Department({
            departmentName
        })
        await department.save();
        res.send('Add Department Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.updateDepartment = async(req, res, next) => {
    try{
        const {_id, departmentName} = req.body
        await Department.updateOne(
            {_id: _id},
            {departmentName: departmentName}
        )
        res.send('Update Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}

exports.deleteDepartment = async(req, res, next) => {
    try{
        const {id} = req.params
        await Department.findOneAndDelete({_id: id}).exec()
        res.send('Delete Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error')
    }
}