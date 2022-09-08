import React from "react";
import { useEffect, useState, useCallback } from "react";
import { findAllProductInShelf } from "../../../functions/productInShelf";
import Sidebar from "../../../components/layout/Sidebar";
import {useReactToPrint} from "react-to-print"
import {Link} from 'react-router-dom'

export default function Export() {
    const [movement, setMovement] = useState([]);
    const handlePrint = useReactToPrint({
      content: () => findAllProductInShelf.current,
    })
    useEffect(() => {
        findAllProductInShelf()
          .then((response) => {
            console.log(response.data)
            setMovement(response.data);
          })
          .catch((err) => {
            console.log(err.response.data);
          });
      }, []);
    return(
        <div className="container-fluid">
            <div className="row">
            <Sidebar />
            <div class="ml col-s-9 mt-5">
                <div class="row">
                    <h1 className="col-8 text-light">Export</h1>
                    <componentToPrint ref={findAllProductInShelf} />
                    <button className="btn btn-info" onClick={handlePrint}> print this out </button>
                </div>
                <table class="table table-bordered table-light">
            <thead>
              <tr className="text-center">
                <th scope="col">ProductName</th>
                <th scope="col">Movement</th>
                <th scope="col">%</th>
                <th scope="col">group</th>
                <th scope="col">ShelfNumber</th>
                <th scope="col">FloorNumber</th>
                <th scope="col">LockNumber</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            {movement.map((movement) => (
              <tbody>
                <th scope="col">{movement.Name}</th>
                <th scope="col">{movement.movement}</th>
                <th scope="col">{movement.totalQuantity}</th>
                <th scope="col">{movement.group}</th>
                <th scope="col">{movement.shelfNumber}</th>
                <th scope="col">{movement.floorNumber}</th>
                <th scope="col">{movement.lockNumber}</th>
                <Link to={'/updateGroup/' + movement._id + '/' + movement.group } className='btn btn-outline-warning btn-sm mx-1'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                      <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                    </svg>
                </Link>
              </tbody>
            ))}
          </table> 
            </div>
            </div>
           
        </div>
    )
}