import React from "react";
import { useEffect, useState, useCallback } from "react";
import { outMovement , addGroupABC } from "../../../functions/movement";
import Sidebar from "../../../components/layout/Sidebar";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
// import { Link } from 'react-router-dom'
// import moment from 'moment'

export default function InMovement() {
  const [movement, setMovement] = useState([]);
  // const [movementMinus,setMovementMinus] = useState([])
  //   const Swal = require('sweetalert2')

  useEffect(() => {
    outMovement()
      .then((response) => {
        setMovement(response.data);
      })
      .catch((err) => {
        console.log(err.response.data);
      });
  }, []);

  const addGroup = () =>{
    for(let i=0; i<movement.length ; i++){
      // console.log("first")
      addGroupABC(movement[i]._id , movement[i].group)
      .then(res => {
        Swal.fire({
          icon: "success",
          title: "Product group success"
        })
        console.log(res)
      }).catch(err =>{
        console.log(err.response)
      })
    }
  }

  return (
    <div className="container-fluid">
      <div class="row">
        <Sidebar />
        <div class="ml col-s-9 mt-5">
          <div class="row">
            <h1 className="col-8">ABC analysis</h1>
            <button className="btn btn-info py-0 my-4 btn-lg mx-3" onClick={addGroup}>Update product group</button>
            <Link to="/export" className="btn btn-success py-0 my-4 btn-lg" >Export</Link>
          </div>
          <table class="table table-bordered table-light">
            <thead>
              <tr>
                <th scope="col">ProductName</th>
                <th scope="col">Movement</th>
                <th scope="col">%</th>
                <th scope="col">group</th>
              </tr>
            </thead>
            {movement.map((movement) => (
              <tbody>
                <th scope="col">{movement.Name}</th>
                <th scope="col">{movement.movement}</th>
                <th scope="col">{movement.totalQuantity}</th>
                <th scope="col">{movement.group}</th>
              </tbody>
            ))}
            {/* <tbody>
                <th scope='col'>{movement._id}</th>
                <th scope='col'>{movement.totalQuantity}</th>
            </tbody> */}
          </table>
          
        </div>
        
      </div>
      
    </div>
  );
}
