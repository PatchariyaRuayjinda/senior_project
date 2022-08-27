import React from "react";
import { useEffect, useState, useCallback } from "react";
import { outMovement } from "../../../functions/movement";
import Sidebar from "../../../components/layout/Sidebar";

export default function Export() {
    const [movement, setMovement] = useState([]);

    useEffect(() => {
        outMovement()
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
              </tbody>
            ))}
          </table> 
            </div>
            </div>
           
        </div>
    )
}