import React from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import { useState,useEffect } from 'react'
import { findOneZone, updateZone } from '../../../functions/zone';
import Swal from 'sweetalert2';
export default function ZoneUpdate() {
    const navigate = useNavigate();
    const {id} = useParams()
    const [zone,setZone] = useState({
        _id: "",
        zonetype: ""
      })
    
    useEffect(() =>{
        findOneZone(id)
        .then(response =>{
            console.log(response.data)
            setZone(response.data)
        //  console.log(data)
            //  console.log(data)
        }).catch(err => {
            console.log(err.prsponse.data)
        })
    }, [])

     const handleChange = (e) => {
        setZone({...zone, 
           [e.target.name]: e.target.value
         })
     }


     const handleSubmit = (e) => {
        // console.log('product', product)
         e.preventDefault()
         updateZone(zone)
         .then(res =>{
            console.log(res.data)
         }).catch(err =>{
            console.log(err.response)
         })

     }
    return(
        <div>
            <h1>ZoneUpdate</h1>
            <div className='container-fluid'>
            <form className='form' onSubmit={handleSubmit}>
                <div className='container col-4 '>
                    <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded'>

                             <div className='card-body '>
                                {/* <input type="hidden" value={product._id} /> */}
                                <div>
                                <span> ZoneType </span>
                                </div>
                            <div>
                               <input className='rounded-pill border-0 form-control' type='text' name='zonetype' value={zone.zonetype} onChange={handleChange} required />
                           </div>
                             <button type='submit' className='btn btn-lg btn-custom btn-dark btn-block efbutton col-4 container mt-3'> Submit </button>
                         </div>
                       
                        
                    </div> 
                </div>
            </form>
        </div>
        </div>
    )
}