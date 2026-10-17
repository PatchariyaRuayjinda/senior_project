import React from "react";
import './sidebar.css'
export default function Sidebar(){
  return(
    <div class="sidebar mx-3">
      {/* <a href="/"></a> */}
      <a href="/productview">Product</a>
      <a href="/productdetailview">Product Detail</a>
      <a href="/disbursementview">Disbursement</a>
      <a href="/shelfview">Shelf</a>
      {/* <a href="/zoneview">Zone</a> */}
      <a href="/inMovement">ABC analysis</a>
    </div>
)
}