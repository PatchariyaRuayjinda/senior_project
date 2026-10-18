import React from 'react'
import { Link } from 'react-router-dom'
import './sidebar.css'

export default function MenuBarAdmin() {
  return (
    <div class="sidebar">
      <Link to='/admin/index'>แดชบอร์ด</Link>
      <Link to='/admin/manage-admin'>จัดการผู้ใช้งาน</Link>
      <Link to='/admin/manage-users'>จัดการผู้ใช้งาน</Link>
    </div>
  )
}
      // <nav className='wrapper'>
      //   <div className='wrapper sideber'>
      //       <ul className='nav flex-column'>
      //         <li className='nav-item'>
                
      //         </li>

      //         <li className='nav-item'>
                
      //         </li>
      //       </ul>
      //     </div>
      // </nav>