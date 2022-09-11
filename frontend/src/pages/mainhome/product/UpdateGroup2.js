import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { findShelfByZone, updateProductInShelf } from '../../../functions/productInShelf'
import {findAllShelf} from '../../../functions/shelf'
import Select from 'react-select'
export default function UpdateGroup() {
    const {id, group} = useParams()
    const [data, setData] = useState([])
    const [value, setValue] = useState({
        _id: id,
        shelf_id: '',
        shelfStatus: true
    })

    useEffect(() => {
        findShelfByZone(group)
        .then(res => {
            console.log(res.data)
            setData(res.data)
        }).catch(err => {
            console.log(err.response)
        })
    },[])

    const onChangeShelf = (e) => {
        setValue({...value,
            shelf_id: e.target.value
        })
        // console.log(e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(value)  
        updateProductInShelf(value)
        .then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err.response)
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

                {/* <Select options={shelfNumber} onChange={(e) => onChangeShelf(e)} required/> */}
                <select onChange={(e) => onChangeShelf(e)} defaultValue={"default"}>
                    <option value={"default"} disabled>
                        Select Shelfs
                    </option>
                    {data.map((item, index) => 
                        <option
                            // key={index}
                            value={item._id}
                        >
                            Shelf: {item.shelfNumber}
                            Floor: {item.floorNumber}
                            Lock: {item.lockNumber}
                        </option>
                    )}
                </select>
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
                <button className="btn btn-lg btn-outline-primary col-1" style={{margin : 'auto'}} onClick={(e) => handleSubmit(e)}>Submit</button>
            </div>
            
        </div>
    </div>
    </form>
</div>

  )
}
