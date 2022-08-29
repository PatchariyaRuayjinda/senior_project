import axios from "axios";

export const findAllProduct = async() =>{
    return await axios.get(process.env.REACT_APP_API + '/findAllProduct')
}

export const addProduct = async(value) =>{
    return await axios.post(process.env.REACT_APP_API + '/addProduct' , value)
}

export const updateProduct = async(value) =>{
    return await axios.put(process.env.REACT_APP_API + '/updateProduct', value)
}

export const deleteProduct = async(id) =>{
    return await axios.delete(process.env.REACT_APP_API + '/deleteProduct/' +id)
}

export const findOneProduct = async(id) =>{
    return await axios.get(process.env.REACT_APP_API + '/findOneProduct/' + id)
}

export const returns = async(id, quantity) => {
    return await axios.patch(process.env.REACT_APP_API + '/returns', {
        id: id,
        quantity: quantity
    })
}

export const withdraw = async(id, quantity) => {
    return await axios.patch(process.env.REACT_APP_API + '/withdraw', {
        id: id,
        quantity: quantity
    })
}