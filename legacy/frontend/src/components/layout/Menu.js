import React from "react";

export default function Menu(){
    return(
        <div class='col-2 navbar'>
        <ui className="navbar-nav">
          <li className="list nav-item my-1">
            <a className='navbar-nav' href='/productview'>
              <span className='icon'>
              </span>
              <span className='list nav-item'>Peoduct</span>
            </a>
          </li>
          <li className="list">
            <a href='/productdetailview'>
              <span>

              </span>
              <span className='list nav-item my-1'>productDetail</span>
            </a>
          </li>
          <li className="list">
            <a href='/disbursementview'>
              <span>

              </span>
              <span className='list nav-item my-1'>disbursement</span>
            </a>
          </li>
          <li className="list">
            <a href='/shelfview'>
              <span>

              </span>
              <span className='list nav-item my-1'>shelf</span>
            </a>
          </li>
          <li className="list">
            <a href='/zoneview'>
              <span>

              </span>
              <span className='list nav-item my-1'>zone</span>
            </a>
          </li>
        </ui>
    </div>
    )
}