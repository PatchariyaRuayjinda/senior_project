import React from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import { useState,useEffect } from 'react'
import { findOneShelf, updateShelf } from '../../../functions/shelf';
import Swal from 'sweetalert2';
import { Select, Tag } from 'antd';

export default function ShelfUpdate() {
    const navigate = useNavigate();
    const { Option } = Select;
    const {id} = useParams()
    const [shelf,setshelf] = useState({
        _id: "",
        shrlfNumber: "",
        floorNumber: "",
        lockNumber: "",
        shelfStatus: "",
        zone: ""
      })
    
    useEffect(() =>{
        findOneShelf(id)
        .then(response =>{
            console.log(response.data)
            setshelf(response.data)
           
            //  console.log(data)
        }).catch(err => {
            console.log(err.prsponse.data)
        })
    }, [])

    const handleChange = (e) => {
        setshelf({...shelf, 
            [e.target.name]: e.target.value
        })
    }


     const handleSubmit = (e) => {
        // console.log('product', product)
        e.preventDefault()
        updateShelf(shelf)
        .then(res =>{
            console.log(res.data)
            Swal.fire({
                icon: 'success',
                title: "Edit Successful",
                showConfirmButton: false,
                timer: 1200
            });
            navigate("/shelfview")
        }).catch(err =>{
            console.log(err.response)
        })
     }

    const statusShelf = [true, false]

    const handleChangeStatus = (e) => {
        setshelf({...shelf,
            shelfStatus: e
        })
    }

    const handleChangeZone = (e) => {
        setshelf({...shelf,
            zone: e
        })
    }

    return(
        <div style={{marginLeft: "1rem"}}>
            <h1>Shelf Update</h1>
            <div className='container-fluid'>
                <form className='form' onSubmit={handleSubmit}>
                    <div className='container col-4 '>
                        <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded'>
                             <div className='card-body' style={{fontSize: '22px'}}>
                                {/* <input type="hidden" value={product._id} /> */}
                                <div className='marginDiv'>
                                    <span> ShelfNumber </span>
                                </div>
                                <div>
                                    <input className='rounded-pill border-1 form-control' type='text' name='shelfNumber' value={shelf.shelfNumber} onChange={handleChange} required />
                                </div>
                                <div className='marginDiv'>
                                    <span> floorNumber </span>
                                </div>
                                <div>
                                    <input className='rounded-pill border-1 form-control' type='text' name='floorNumber' value={shelf.floorNumber} onChange={handleChange} required />
                                </div>
                                <div className='marginDiv'>
                                    <span> lockNumber </span>
                                </div>
                                <div>
                                    <input className='rounded-pill border-1 form-control' type='text' name='lockNumber' value={shelf.lockNumber} onChange={handleChange} required />
                                </div>
                                <div className='marginDiv'>
                                    <span> shelfStatus </span>
                                </div>
                                <div>
                                    {/* <input className='rounded-pill border-1 form-control' type='text' name='shelfStatus' value={shelf.shelfStatus} onChange={handleChange} required /> */}
                                    <Select
                                    style={{width: '100%'}}
                                    value={shelf.shelfStatus}
                                    onChange={(e) => handleChangeStatus(e)}
                                    >
                                        {statusShelf.map((status, index) => (
                                            <Select.Option value={status} key={index}>
                                                {status === true
                                                ? <Tag color={"red"}>Not empty</Tag>
                                                : <Tag color={"green"}>Empty</Tag>
                                                }
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </div>
                                <div className='marginDiv'>
                                    <span> zone </span>
                                </div>
                                <div>
                                    {/* <input className='rounded-pill border-1 form-control' type='text' name='zone' value={shelf.zone} onChange={handleChange} required /> */}
                                    <Select
                                    style={{width: '100%'}}
                                    value={shelf.zone}
                                    onChange={(e) => handleChangeZone(e)}
                                    >
                                        <Option value='A'>A</Option>
                                        <Option value='B'>B</Option>
                                        <Option value='C'>C</Option>
                                    </Select>
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