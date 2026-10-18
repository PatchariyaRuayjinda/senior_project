import axios from "axios";

export const outMovement = async() => {
    return await axios.get(process.env.REACT_APP_API + '/outMovement')
}

export const addGroupABC = async(_id , group) =>{
    return await axios.patch(process.env.REACT_APP_API + '/addGroupABC', {
        id: _id,
        group: group,
    })
}