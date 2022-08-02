import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
// Page
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Home from "./pages/home";
import HomeAdmin from "./pages/admin/HomeAdmin";
import HomeUser from "./pages/user/HomeUser";
import ManagaAdmin from "./pages/admin/ManageAdmin";
import ProductView from "./pages/mainhome/product/ProductView";
import ProductCreate from "./pages/mainhome/product/ProductCreate";
import ProductUpdate from "./pages/mainhome/product/ProductUpdate";
import ProductDetailView from "./pages/mainhome/productdetail/ProductDetailView";
import ProductDetailCreate from "./pages/mainhome/productdetail/ProductDetailCreate";
import ProductDetailUpdate from "./pages/mainhome/productdetail/ProductDetailUpdate";
import DisbursementView from "./pages/mainhome/disbursement/DisbursementView";
import DisbursementCreate from "./pages/mainhome/disbursement/DisbursementCreate";
import DisbursementUpdate from "./pages/mainhome/disbursement/DisbursementUpdate";
import ShelfView from "./pages/mainhome/shelf/ShelfView";
// import ZoneView from "./pages/mainhome/zone/ZoneView";
// import ZoneCreate from "./pages/mainhome/zone/ZoneCreate";
import ZoneUpdate from "./pages/mainhome/zone/ZoneUpdate";
import ShelfCreate from "./pages/mainhome/shelf/ShelfCreate";
import ShelfUpdate from "./pages/mainhome/shelf/ShelfUpdate";
import InMovement from "./pages/mainhome/product/InMovement";
import ShelfAddProduct from "./pages/mainhome/shelf/ShelfAddProduct";
// Layout
import Header from "./components/layout/Header";
// functions
import { currentUser } from "./functions/auth";
// redux
import { useDispatch } from "react-redux";
// Routes
import UserRoute from "./routes/UserRoute";
import AdminRoute from "./routes/AdminRoute";
import ProductDView from "./pages/mainhome/product/ProductDView";


function App() {
  const dispatch = useDispatch();
  const idtoken = localStorage.token;
  if (idtoken) {
    currentUser(idtoken)
      .then((res) => {
        console.log(res.data.username);
        dispatch({
          type: "LOGIN",
          payload: {
            token: idtoken,
            username: res.data.username,
            role: res.data.role,
          },
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route
          path="/user/index"
          element={
            <UserRoute>
              <HomeUser />
            </UserRoute>
          }
        />
        <Route
          path="/admin/index"
          element={
            <AdminRoute>
              <HomeAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/manage-admin"
          element={
            <AdminRoute>
              <ManagaAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/productview"
          element={
            <UserRoute>
              <ProductView />
            </UserRoute>
          }
        />
        <Route
          path="/productcreate"
          element={
            <UserRoute>
              <ProductCreate />
            </UserRoute>
          }
        />
        <Route
          path="/productupdate/:id"
          element={
            <UserRoute>
              <ProductUpdate />
            </UserRoute>
          }
        />
        <Route
          path="/productDView/:id"
          element={
            <UserRoute>
              <ProductDView />
            </UserRoute>
          }
        />
        {/* <Route
          path="/zoneview"
          element={
            <UserRoute>
              <ZoneView />
            </UserRoute>
          }
        />
        <Route
          path="/zonecreate"
          element={
            <UserRoute>
              <ZoneCreate />
            </UserRoute>
          }
        /> */}
        <Route
          path="/updatezone/:id"
          element={
            <UserRoute>
              <ZoneUpdate />
            </UserRoute>
          }
        />
        <Route
          path="/productdetailview"
          element={
            <UserRoute>
              <ProductDetailView />
            </UserRoute>
          }
        />
        <Route
          path="/productdetailcreate"
          element={
            <UserRoute>
              <ProductDetailCreate />
            </UserRoute>
          }
        />
        <Route
          path="/productdetailupdate/:id"
          element={
            <UserRoute>
              <ProductDetailUpdate />
            </UserRoute>
          }
        />
        <Route
          path="/shelfview"
          element={
            <UserRoute>
              <ShelfView />
            </UserRoute>
          }
        />
        <Route
          path="/shelfcreate"
          element={
            <UserRoute>
              <ShelfCreate />
            </UserRoute>
          }
        />
        <Route
          path="/shelfupdate/:id"
          element={
            <UserRoute>
              <ShelfUpdate />
            </UserRoute>
          }
        />
        <Route
          path="/shelfaddproduct"
          element={
            <UserRoute>
              <ShelfAddProduct />
            </UserRoute>
          }
        />
        <Route
          path="/disbursementview"
          element={
            <UserRoute>
              <DisbursementView />
            </UserRoute>
          }
        />
        <Route
          path="/inMovement"
          element={
            <UserRoute>
              <InMovement />
            </UserRoute>
          }
        />
        <Route
          path="/disbursementcreate"
          element={
            <UserRoute>
              <DisbursementCreate />
            </UserRoute>
          }
        />
        <Route
          path="/disbursementupdate/:id"
          element={
            <UserRoute>
              <DisbursementUpdate />
            </UserRoute>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
