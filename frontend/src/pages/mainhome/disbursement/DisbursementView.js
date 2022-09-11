import React from 'react'
import { useEffect,useState } from 'react'
import { findAllDisbursement, deleteDisbursement } from '../../../functions/disbursement'
import Sidebar from '../../../components/layout/Sidebar'
import { Link } from 'react-router-dom'
import moment from 'moment/min/moment-with-locales'
import { returns, withdraw } from '../../../functions/product'

export default function DisbursementView() {
  const [disbursements,setDisbursement] = useState([])
  const [user, setUser] = useState([])
  const Swal = require('sweetalert2')

  const buttondelete = (id, productID, quantity, state) =>{
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
        deleteDisbursement(id)
          .then(res => {
              Swal.fire(
                  'Deleted!',
                  'Account has been deleted.',
                  'success'
              )
              deleteQuantityOnProduct(productID, quantity, state)
              loadData()
          }).catch(err => {
              Swal.fire({
                  icon: 'error',
                  title: 'Oops...',
                  text: err.response,
                })
              console.log(err.response)
          })
      }
    })
  }

  const deleteQuantityOnProduct = (productID, quantity, state) => {
    console.log(state)
    if(state === true){
      returns(productID, quantity)
      .then(res => {
        console.log(res)
      }).catch(err => {
        console.log(err)
      })
    }else{
      withdraw(productID, quantity)
      .then(res => {
        console.log(res)
      }).catch(err => {
        console.log(err)
      })
    }
  }

  const loadData = () =>{
    findAllDisbursement()
    .then(res => {
      setDisbursement(res.data)
      // console.log(res.data)
      })
      .catch(err=>{
        console.log(err.response)
      });
  }

  useEffect(()=>{
    findAllDisbursement()
    .then(res => {
      setDisbursement(res.data)
      // console.log(res.data[0].product[0])
      console.log(res.data)
      })
      .catch(err=>{
        console.log(err)
      });
  },[])

  return (
    <div class='container-fluid'>
    <div class='row'>
      <Sidebar />
      <div  class='ml col-s-9 mt-5'>
        <div class='row'>
          <div className='col-8'>
            <h1 class=' mt-3'>Disbursement View</h1>
          </div>
          <div className='col-2'>
            <Link to='/disbursementcreate' class='btn btn-primary py-1 my-3 btn-lg'>Withdraw</Link>
          </div>
          <div className='col-2'>
            <Link to='/withdrawcreate' class='btn btn-success py-1 my-3 btn-lg'>Return</Link>
          </div>
          
        </div>
          
          <table class='table table-bordered table-light' >
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>Name</th>
                <th scope='col'>Product Name</th>
                <th scope='col'>Quantity</th>
                <th scope='col'>Date</th>
                <th scope='col'>State</th>
                {/* <th scope='col'>Action</th> */}
              </tr>
            </thead>
            {disbursements.map((item, index)=>(
            <tbody key={index}>
              <tr>
                <td scope="row">{index +1}</td>
                {/* <td>{product.user_id}</td> */}
                {item.user.map((users) => (
                  <td>{users.firstname}</td>
                ))} 
                {/* <td>{product.product_id}</td> */}
                {/* <td>{product.product[0].productName}</td> */}
                {item.product.map((products) => (
                  <td>{products.productName}</td>
                ))}
                <td>{item.quantity}</td>
                {/* <td>{product.date}</td> */}
                <td>
                  {moment(item.date).locale('us').format('lll')}
                </td>
                {/* <td>{product.state}</td> */}
                {item.state === true
                ? <td>Withdraw</td>
                : <td>Return</td>
                }
                <td>
                <Link to={'/disbursementupdate/' + item._id } className='btn btn-outline-warning btn-sm mx-1'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>
                  </Link>
                  <button type="button" class="btn btn-outline-danger btn-sm" onClick={()=>buttondelete(item._id, item.product_id, item.quantity, item.state)}>
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
