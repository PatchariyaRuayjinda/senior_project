import React, {useState, useEffect} from 'react'
import './style.css'
import { addProductDetail } from '../../../functions/productdetail'
import { findAllProduct, returns } from '../../../functions/product';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import axios from 'axios';
import moment from 'moment';

export default function ProductDetailCreate() {
    const navigate = useNavigate();
    const [product, setProduct] = useState([])
    const [product_id, setProduct_id] = useState('')
    const [value, setValue] = useState({
        receiveDate: moment().toISOString(),
        expireDate: "",
        receiveQuantity: "",
      })
    
    const handleChange = (e) => {
        setValue({...value, 
          [e.target.name]: e.target.value
        })
    }

    const handleChangeProduct = (e) => {
        setProduct_id(e.value)
        console.log(e.label)
    }

    const handleSubmit = async(e) => {
        e.preventDefault()
        if (product_id == ''){
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please Select product',
              })
        }else{
            console.log(product_id)
            await axios.post(process.env.REACT_APP_API + '/addProductDetail', {
                // productStatus: value.productStatus,
                receiveDate: value.receiveDate,
                expireDate: value.expireDate,
                receiveQuantity: value.receiveQuantity,
                product_id: product_id
            }).then(async(res) => {
                await returns(product_id, value.receiveQuantity)
                .then(res => {
                    Swal.fire(
                        product.label,
                        'Successful product detail creation',
                        'success',
                        navigate('/productdetailview')    
                    )
                    console.log(res.data)
                }).catch(err => {
                    console.log(err.response)
                })
            }).catch(err => {
                console.log(err.response)
            })
        }  
        // console.log(product)
        
    }

    useEffect(() => {
        findAllProduct()
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
    }, [])

    return(
        <div className='container-fluid'>
            <form className='form' onSubmit={handleSubmit}>
                <h1>CreateProductDetail</h1>
                <div className='container col-4 '>
                    <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded'>
                        <div className='card-body fontDivCreate'>
                            <div className='marginDiv'>
                                <span> Product </span>
                            </div>
                            {/* <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='product_id' placeholder='Please number the product_id.' onChange={handleChange} required />
                            </div> */}
                            <Select options={product} onChange={handleChangeProduct} required/>
                            {/* <div className='marginDiv'>
                                <span> Product Status </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='productStatus' placeholder='Please name the productStatus.' onChange={handleChange}  />
                            </div> */}
                            <div className='marginDiv'>
                                <span> Receive Quantity </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='receiveQuantity' placeholder='Please number the receiveQuantity.' onChange={handleChange} required/>
                            </div>
                            <div className='marginDiv' style={{marginTop:"3px"}}>
                                <span> Expire date </span>
                            </div>
                            <div className='marginDiv'>
                                <input className='rounded-pill border-1 form-control' type='text' name='expireDate' placeholder='Please date the expireDate.' onChange={handleChange} required/>
                            </div>
                            <button type='submit' className='btn btn-lg btn-custom btn-dark btn-block efbutton col-4 container mt-3'> Submit </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}