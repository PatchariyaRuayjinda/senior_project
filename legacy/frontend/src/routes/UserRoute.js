import React from 'react'
import { useSelector } from 'react-redux'
import LoadingToRedirect from './LoadingToRedirect'

const UserRoute = ({children}) => {
    const { user } = useSelector((state)=> ({...state}))
    console.log('userRoute', user)

    return user && user.token 
    ? children
    : <LoadingToRedirect />
}

export default UserRoute