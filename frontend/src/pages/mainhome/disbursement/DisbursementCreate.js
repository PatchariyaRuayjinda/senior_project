import React, {useEffect, useState} from 'react'
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'
import moment from 'moment';
import axios from 'axios';
import Select from 'react-select';
import { findAllProduct, withdraw, disbursement } from '../../../functions/product';
import { useSelector } from 'react-redux';
import { findUserByName } from '../../../functions/users';
import { addDisbursement } from '../../../functions/disbursement';

export default function DisbursementCreate() {
    const {user} = useSelector((state) => ({...state}))
    // console.log(user)
    const navigate = useNavigate();
    const [user_id, setUser_id] = useState('')
    const [product, setProduct] = useState([])
    const [product_id, setProduct_id] = useState('')

    const [data, setData] = useState({
        user_id: "",
        product_id: "",
        quantity: "",
        date: moment().toISOString(),
        state: true
    })

    const handleChange = (e) => {
        setData({...data,
            [e.target.name]: e.target.value
        })
    }

    const handleChangeProduct = (e) => {
        setProduct_id(e.value)
        console.log(e.label)
    }

    const handleChangeState = (e) => {
        console.log(e.target.value)
       if(e.target.value == 'เบิกจ่าย'){
        setData({...data,
            [e.target.name]: true
        })
       }else{
        setData({...data,
            [e.target.name]: false
        })
       }
    }

    const handleSubmit = async(e) => {
        e.preventDefault()
        if (product_id == ''){
            alert('Please Select product')
        }else{
            await axios.post(process.env.REACT_APP_API + '/addDisbursement',{
                user_id: user_id,
                product_id: product_id,
                quantity: data.quantity,
                date: data.date,
                state: data.state
            }).then(async(res) => {
                if(data.state == true){
                    disbursement(product_id, data.quantity)
                    .then(res => {
                        console.log(res)
                    }).catch(err => {
                        console.log(err.response)
                    })
                }else{
                    withdraw(product_id, data.quantity)
                    .then(res => {
                        console.log(res)
                    }).catch(err => {
                        console.log(err.response)
                    })
                }
            }).catch(err => {
                console.log(err)
            })
        }
        navigate('/disbursementview')
    }

    useEffect(() => {
        loadProduct();
        getUser_id(user.token, user.username);
    }, [])

    const loadProduct = async() => {
        await findAllProduct()
        .then(res => {
            const data = res.data
            const productOption = data.map(product => ({
                "value": product._id,
                "label": product.productName
            }))
            setProduct(productOption)
        }).catch(err => {
            console.log(err.response)
        })
    }

    const getUser_id = async(authtoken, username) => {
        await findUserByName(authtoken, username)
        .then(res => {
            // console.log(res.data._id)
            setUser_id(res.data._id)
        }).catch(err => {
            console.log(err.response)
        })
    }

    return(
        <div className='container-fluid'>
            <form className='form' onSubmit={handleSubmit}>
                <h1>Create Disbursement</h1>
                <div className='container col-4'>
                    <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded' style={{margin: "0.3rem"}}>
                        <div className='card-body fontDivCreate'>
                            <div className='marginDiv'>
                                <span> Username </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='price' value={user.username} placeholder='Please enter the username.'/>
                            </div>
                            {/* <Select options={username} onChange={handleChangeUsername} /> */}
                            <div className='marginDiv'>
                                <span> Product </span>
                            </div>
                            {/* <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='group' placeholder='Please the group.'/>
                            </div> */}
                            <Select options={product} onChange={handleChangeProduct} />
                            <div className='marginDiv'>
                                <span> Quantity </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='quantity' placeholder='Please enter the Quantity.' onChange={handleChange}/>
                            </div>
                            <div className='marginDiv'>
                                <span> State </span>
                            </div>
                            {/* <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='expireDate' placeholder='Please date the expireDate.'/>
                            </div> */}
                            <select name='state' onChange={handleChangeState} >
                                <option>เบิกจ่าย</option>
                                <option>เบิกคืน</option>
                            </select>
                            <button type='submit' className='btn btn-lg btn-custom btn-dark btn-block efbutton col-4 container mt-3'> Submit </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}