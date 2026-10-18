import React, {useState} from 'react'
import './style.css'
import { addShelf } from '../../../functions/shelf'
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'
import { Select, Tag } from 'antd';

export default function ShelfCreate() {
    const { Option } = Select;
    const navigate = useNavigate();
    const [value, setValue] = useState({
        shrlfNumber: "",
        floorNumber: "",
        lockNumber: "",
        // shelfStatus: "",
        zone: ""
      })
    
    const handleChange = (e) => {
        setValue({...value, 
          [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        addShelf(value)
        .then(res =>{
            Swal.fire(
                value.productName,
                'Successful Shelf creation',
                'success',
                navigate('/shelfview')    
            )
        }).catch(err =>{
            Swal.fire('แจ้งเตือน',
            err.response.data,
            'error'
          )
        })
    }

    const statusShelf = [true, false]

    const handleChangeStatus = (e) => {
        setValue({...value,
            shelfStatus: e
        })
    }

    const handleChangeZone = (e) => {
        setValue({...value,
            zone: e
        })
    }

    return(
        <div className='container-fluid'>
            <form className='form' onSubmit={handleSubmit}>
                <h1>Create Shelf</h1>
                <div className='container col-4 '>
                    <div className='card caed-ui shadow-lg p-3 mb-4 bg-body rounded' style={{margin: "0.3rem"}}>
                        <div className='card-body fontDivCreate'>
                            <div className='marginDiv'>
                                <span> Shelf Number </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='shelfNumber' placeholder='Please enter the shelf number.' onChange={handleChange} required />
                            </div>
                            <div className='marginDiv'>
                                <span> Floor Number </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='floorNumber' placeholder='Please enter the floor number.' onChange={handleChange} required />
                            </div>
                            <div className='marginDiv'>
                                <span> Lock Number </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='lockNumber' placeholder='Please enter the lock number.' onChange={handleChange} required />
                            </div>
                            {/* <div className='marginDiv'>
                                <span> ShelfStatus </span>
                            </div>
                            <div>
                                <Select
                                style={{width: '100%'}}
                                placeholder="Please select shelf status"
                                onChange={(e) => handleChangeStatus(e)}
                                >
                                    {statusShelf.map((status, index) => (
                                        <Select.Option value={status} key={index}>
                                            {status === true
                                            ? <Tag color={"green"}>ไม่ว่าง</Tag>
                                            : <Tag color={"red"}>ว่าง</Tag>
                                            }
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div> */}
                            <div className='marginDiv'>
                                <span> Zone </span>
                            </div>
                            <div>
                                {/* <input className='rounded-pill border-1 form-control' type='text' name='zone' placeholder='Please enter group.' onChange={handleChange} required /> */}
                                <Select
                                style={{width: '100%'}}
                                placeholder="Please select group"
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
    )
}