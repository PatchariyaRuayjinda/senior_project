import React from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import { useState,useEffect } from 'react'
import { findOneProductDetail, updateProductDetail } from '../../../functions/productdetail';
import { returns, withdraw } from '../../../functions/product';
import Swal from 'sweetalert2';

export default function ProductDetailUpdate() {
    const navigate = useNavigate();
    const {id} = useParams()
    const [productName, setProductName] = useState('')
    const [defaultQuantity, setDefaultQuantity] = useState('')
    const [productDetail,setProductDetail] = useState({
        _id: "",
        receiveDate: "",
        expireDate: "",
        receiveQuantity: "",
        product_id: ""
      })
    
    useEffect(() =>{
        findOneProductDetail(id)
        .then(res =>{
            console.log(res.data[0])
            setDefaultQuantity(res.data[0].receiveQuantity)
            setProductName(res.data[0].product[0].productName)
            setProductDetail(res.data[0])
        }).catch(err => {
            console.log(err.response.data)
        })
    }, [])

     const handleChange = (e) => {
        setProductDetail({...productDetail, 
           [e.target.name]: e.target.value
         })
     }

    const handleSubmit = async(e) => {
        e.preventDefault()
        // console.log(productDetail.product_id)
        updateProductDetail(productDetail)
        .then(async(res) => {
            if(defaultQuantity > productDetail.receiveQuantity){
                const quantity = defaultQuantity - productDetail.receiveQuantity
                console.log('withdraw', quantity)
                withdraw(productDetail.product_id, quantity)
                .then(res => {
                    navigate('/productdetailview')
                }).catch(err => {
                    console.log(err.response)
                })
            }else if(defaultQuantity < productDetail.receiveQuantity){
                const quantity = productDetail.receiveQuantity - defaultQuantity 
                console.log('returns', quantity)
                returns(productDetail.product_id, quantity)
                .then(res => {
                    navigate('/productdetailview')
                }).catch(err => {
                    console.log(err.response)
                })
            
            }else{
                navigate('/productdetailview')
            }
            Swal.fire({
                icon: 'success',
                // title: 'Edit product detail Successful',
                title: 'Edit Success'
                // showConfirmButton: false,
                // timer: 1500,
                
            })
        }).catch(err => {
            console.log(err.response)
        })
    }

    return(
        <div>
            <h1 style={{marginLeft: "1rem"}}>Product Detail Update</h1>
            <div className='container-fluid'>
                <form className='form' onSubmit={handleSubmit}>
                    <div className='container col-4 '>
                        <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded'>
                            <div className='card-body fontDivCreate'>
                                {/* <input type="hidden" value={product._id} /> */}
                                {/* <div className='marginDiv'>
                                    <span> Product Status </span>
                                </div>
                                <div>
                                    <input className='rounded-pill border-1 form-control' type='text' name='productStatus' value={productDetail.productStatus} onChange={handleChange} required />
                                </div> */}
                                {/* <div className='marginDiv'>
                                    <span> Receive date </span>
                                </div>
                                <div>
                                    <input className='rounded-pill border-1 form-control' type='text' name='receiveDate' value={productDetail.receiveDate} onChange={handleChange} required />
                                </div> */}
                                <div className='marginDiv'>
                                    <span> Product </span>
                                </div>
                                <div>
                                    <input className='rounded-pill border-1 form-control' type='text' name='product_id' value={productName} onChange={handleChange} required />
                                </div>
                                <div>
                                    <span> Receive Quantity </span>
                                </div>
                                <div>
                                    <input className='rounded-pill border-1 form-control' type='text' name='receiveQuantity' value={productDetail.receiveQuantity} onChange={handleChange} required />
                                </div>
                                <div className='marginDiv'>
                                    <span> Expire date </span>
                                </div>
                                <div className='marginDiv'>
                                    <input className='rounded-pill border-1 form-control' type='text' name='expireDate' value={productDetail.expireDate} onChange={handleChange} required />
                                </div>
                                <button type='submit' className='btn btn-lg btn-custom btn-dark btn-block efbutton col-4 container mt-3'> Submit </button>
                            </div>
                        </div> 
                    </div>
                </form>
            </div>
        </div>
    )
}