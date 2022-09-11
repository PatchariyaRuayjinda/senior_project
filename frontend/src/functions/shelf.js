import axios from "axios";

export const findAllShelf = async() =>{
    return await axios.get(process.env.REACT_APP_API + '/findAllShelf')
}

export const addShelf = async(value) =>{
    return await axios.post(process.env.REACT_APP_API + '/addShelf' , value)
}

export const updateShelf = async(value) =>{
    return await axios.put(process.env.REACT_APP_API + '/updateShelf', value)
}

export const deleteShelf = async(id) =>{
    return await axios.delete(process.env.REACT_APP_API + '/deleteShelf/' +id)
}

export const findOneShelf = async(id) =>{
    return await axios.get(process.env.REACT_APP_API + '/findOneShelf/' + id)
}

export const findShelfByZoneFalse = async(group) => {
    return await axios.get(process.env.REACT_APP_API + '/findShelfByZoneFalse/' + group)
}