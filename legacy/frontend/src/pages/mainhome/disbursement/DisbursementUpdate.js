import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { findOneDisbursement, updateDisbursement } from '../../../functions/disbursement'
import { findAllProduct, findOneProduct, returns, withdraw } from '../../../functions/product'
import Select from 'react-select'
import Swal from 'sweetalert2';
// import axios from 'axios'
export default function DisbursementUpdate() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [productName, setProductName] = useState([]);
    const [defaultQuantity, setDefaultQuantity] = useState('');
    const [defaultState, setDefaultState] = useState('');
    const [productOption, setProductOption] = useState([]);
    const [product_id, setProduct_id] = useState('');

    useEffect(() => {
       loadDisbursement();
       loadProduct();
    }, [])

    const loadDisbursement = async() => {
        await findOneDisbursement(id)
        .then(res => {
            setData(res.data)
            // console.log(res.data.quantity)
            setDefaultQuantity(res.data.quantity)
            setDefaultState(res.data.state)
            loadProductName(res.data.product_id);
        }).catch(err => {
            console.log(err.response)
        })
    }

    const loadProduct = async() => {
        await findAllProduct()
        .then(res => {
            const data = res.data
            const productOption = data.map(products => ({
                "value": products._id,
                "label": products.productName,
            }))
            setProductOption(productOption)
        }).catch(err => {
            console.log(err.response)
        })
    }

    const loadProductName = async(product_id) => {
        await findOneProduct(product_id)
        .then(res => {
            // console.log(res.data)
            setProductName(res.data)
        }).catch(err => {
            console.log(err.response)
        })
    }

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

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(data)
        updateDisbursement(data)
        .then(res => {
            if(data.state === defaultState){
                if(defaultQuantity > data.quantity){
                    const quantity = defaultQuantity - data.quantity
                    console.log('withdraw', quantity)
                    withdraw(data.product_id, quantity)
                    .then(res => {
                        console.log(res.data)
                    }).catch(err => {
                        console.log(err.response)
                    })
                }else if(defaultQuantity < data.quantity){
                    const quantity = data.quantity - defaultQuantity
                    console.log('returns', quantity)
                    returns(data.product_id, quantity)
                    .then(res => {
                        console.log(res.data)
                    }).catch(err => {
                        console.log(err.response)
                    })
                }
            }else{
                if(data.state == true){
                    const quantity = defaultQuantity + data.quantity
                    withdraw(data.product_id, quantity)
                    .then(res => {
                        console.log('สลับ withdraw',res.data)
                    }).catch(err => {
                        console.log(err.response)
                    })
                }else{
                    const quantity = defaultQuantity + data.quantity
                    returns(data.product_id, quantity)
                    .then(res =>{
                        console.log('สลับ returns',res.data)
                    }).catch(err => {
                        console.log(err.response)
                    })
                }
            }
            Swal.fire({
                icon:"success",
                title: "Withdraw update Successful",
                showConfirmButton: false,
                timer: 1200
            });
            navigate('/disbursementview')
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

  return (
    <div>
        <h1 style={{marginLeft: "1rem"}}>Disbursement Update</h1>
        <div className='container-fluid'>
            <form className='form' onSubmit={handleSubmit}>
                <div className='container col-4 '>
                    <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded'>
                        <div className='card-body fontDivCreate'>
                            {/* <input type="hidden" value={product._id} /> */}
                            <div className='marginDiv'>
                                <span> Product Name </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='productName' value={productName.productName} required />
                            </div>
                            {/* <Select 
                                options={productOption} 
                                onChange={handleChangeProduct} 
                            /> */}
                            <div className='marginDiv'>
                                <span> Quantity</span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='quantity' placeholder='Please. Enter the quantity' value={data.quantity} onChange={handleChange} required />
                            </div>
                            <div className='marginDiv'>
                                <span> State </span>
                            </div>
                            {/* <div className='marginDiv'>
                                <input className='rounded-pill border-1 form-control' type='text' name='state' required />
                            </div> */}
                            <select name='state' defaultValue={"default"} onChange={handleChangeState} required>
                                <option value={"default"} disabled>
                                    select state
                                </option>
                                <option>เบิกจ่าย</option>
                                <option>เบิกคืน</option>
                            </select>
                            <button type='submit' className='btn btn-lg btn-custom btn-dark btn-block efbutton col-4 container mt-3'> Submit </button>
                        </div>
                    </div> 
                </div>
            </form>
        </div>
    </div>
  )
}
