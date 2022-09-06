import axios from "axios";

export const findAllProductInShelf = async() =>{
    return await axios.get(process.env.REACT_APP_API + '/findAllProductInShelf')
}