import axios from "axios";

export const findAllZone = async() =>{
    return await axios.get(process.env.REACT_APP_API + '/findAllZone')
}

export const addZone = async(value) =>{
    return await axios.post(process.env.REACT_APP_API + '/addZone' , value)
}

export const updateZone = async(value) =>{
    return await axios.put(process.env.REACT_APP_API + '/updateZone', value)
}

export const deleteZone = async(id) =>{
    return await axios.delete(process.env.REACT_APP_API + '/deleteZone/' +id)
}

export const findOneZone = async(id) =>{
    return await axios.get(process.env.REACT_APP_API + '/findOneZone/' + id)
}