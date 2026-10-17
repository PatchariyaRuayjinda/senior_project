import React, {useState} from 'react'
import './style.css'
import { addZone } from '../../../functions/zone'
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'

export default function ZoneCreate() {
    const navigate = useNavigate();
    const [value, setValue] = useState({
        zonetype: ""
      })
    
    const handleChange = (e) => {
        setValue({...value, 
          [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        addZone(value)
        .then(res =>{
            Swal.fire(
                value.zonetype,
                'Successful Zone creation',
                'success',
                navigate('/zoneview')    
            )
        }).catch(err =>{
            Swal.fire('แจ้งเตือน',
            err.response.data,
            'error'
          )
        })

    }

    return(
        <div className='container-fluid'>
            <form className='form' onSubmit={handleSubmit}>
                <h1>CreateProduct</h1>
                <div className='container col-4 '>
                    <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded'>
                        <div className='card-body '>
                            <div>
                                <span> Zone </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-0 form-control' type='text' name='zonetype' placeholder='Please name the zone.' onChange={handleChange} required />
                            </div>
                            <button type='submit' className='btn btn-lg btn-custom btn-dark btn-block efbutton col-4 container mt-3'> Submit </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}