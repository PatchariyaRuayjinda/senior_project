import React, {useState, useEffect} from 'react'
import { useSelector } from 'react-redux'
import LoadingToRedirect from './LoadingToRedirect'
import { currentManager } from '../functions/auth'

export default function ManagerRoute(children) {
    const {user} = useSelector((state)=> ({...state}))
    const [pass, setPass] = useState(false)
    console.log('ManagerRoute', user)

    useEffect(() => {
        if( user && user.token){
            currentManager(user.token)
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
