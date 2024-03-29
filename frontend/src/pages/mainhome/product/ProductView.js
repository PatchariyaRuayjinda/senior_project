import React from 'react'
import { useEffect,useState } from 'react'
import {findAllProduct, findOneProduct, findOneProduct2} from '../../../functions/product'
import Sidebar from '../../../components/layout/Sidebar'
import { Link,useParams } from 'react-router-dom'
import './style.css'
import { Modal } from 'antd';
import ModalView from '../../../components/layout/ModalView'
import { useDispatch, useSelector } from 'react-redux';
export default function ProductView() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [productModal, setProductModal] = useState([])
  const [products,setProduct] = useState([])
  const [product,setProducts] = useState({
    _id: "",
    productName: "",
    productStatus: "",
    price: "",
    group: ""
  })
  const { user } = useSelector((state) => ({...state}))
  const Swal = require('sweetalert2')
  // const {id} = useParams()
  const [value, setValue] = useState({
    id: '',
})

const showModal = async(_id) => {
  setIsModalVisible(true);
  // setValue({...value,
  //     id: _id,
  // })
  await loadData(_id)
};

const handleCancel = () => {
  setIsModalVisible(false);
};

  // const buttondelete = (id, quantity) =>{
  //   console.log(id, quantity)
  //   if(quantity != 0){
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Oops...',
  //       text: "Quantity Not equal to zero. Can't Delete Product",
  //     })
  //   }else {
  //     Swal.fire({
  //       title: 'Are you sure?',
  //       text: "You won't be able to revert this!",
  //       icon: 'warning',
  //       showCancelButton: true,
  //       confirmButtonColor: '#3085d6',
  //       cancelButtonColor: '#d33',
  //       confirmButtonText: 'Yes, delete it!'
  //     }).then((result) => {
  //       if (result.isConfirmed) {
  //         deleteProduct(id)
  //           .then(res => {
  //               Swal.fire(
  //                   'Deleted!',
  //                   'Product has been deleted.',
  //                   'success'
  //               )
  //               loadData()
  //           }).catch(err => {
  //               Swal.fire({
  //                   icon: 'error',
  //                   title: 'Oops...',
  //                   text: err.response,
  //                   // footer: '<a href="">Why do I have this issue?</a>'
  //                 })
  //               console.log(err.response)
  //           })
  //       }
  //     })
  //  }
  // }
  const loadData = async(_id) =>{
    await findOneProduct2(_id)
    .then(res => {
      // console.log(res.data)
      setProducts(res.data)
      // console.log(res.data.product.productName)
      setProductModal(res.data.product)
      })
      .catch(err=>{
        console.log(err.response)
      });
  }

  useEffect((_id)=>{
    findAllProduct()
    .then(response => {
      setProduct(response.data)
      // console.log(response.data)
      })
      .catch(err=>{
        console.log(err.response)
      });
      // findOneProduct(_id)
  },[])
  return (
    <div class='container-fluid'>
    <div class='row'>
      <Sidebar />
      <div  class='ml col-s-9 mt-5'>
        <div class='row'>
          <h1 class='col-10 mt-3'>Product View</h1>
          {
                    user.position === 'Warehouse Staff' && <>
                    <a href='productcreate' class='btn btn-info py-0 my-4 btn-lg'>Create</a>
                    </>
          }
            
        </div>
          
          <table class='table table-bordered table-light' >
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>ProductName</th>
                <th scope='col'>Quantity</th>
                <th scope='col'>Product Status</th>
                <th scope='col'>Price per unit</th>
                <th scope='col'>Group</th>
                <th scope='col'>Action</th>
              </tr>
            </thead>
            {products.map((product,index)=>(
            <tbody key={index}>
              <tr>
                <td scope="row">{index +1}</td>
                <td>{product.productName}</td>
                <td>{product.quantity}</td>
                <td>{product.productStatus}</td>
                <td>{product.price}</td>
                <td>{product.group}</td>
                <td>      
                  <button className='btn btn-outline-info btn-sm' onClick={() => showModal(product._id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                    </svg>
                  </button>
                  {
                    user.position === 'Warehouse Staff' && <>
                    <Link to={'/productupdate/' + product._id } className='btn btn-outline-warning btn-sm mx-1'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                      <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                    </svg>
                  </Link>
                    </>
                  }
                  
                  {/* <button type="button" class="btn btn-outline-danger btn-sm" onClick={()=>buttondelete(product._id, product.quantity)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                    </svg>
                  </button> */}
                  {/* <ModalView /> */}
                </td>
                
              </tr>
            </tbody>
            ))}
          </table>
          <Modal title={productModal.productName} visible={isModalVisible} onCancel={handleCancel}>

          {/* <p style={{marginBottom: '-1px'}}>productName: {productModal.productName}</p> */} 
          <p style={{marginBottom: '-1px'}}>Bath per unit: {productModal.price}</p>
          <p style={{marginBottom: '-1px'}}>ProductStatus: {productModal.productStatus}</p>
          <p style={{marginBottom: '-1px'}}>Group: {productModal.group}</p>
          <p style={{marginBottom: '-1px'}}>withdrawCount: {product.withdrawCount}</p>
          <p style={{marginBottom: '-1px'}}>returnCount: {product.returnCount}</p>
          {/* {product.shelf.map((item) => {
            <div className='row'>
              <p style={{marginBottom: '-1px'}}>{item.shelfNumber}</p>

            </div>
          })} */}
        </Modal>
      </div>
      </div>
      </div>
  )
}
