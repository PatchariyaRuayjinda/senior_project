import React, {useEffect,useState} from "react";
import Select from 'react-select'
import { useParams } from 'react-router-dom'
import axios from 'axios';
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2';
import { findOneProduct } from '../../../functions/product';
import {findAllShelf} from '../../../functions/shelf'

export default function ShelfAddProduct() {
    const navigate = useNavigate();
    const [productD,setProductD] = useState([])
    const [shelf_id, setShelf_id] = useState('')
    const [shelfNumber , setShrlfNumber] = useState([])
    const [floorNumber , setFloorNumber] = useState([])
    const [lockNumber , setLockNumber] = useState([])
    // const [shelf , setShrlf] = useState({
    //     shelfNumber: "",
    //     floorNumber: "",
    //     lockNumber: "",
    //     shelfStatus: ""
    // })
    const {id} = useParams()
    // console.log(id)

    const handleChangeProduct = (e) => {
        setShelf_id(e.value)
        // console.log(e.label)
        // console.log(e.value)
    }
    // console.log(id)

    const handleSubmit = async(e) => {
        e.preventDefault()
        if (shelf_id == ''){
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please Select product',
              })
        }else{
            console.log(shelf_id)
            console.log(id)
            await axios.post(process.env.REACT_APP_API + '/addInShelf', {
                // productStatus: value.productStatus,
                // shelfNumber: label.shelfNumber,
                // floorNumber: label.floorNumber,
                // lockNumber: label.lockNumber,
                product_id: id,
                shelf_id: shelf_id
            }).then(async(res) => {
                // await withdraw(product_id, value.receiveQuantity)
                // .then(res => {
                    Swal.fire(
                        'Successful product detail creation',
                        'success',
                        // navigate('/productdetailview')    
                    )
                //     console.log(res.data)
                // }).catch(err => {
                //     console.log(err.response)
                // })
            })
            .catch(err => {
                console.log(err.response)
            })
        }  
    }

    useEffect(()=>{
        findOneProduct(id)
        .then(response =>{
            // console.log(response.data)
            setProductD(response.data)
        }).catch(err => {
            console.log(err.prsponse.data)
        })
        findAllShelf()
        .then(res => {
            const data = res.data
            const shelfOption = data.map(shelf => ({
                "value": shelf._id,
                "label": shelf.shelfNumber,
                // "label": shelf.floorNumber
            }))
            setShrlfNumber(shelfOption)
            const shelfOption2 = data.map(shelf => ({
                "value": shelf._id,
                "label": shelf.floorNumber,
                // "label": shelf.floorNumber
            }))
            setFloorNumber(shelfOption2)
            const shelfOption3 = data.map(shelf => ({
                "value": shelf._id,
                "label": shelf.lockNumber,
                // "label": shelf.floorNumber
            }))
            setLockNumber(shelfOption3)
        }).catch(err => {
            console.log(err.response)
        })
    }, [])

    return(
        <div className="container-fluid">
            <div className="row">
                <h1 style={{marginTop:"100px"}}>
                </h1>
            </div>
            <form className='form' onSubmit={handleSubmit}>
                <div className="card col-12 container py-2 text-center">
                    <div className="card-body">
                    <h2 className="caed-title">
                        {productD.productName}
                    </h2>
                    <div className="row" style={{margin : 'auto'}}>
                        <h5 className="caed-title mx-2" style={{margin : 'auto' ,fontSize : '30px'}}>
                            Group {productD.group}
                        </h5>
                        <h5 className="mx-3" style={{margin : 'auto'}}>
                            shelfNumber
                        </h5>
                        <div className="rounded-bottom border-0 col-2">
                            <Select options={shelfNumber} onChange={handleChangeProduct} required/>
                        </div>
                        <h5 className="mx-3" style={{margin : 'auto'}}>
                            floorNumber
                        </h5>
                        <div className="rounded-bottom border-0 col-2">
                            <Select options={floorNumber} onChange={handleChangeProduct} required/>
                        </div>
                        <h5 className="mx-3" style={{margin : 'auto'}}>
                            lockNumber
                        </h5>
                        <div className="rounded-bottom border-0 col-2">
                            <Select options={lockNumber} onChange={handleChangeProduct} required/>
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