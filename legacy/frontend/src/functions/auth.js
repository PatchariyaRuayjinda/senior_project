import axios from 'axios'

export const register = async(value) => {
    return await axios.post(process.env.REACT_APP_API + '/register', value)
}

export const login = async(value) => {
    return await axios.post(process.env.REACT_APP_API + '/login', value)
}

export const currentUser = async(authtoken) => {
    // console.log(authtoken)
    return await axios.post(process.env.REACT_APP_API + '/current-user', {}, 
    {
        headers:{
            authtoken,
        }
    });
}

export const currentManager = async(authtoken) => {
    return await axios.post(process.env.REACT_APP_API + '/current-manager', {},
    {
        headers: {
            authtoken,
        }
    });
}

export const currentAdmin = async(authtoken) => {
    // console.log(authtoken)
    return await axios.post(process.env.REACT_APP_API + '/current-admin', {}, 
    {
        headers:{
            authtoken,
        }
    });
}