import axios from 'axios'

export const findAllDepartment = async() => {
    return await axios.get(process.env.REACT_APP_API + '/findAllDepartment')
}

export const addDepartment = async(value) => {
    return await axios.post(process.env.REACT_APP_API + '/addDepartment' + value)
}

export const updateDepartment = async(value) => {
    return await axios.put(process.env.REACT_APP_API + '/updateDepartment' + value)
}

export const deleteDepartment = async(id) => {
    return await axios.put(process.env.REACT_APP_API + '/deleteDepartment/' + id)
}
