import axios from 'axios'

export const findAllPosition = async() => {
    return await axios.get(process.env.REACT_APP_API + '/findAllPosition')
}

export const addPosition = async(value) => {
    return await axios.post(process.env.REACT_APP_API + '/addPosition' + value)
}

export const updatePosition = async(value) => {
    return await axios.put(process.env.REACT_APP_API + '/updatePosition' + value)
}

export const deletePostion = async(id) => {
    return await axios.put(process.env.REACT_APP_API + '/deletePostion/' + id)
}
