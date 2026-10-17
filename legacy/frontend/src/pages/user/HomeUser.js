import React from 'react'
import Sidebar from '../../components/layout/Sidebar'
import './background.css'
export default function HomeUser() {

  return (
    <div class='container-fluid'>
      
      <div className='row'>
        <Sidebar />
          <h1 className='ml col-s-10'> Home Users</h1>
          
      </div>
    </div>
  )
}
