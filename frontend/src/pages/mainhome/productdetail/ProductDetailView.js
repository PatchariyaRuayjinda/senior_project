import React from 'react'
import { useEffect,useState } from 'react'
import {findAllProductDetail, deleteProductDetail} from '../../../functions/productdetail'
import Sidebar from '../../../components/layout/Sidebar'
import { Link } from 'react-router-dom'
import moment from 'moment/min/moment-with-locales'
import { disbursement } from '../../../functions/product'

export default function ProductDetailView() {
  const [productDetail, setProductDetail] = useState([])
  const Swal = require('sweetalert2')

  const buttondelete = (id, productID, receiveQuantity) =>{
    // console.log(id, receiveQuantity)
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteProductDetail(id)
          .then(res => {
              Swal.fire(
                  'Deleted!',
                  'Product Detail has been deleted.',
                  'success'
              )
              disbursement(productID, receiveQuantity)
              .then(res => {
                console.log(res.data)
              }).catch(err => {
                console.log(err)
              })
              loadData()
          }).catch(err => {
              Swal.fire({
                  icon: 'error',
                  title: 'Oops...',
                  text: err.response.data,
                  // footer: '<a href="">Why do I have this issue?</a>'
                })
              console.log(err.response)
          })
      }
    })
  }


  const loadData = () =>{
    findAllProductDetail()
    .then(response => {
      setProductDetail(response.data)
      // console.log(response.data)
      })
      .catch(err=>{
        console.log(err.prsponse.data)
      });
  }

  useEffect(()=>{
    findAllProductDetail()
    .then(response => {
      setProductDetail(response.data)
      // console.log(response.data)
      })
      .catch(err=>{
        console.log(err.response)
      });
  },[])

  return (
    <div class='container-fluid'>
    <div class='row'>
      <Sidebar />
      <div  class='ml col-s-9'>
        <div class='row'>
          <h1 class='col-10 mt-3'>ProductDetail View</h1>
          {/* <a href='/productdetailcreate' class='btn btn-info py-0 my-4 btn-lg'>Create</a> */}
          <Link to="/productdetailcreate" class='btn btn-info py-0 my-4 btn-lg'>Create</Link>
        </div>
          
          <table class='table table-bordered table-light' >
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>Product Name</th>
                {/* <th scope='col'>Product Status</th> */}
                <th scope='col'>Receive date</th>
                <th scope='col'>Expire date</th>
                <th scope='col'>Receive Quantity</th>
                <th scope='col'>Action</th>
              </tr>
            </thead>
            {productDetail.map((productDetail,index)=>(
            <tbody key={index}>
              <tr>
                <td scope="row">{index +1}</td>
                {/* <td>{product.product[0].productName}</td> */}
                {productDetail.product.map((item) => (
                  <td>{item.productName}</td>
                ))}
                {/* <td>{product.productStatus}</td> */}
                <td>
                  {moment(productDetail.receiveDate).locale('th').format('ll')}
                </td>
                {/* <th>{product.expireDate}</th> */}
                <td>
                  {moment(productDetail.expireDate).locale('th').format('ll')}
                </td>
                <td>{productDetail.receiveQuantity}</td>
                <td>
                <Link to={'/productdetailupdate/' + productDetail._id } className='btn btn-outline-warning btn-sm mx-1'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>
                  </Link>
                  <button type="button" class="btn btn-outline-danger btn-sm" onClick={()=>buttondelete(productDetail._id, productDetail.product[0]._id, productDetail.receiveQuantity)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                    </svg>
                  </button>
                </td>
                
              </tr>
            </tbody>
            ))}
          </table>
      </div>
      </div>
      </div>
  )
}
