import React, { useState } from "react";
import "./style.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import axios from "axios";

export default function ProductCreate() {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    productName: "",
    quantity: "",
    price: "",
    group: "",
  });

  const [productDetail, setProductDetail] = useState({
    productStatus: "ปกติ",
    receiveDate: moment().toISOString(),
    expireDate: "",
    receiveQuantity: "",
  });

  const handleChangeProduct = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleChangeProductDetail = (e) => {
    setProductDetail({ ...productDetail, [e.target.name]: e.target.value });
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    // const groupABC = "C"
    await axios
      .post(process.env.REACT_APP_API + "/addProduct", {
        productName: product.productName,
        quantity: productDetail.receiveQuantity,
        productStatus: "ปกติ",
        price: product.price,
        group: product.group,
      })
      .then(async (res) => {
        const _id = await res.data._id;
        submitProductDetail(_id);
      })
      .catch((err) => {
        console.log(err.response);
      });
    // await addProduct(product)
    // .then( async(res) => {
    //     const _id = await res.data._id
    //     submitProductDetail(_id)
    // }).catch(err => {
    //     console.log(err.response)
    // })
  };

  const submitProductDetail = async (_id) => {
    await axios
      .post(process.env.REACT_APP_API + "/addProductDetail", {
        productStatus: productDetail.productStatus,
        receiveDate: productDetail.receiveDate,
        expireDate: productDetail.expireDate,
        receiveQuantity: productDetail.receiveQuantity,
        product_id: _id,
      })
      .then((res) => {
        console.log(res.data);
        Swal.fire(
          product.productName,
          "Successful product creation",
          "success",
          navigate("/productview")
        );
      })
      .catch((err) => {
        console.log(err.response);
        Swal.fire("แจ้งเตือน", err.response.data, "error");
      });
  };
  return (
    <div className="container-fluid">
      <form className="form" onSubmit={handleSubmit}>
        <h1>CreateProduct</h1>
        <div className="container col-4">
          <div
            className="card caed-ui shadow-lg p-3 mb-4 bg-body rounded"
            style={{ margin: "0.3rem" }}
          >
            <div className="card-body fontDivCreate">
              <h3 className="shadow-text mb-4">Product</h3>
              <div className="marginDiv">
                <span> Product </span>
              </div>
              <div>
                <input
                  className="rounded-pill border-1 form-control"
                  type="text"
                  name="productName"
                  placeholder="Please. Enter product name."
                  onChange={handleChangeProduct}
                />
              </div>
              {/* <div style={{marginBottom: "0.3rem"}}>
                                <span> Quantity </span>
                            </div>
                            <div>
                                <input className='rounded-pill border-1 form-control' type='text' name='quantity' placeholder='Please number the quantity.' onChange={handleChange} required />
                            </div> */}
              <div className="marginDiv">
                <span> Price per unit </span>
              </div>
              <div>
                <input
                  className="rounded-pill border-1 form-control"
                  type="text"
                  name="price"
                  placeholder="Please. Enter price per unit."
                  onChange={handleChangeProduct}
                />
              </div>
              {/* <div className="marginDiv">
                <span> Group </span>
              </div>
              <div>
                <input
                  className="rounded-pill border-1 form-control"
                  type="text"
                  name="group"
                  placeholder="Please. Enter the group."
                  onChange={handleChangeProduct}
                />
              </div> */}
              <h3 className="shadow-text my-4">ProductDetail</h3>
              <div className="marginDiv">
                <span> Receive quantity </span>
              </div>
              <div>
                <input
                  className="rounded-pill border-1 form-control"
                  type="text"
                  name="receiveQuantity"
                  placeholder="Please. Enter receiveQuantity."
                  onChange={handleChangeProductDetail}
                />
              </div>
              <div className="marginDiv">
                <span> Expire date </span>
              </div>
              <div>
                <input
                  className="rounded-pill border-1 form-control"
                  type="text"
                  name="expireDate"
                  placeholder="Please. Enter the expireDate."
                  onChange={handleChangeProductDetail}
                />
              </div>
              <button
                type="submit"
                className="btn btn-lg btn-custom btn-dark btn-block efbutton col-4 container mt-3"
              >
                {" "}
                Submit{" "}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
