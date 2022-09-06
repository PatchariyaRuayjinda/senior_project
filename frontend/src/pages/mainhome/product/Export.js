import React from "react";
import { useEffect, useState, useCallback } from "react";
import { findAllProductInShelf } from "../../../functions/productInShelf";
import Sidebar from "../../../components/layout/Sidebar";
import {useReactToPrint} from "react-to-print"

export default function Export() {
    const [movement, setMovement] = useState([]);
    const handlePrint = useReactToPrint({
      content: () => findAllProductInShelf.current,
    })
    useEffect(() => {
        findAllProductInShelf()
          .then((response) => {
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
              </tbody>
            ))}
          </table> 
            </div>
            </div>
           
        </div>
    )
}