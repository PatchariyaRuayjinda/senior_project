import React, {useState, useEffect} from 'react';
import { useSelector } from 'react-redux';
import LoadingToRedirect from './LoadingToRedirect';
import {currentAdmin} from '../functions/auth';

const AdminRoute = ({children}) => {
    const { user } = useSelector((state)=> ({...state}))
    const [pass, setPass] = useState(false)
    // console.log('AdminRoute', user)

    useEffect(() => {
        if (user && user.token) {
            currentAdmin(user.token)
            .then(res => {
                console.log(res.data)
                setPass(true)
            }).catch(err => {
                console.log(err)
                setPass(false)
            })
        }
    }, [user])

    return pass 
    ? children
    : <LoadingToRedirect />
}

export default AdminRoute
