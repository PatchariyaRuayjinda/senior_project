import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { findShelfByZone, updateShelf } from '../../../functions/productInShelf'

export default function UpdateGroup() {
    const {id, group} = useParams()
    const [value, setValue] = useState({
        _id: id,
        shelf_id: ''
    })

    useEffect(() => {
        findShelfByZone(group)
        .then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err.data)
        })
    })

    const handleChange = (e) => {
        setValue({...value,
            shelf_id: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        updateShelf(value)
        .then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err.data)
        })
    }

  return (
    <div className="container-fluid">
    <div className="row">
        <h1 style={{marginTop:"100px"}}>
        </h1>
    </div>
    <form className='form' onSubmit={"handleSubmit"}>
        <div className="card col-12 container py-2 text-center">
            <div className="card-body">
            <h2 className="caed-title">
                {/* {productD.productName} */}
            </h2>
            <div className="row" style={{margin : 'auto'}}>
                <h5 className="caed-title mx-2" style={{margin : 'auto' ,fontSize : '30px'}}>
                    {/* Group {productD.group} */}
                </h5>
                <h5 className="mx-3" style={{margin : 'auto'}}>
                    shelfNumber
                </h5>
                <div className="rounded-bottom border-0 col-2">
                    {/* <Select options={shelfNumber} onChange={handleChangeProduct} required/> */}
                </div>
                <h5 className="mx-3" style={{margin : 'auto'}}>
                    floorNumber
                </h5>
                <div className="rounded-bottom border-0 col-2">
                    {/* <Select options={floorNumber} onChange={handleChangeProduct} required/> */}
                </div>
                <h5 className="mx-3" style={{margin : 'auto'}}>
                    lockNumber
                </h5>
                <div className="rounded-bottom border-0 col-2">
                    {/* <Select options={lockNumber} onChange={handleChangeProduct} required/> */}
                </div>
                {/* <input className="mx-5 rounded-bottom border-0" type="text" name="shelf" placeholder="Number add shelfNumber" required/> */}
                {/* <input className="rounded-bottom border-0" type="text" name="floorNumber" placeholder="Number add floorNumber" required/> */}
                {/* <input className="mx-5 rounded-bottom border-0" type="text" name="lockNumber" placeholder="Number add lockNumber" required/> */}
                <button className="btn btn-lg btn-outline-primary col-1" style={{margin : 'auto'}}>Submit</button>
            </div>
            
        </div>
    </div>
    </form>
</div>

  )
}