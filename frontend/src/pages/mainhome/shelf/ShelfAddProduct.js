import React from "react";

export default function ShelfAddProduct() {
    return(
        <div>
            <h1>ShelfAddProduct</h1>
            <div className="card col-7 container py-2">
                <div className="card-body">
                    <h2 className="caed-title">
                        ชื่อProduct
                    </h2>
                    <div className="row">
                        <h5 className="caed-title mx-2" style={{margin : 'auto'}}>
                            Group C
                        </h5>
                        <input className="mx-5 rounded-bottom border-0" type="text" name="shelf" placeholder="Number add shelfNumber" required/>
                        <input className="rounded-bottom border-0" type="text" name="floorNumber" placeholder="Number add floorNumber" required/>
                        <input className="mx-5 rounded-bottom border-0" type="text" name="lockNumber" placeholder="Number add lockNumber" required/>
                        <button className="btn btn-outline-primary" >อะต่อไป</button>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}