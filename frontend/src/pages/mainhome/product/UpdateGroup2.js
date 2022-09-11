import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { findShelfByZone, updateProductInShelf } from '../../../functions/productInShelf'
import {findAllShelf} from '../../../functions/shelf'
import Select from 'react-select'
import { updateProductGroup } from '../../../functions/product'
export default function UpdateGroup() {
    const navigate = useNavigate();
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
        updateProductGroup(id, group)
        .then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err.response)
        })
        navigate('/export')
    }

  return (
    <div className="container   ">
    <div className="row">
        <h1 style={{marginTop:"100px"}}>
        </h1>
    </div>
    <form className='form' onSubmit={"handleSubmit"}>
        <div className="card col-10 container py-2 text-center">
            <div className="card-body">
            <h2 className="caed-title">
                {/* {productD.productName} */}
            </h2>
            <div className="row" style={{margin : 'auto '}}>
                <h5 className="mx-3" style={{ fontSize : '30px'}}>
                    shelfNumber
                </h5>
                <div className="form-select form-select-lg mb-3 col-3" style={{margin : 'auto' ,fontSize : '20px', width: '50px' }}>
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
                {/* <input className="mx-5 rounded-bottom border-0" type="text" name="shelf" placeholder="Number add shelfNumber" required/> */}
                {/* <input className="rounded-bottom border-0" type="text" name="floorNumber" placeholder="Number add floorNumber" required/> */}
                {/* <input className="mx-5 rounded-bottom border-0" type="text" name="lockNumber" placeholder="Number add lockNumber" required/> */}
                <button className="btn btn-lg btn-outline-primary col-3"  style={{margin : 'auto'}} onClick={(e) => handleSubmit(e)}>Submit</button>
            </div>
            
        </div>
    </div>
    </form>
</div>

  )
}
