import React from 'react'
import MenuBarAdmin from '../../components/layout/MenuBarAdmin'

export default function HomeAdmin() {
  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='col-md-2'>
          <MenuBarAdmin />
        </div>
        <div className='col mt-5'>
          <h1>Home Admin</h1>
        </div>
      </div>
    </div>
  )
}

