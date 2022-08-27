import React, {useEffect,useState} from "react";
import { useParams } from 'react-router-dom'
import { findOneProduct } from '../../../functions/product';

export default function ShelfAddProduct() {
    const [productD,setProductD] = useState([])
    const [shelf , setShrlf] = useState({
        shelfNumber: "",
        floorNumber: "",
        lockNumber: "",
        shelfStatus: ""
    })
    const {id} = useParams()
    // console.log(id)

    useEffect(()=>{
        findOneProduct(id)
        .then(response =>{
            // console.log(response.data)
            setProductD(response.data)
        }).catch(err => {
            console.log(err.prsponse.data)
        })
    }, [])

    return(
        <div className="container-fluid">
            <div className="row">
                <h1 style={{marginTop:"50px"}}>
                </h1>
            </div>
                <div className="card col-8 container py-2 text-center">
                    <div className="card-body">
                    <h2 className="caed-title">
                        {productD.productName}
                    </h2>
                    <div className="row" style={{margin : 'auto'}}>
                        <h5 className="caed-title mx-2" style={{margin : 'auto'}}>
                            Group {productD.group}
                        </h5>
                        <input className="mx-5 rounded-bottom border-0" type="text" name="shelf" placeholder="Number add shelfNumber" required/>
                        <input className="rounded-bottom border-0" type="text" name="floorNumber" placeholder="Number add floorNumber" required/>
                        <input className="mx-5 rounded-bottom border-0" type="text" name="lockNumber" placeholder="Number add lockNumber" required/>
                        <button className="btn btn-lg btn-outline-primary mx-4" >Submit</button>
                    </div>
                    
                </div>
            </div>
            
        </div>
    )
}