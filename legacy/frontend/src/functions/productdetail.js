import axios from "axios";

export const findAllProductDetail = async() =>{
    return await axios.get(process.env.REACT_APP_API + '/findAllProductDetail')
}

export const addProductDetail = async(value) =>{
    return await axios.post(process.env.REACT_APP_API + '/addProductDetail' , value)
}

export const updateProductDetail = async(value) =>{
    return await axios.put(process.env.REACT_APP_API + '/updateProductDetail', value)
}

export const deleteProductDetail = async(id) =>{
    return await axios.delete(process.env.REACT_APP_API + '/deleteProductDetail/' +id)
}

export const findOneProductDetail = async(id) =>{
    return await axios.get(process.env.REACT_APP_API + '/findOneProductDetail/' + id)
}