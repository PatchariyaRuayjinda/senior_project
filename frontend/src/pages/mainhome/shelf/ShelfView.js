import React from 'react'
import { useEffect,useState } from 'react'
import {findAllShelf} from '../../../functions/shelf'
import Sidebar from '../../../components/layout/Sidebar'
import { deleteShelf } from '../../../functions/shelf'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
export default function ShelfView() {
  const [shelfs,setShelf] = useState([])
  const Swal = require('sweetalert2')
  const { user } = useSelector((state) => ({...state}))
  const buttondelete = (id, shelfStatus) =>{
    if(shelfStatus){
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: "The shelf is not empty. Can't delete shelf",
      })
    }else{
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
          deleteShelf(id)
            .then(res => {
                Swal.fire(
                    'Deleted!',
                    'Shelf has been deleted.',
                    'success'
                )
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
  }
  const loadData = () =>{
    findAllShelf()
    .then(response => {
      setShelf(response.data)
      // console.log(response.data)
      })
      .catch(err=>{
        console.log(err.response)
      });
  }

  useEffect(()=>{
    findAllShelf()
    .then(response => {
      setShelf(response.data)
      console.log(response.data[0].zone[0])
      })
      .catch(err=>{
        console.log(err.response)
      });
  },[])
  return (
    <div class='container-fluid'>
    <div class='row'>
      <Sidebar />
      <div  class='ml col-s-9 mt-5'>
        <div class='row'>
          <h1 class='col-10 mt-3'>Shelfs View</h1>
          {
            user.position === 'Warehouse Staff' && <>
              <a href='shelfcreate' class='btn btn-info py-0 my-4 btn-lg'>Create</a>
            </>
          }
          
        </div>
          
          <table class='table table-bordered table-light' >
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>ShelfNumber</th>
                <th scope='col'>FloorNumber</th>
                <th scope='col'>LockNumber</th>
                <th scope='col'>ShelfStatus</th>
                <th scope='col'>Zone</th>
                {
            user.position === 'Warehouse Staff' && <>
            <th scope='col'>Action</th>
            </>
          }
                
              </tr>
            </thead>
            {shelfs.map((shelf,index)=>(
            <tbody key={index}>
              <tr>
                <td scope="row">{index +1}</td>
                <td>{shelf.shelfNumber}</td>
                <td>{shelf.floorNumber}</td>
                <td>{shelf.lockNumber}</td>
                {/* <td>{shelf.shelfStatus}</td> */}
                {shelf.shelfStatus == true
                ? <td>Not empty</td>
                : <td>Empty</td>
                }
                <td>{shelf.zone}</td>
                {/* {shelf.zone.map((zone) => (
                  <td>{zone.zone}</td>
                ))} */}
               { user.position === 'Warehouse Staff' && <>
            <td>
              <Link to={'/shelfupdate/' + shelf._id } className='btn btn-outline-warning btn-sm mx-1'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>
                  </Link>
                  <button type="button" class="btn btn-outline-danger btn-sm" onClick={()=>buttondelete(shelf._id, shelf.shelfStatus)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                    </svg>
                  </button>
            </td>
            </>
          }     
              </tr>
            </tbody>
            ))}
          </table>
      </div>
      </div>
      </div>
  )
}
