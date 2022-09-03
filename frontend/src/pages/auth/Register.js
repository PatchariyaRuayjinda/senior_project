import React, {useState, useEffect} from 'react'
// functions
import { register } from '../../functions/auth';
import { findAllPosition } from '../../functions/position';
import { findAllDepartment } from '../../functions/department';

//library
import Swal from 'sweetalert2'
import { Link, useNavigate } from 'react-router-dom'
import Select from 'react-select'

export default function Register() {
  const navigate = useNavigate();
  const [positionOption, setPositionOption] = useState('')
  const [departmentOption, setDepartmentOption] = useState('')
  const [value, setValue] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    surname: "",
    email: "",
    position: "",
    department: ""
  })
  

  const handleChange = (e) => {
    setValue({...value, 
      [e.target.name]: e.target.value
    })
  }

  const handleChangePosition = (e) => {
    setValue({...value,
      position: e.label
    })
  }

  const handleChangeDepartment = (e) => {
    setValue({...value,
      department: e.label
    })
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(value)
    if (value.password !== value.confirmPassword){
      Swal.fire({
        icon: 'error',
        title: 'Password not match!!',
        text: 'Try again.'
      })
      // alert('Password not match')
    } else {
      register(value).then(res => {
        Swal.fire(
          'username: '+ value.username,
          res.data,
          'success'
        )
        console.log(res.data)
        navigate('/admin/index')
        // alert(res.data)
      }).catch(err => {
        Swal.fire('แจ้งเตือน',
        err.response,
        'error')
        console.log(err.response.data)
        // alert(err.response.data)
      })
    }
  }

  useEffect(() => {
    findPosition()
    findDepartment()
  }, [])

  const findPosition = () => {
    findAllPosition()
    .then(res => {
      console.log(res.data)
      const data = res.data
      const option = data.map(data => ({
        "value": data._id,
        "label": data.positionName
      }))
      setPositionOption(option)
    }).catch(err => {
      console.log(err)
    })
  }

  const findDepartment = () => {
    findAllDepartment()
    .then(res => {
      console.log(res.data)
      const data = res.data
      const option = data.map(data => ({
        "value": data._id,
        "label": data.departmentName
      }))
      setDepartmentOption(option)
    }).catch(err => {
      console.log(err)
    })
  }

  return (
    
    // <div>
    //   <h1>Register Page</h1>
    //   <form onSubmit={handleSubmit}>
    //     <label>Username</label>
    //     <input type="text" name="username" onChange={handleChange} />
    //     <label>Password</label>
    //     <input type='password' name='password' onChange={handleChange}/>
    //     <label>Confirm Password</label>
    //     <input type='password' name='confirmPassword' onChange={handleChange}/>

    //     <button disabled={value.password.length < 4}>Submit</button>
    //   </form>
    // </div>
    <div class="align body">
      <div class="row" style={{marginTop: "60px"}}>
          <div class="col-md-11 mt-60 mx-md-auto">
              <div class="login-box bg-white pl-0">
                  <div class="row no-gutters align-items-center">
                      <div class="col-md-6">
                          <div class="form-wrap bg-white" >
                              <h4 class="btm-sep pb-3 mb-5">Register Page</h4>
                              <form class="form" onSubmit={handleSubmit}>
                                  <div class="row" style={{marginBottom: '-15px'}}>
                                      <div class="col-12">
                                          <div class="form-group position-fixed">
                                              <span class="zmdi zmdi-account"></span>
                                              <input type="text" class="form-control" name='username' placeholder="username" onChange={handleChange} required/>
                                          </div>
                                      </div>
                                      <div class="col-12">
                                          <div class="form-group position-relative">
                                              <span class="zmdi zmdi-key"></span>
                                              <input type="password" name='password' class="form-control" placeholder="Password" onChange={handleChange} required/>
                                          </div>
                                      </div>
                                      <div class="col-12">
                                          <div class="form-group position-relative">
                                              <span class="zmdi zmdi-key"></span>
                                              <input type="password" name='confirmPassword' class="form-control" placeholder="confirm Password" onChange={handleChange} required/>
                                          </div>
                                      </div>
                                      <div class="col-12">
                                          <div class="form-group position-relative">
                                              <span class="zmdi zmdi-account"></span>
                                              <input type="text" name='firstname' class="form-control" placeholder="firstname" onChange={handleChange} required/>
                                          </div>
                                      </div>
                                      <div class="col-12">
                                          <div class="form-group position-relative">
                                              <span class="zmdi zmdi-account"></span>
                                              <input type="text" name='surname' class="form-control" placeholder="surname" onChange={handleChange} required/>
                                          </div>
                                      </div>
                                      <div class="col-12">
                                          <div class="form-group position-relative">
                                              <span class="zmdi zmdi-email"></span>
                                              <input type="email" name='email' class="form-control" placeholder="email" onChange={handleChange} required/>
                                          </div>
                                      </div>
                                      <div class="col-12">
                                          <div class="form-group position-relative">
                                              {/* <span class="zmdi zmdi-email"></span>
                                              <input type="text" name='position' class="form-control" placeholder="position" onChange={handleChange} required/> */}
                                              <Select options={positionOption} onChange={handleChangePosition} placeholder='Select Postion...'/>
                                          </div>
                                      </div>
                                      <div class="col-12" >
                                          <div class="form-group position-relative">
  
                                              <Select options={departmentOption} onChange={handleChangeDepartment} placeholder='Select Department...'/>
                                          </div>
                                      </div>
                                      <div class="col-12 mt-30 ">
                                        <button class="btn btn-lg btn-custom btn-dark btn-block efbutton" disabled={value.password.length < 4}>Sign Up</button>
                                    </div> 
                                  </div>
                              </form>
                          </div>
                      </div>
                      <div class="col-md-6" style={{marginTop: '3.5rem'}}>
                          <div class="content text-center">
                              <div class="border-bottom pb-5 mb-5">
                                  <h3 class="c-black">Have your account?</h3>
                                  <div class="col-12 mt-30 ">
                                      <Link to='/login'>
                                        <button type="submit" class="btn btn-lg btn-custom btn-dark btn-block efbutton">Sign In</button>
                                      </Link>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  )
}
