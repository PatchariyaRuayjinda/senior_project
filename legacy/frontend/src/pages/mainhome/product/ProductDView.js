import React, { useEffect,useState } from "react";
import { useParams } from 'react-router-dom'
import { findOneProduct } from '../../../functions/product';
import Sidebar from "../../../components/layout/Sidebar";

export default function ProductDView() {
    const {id} = useParams()
    const [product,setProductD] = useState([])

    useEffect(()=>{
        findOneProduct(id)
        .then(res =>{
            console.log(res.data)
            setProductD(res.data)
        }).catch(err => {
            console.log(err.prsponse.data)
        })
    }, [])

    return(
        <div class="container-fluid">
            <div class="row">
                <Sidebar />
                <div class="ml col-s-10">
                    <h1>test ProductDView</h1>
                    <div class="card container col-5">
                        <div class="card-body">
                            <div class="row">
                                <h1 class=" card-title text-start col-9">{product.productName}</h1>
                                <h5 class="text-center col-3 my-3">Group {product.group} </h5>
                            </div>
                            <div class="row">
                                <h7 class="col-8 my-1">Quantity {product.quantity}</h7>
                                <h7 class='text-right col-4 my-1'>{product.price} Baht/Unit</h7>
                                <h7 class=" col-12">Product Status ปกติ</h7>
                                <p className="col-12">_______________________________________________________________________________</p>
                                <h7 class="col-6">เบิกไปกี่ครัง 5 ครั้ง</h7>
                                <h7 class="text-right col-6 my-1">คืนไปกี่ครั้ง 3 ครั้ง</h7>
                                <h7 class="col-6 my-1">FloorNumber 1 to 10</h7>
                                <h7 class="col-6 text-right my-1">LockNumber 2 to 8</h7>
                                <h7 class='text-right col-12 my-1'>วันที่เข้า 25 / เดือน / 2552</h7>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}