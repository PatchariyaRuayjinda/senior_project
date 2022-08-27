import React, {useState} from 'react';
import Swal from 'sweetalert2';
// functions
import {login } from '../../functions/auth';

// redux
import {useDispatch } from 'react-redux';
import {useNavigate, Link } from 'react-router-dom';

// antd
import { Spin} from 'antd';

export default function Login() {
    const dispatch =  useDispatch();
    const navigate = useNavigate();

    const [value, setValue] = useState({
        username: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    
    // const roleBaseRedirect = (role) => {
    //   if(role === 'admin'){
    //     navigate('/admin/index')
    //   }else {
    //     navigate('/user/index')
    //   }
    // };

    const positionBaseRedirect = (position) => {
        // if(position === 'Warehouse Supervisor'){
        //     navigate('/admin/index')
        //   }else {
        //     navigate('/user/index')
        //   }
        if(position === 'Manager'){
            navigate('/admin/index')
        }else {
            navigate('/user/index')
        }
    }

    const handleChange = (e) => {
        setValue({...value, 
          [e.target.name]: e.target.value
        })
    };

      const handleSubmit = (e) => {
        setLoading(true)
        e.preventDefault()
        if (value.username === "" || value.password === ""){
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please fill username and password completely.'
              })
        } else{
            // console.log(value)
            login(value)
            .then(res => {
                // console.log(res.data)
                setLoading(false)
                // alert(res.data)
                dispatch({type: 'LOGIN',
                payload: {
                    token: res.data.token,
                    username: res.data.payload.user.username,
                    // role: res.data.payload.user.role
                    position: res.data.payload.user.position
                }
            });
                localStorage.setItem('token', res.data.token)
                // roleBaseRedirect(res.data.payload.user.role)
                positionBaseRedirect(res.data.payload.user.position)
            }).catch(err => {
                // console.log(err.response)
                // alert(err.response.data)
                setLoading(false)
                console.log(err)
                Swal.fire({
                    icon: 'error',
                    title: err.response.data,
                    text: 'Please, Try again.'
                  })
          });
        }
    }

  return (
    // <div className='page'>
    //   <h1 className=''>Login Page</h1>
    //   <form onSubmit={handleSubmit}>
    //     <label>Username</label>
    //     <input type="text" name="username" onChange={handleChange} className=""/>
    //     <label>Password</label>
    //     <input type='password' name='password' onChange={handleChange} className=""/>

    //     <button>Submit</button>
    //   </form>
    // </div>
    <div class="align col-12">
        <div class="row">
            <div class="col-md-11 mt-60 mx-md-auto">
                <div class="login-box bg-white pl-0">
                    <form class="form" onSubmit={handleSubmit}>
                        <div class="row no-gutters align-items-center">
                            <div class="col-md-6">
                                <div class="form-wrap bg-white">
                                    {loading
                                    ? <h4 className='btm-sep pb-3 mb-5'>Loading...<Spin /></h4>
                                    : <h4 class="btm-sep pb-3 mb-5">Login Page</h4>  
                                    }
                                    <div class="row">
                                        <div class="col-12">
                                            <div class="form-group position-relative">
                                                <span class="zmdi zmdi-account"></span>
                                                <input type="text" class="form-control" name='username' placeholder="username" onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="form-group position-relative">
                                                <span class="zmdi zmdi-key"></span>
                                                <input type="password" name='password' class="form-control" placeholder="Password" onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className='col-12 mt-30'>
                                            <button type="submit" class="btn btn-lg btn-custom btn-dark btn-block efbutton">Login</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="content text-center">
                                    <div class="border-bottom pb-5 mb-5">
                                        <h3 class="c-black">First time here?</h3>
                                        <div class="col-12 mt-30">
                                            <Link to='/register'>
                                                <button type="submit" class="btn btn-lg btn-custom btn-dark btn-block efbutton">Sign Up</button>  
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </form>
                </div>
            </div>
        </div>
    </div>
  )
}
