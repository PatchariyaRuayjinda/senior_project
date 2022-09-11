import axios from "axios";

export const findAllProductInShelf = async() =>{
    return await axios.get(process.env.REACT_APP_API + '/findAllProductInShelf')
}

export const findShelfByZone = async(zone) => {
    return await axios.get(process.env.REACT_APP_API + '/findShelfByZone/' + zone)
}

export const updateProductInShelf = async(value) => {
    return await axios.put(process.env.REACT_APP_API + '/updateShelf', value)
}