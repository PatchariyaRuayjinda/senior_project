import React, {useState, useEffect} from 'react';
import { Switch, Select, Tag, Modal, Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import MenuBarAdmin from '../../components/layout/MenuBarAdmin'
import { useSelector } from 'react-redux';
import moment from 'moment/min/moment-with-locales';
// import Swal from 'sweetalert2'
// functions
import { listUser, 
    changeStatus, 
    changeRole,
    changePosition,
    deleteUser,
    resetPassword
} from '../../functions/users';

export default function ManagaAdmin() {
    const {user} = useSelector((state) => ({...state}))
    const [data, setData] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const Swal = require('sweetalert2')
    const [value, setValue] = useState({
        id: '',
        password: '',
        confirmPassword: ''
    })

    const showModal = (_id) => {
        setIsModalVisible(true);
        setValue({...value,
            id: _id
        })
    };

    const handleChangePassword = (e) => {
        // console.log(e.target.name)
        // console.log(e.target.value)
        setValue({...value, [e.target.name]: e.target.value})
    }

    const handleOk = () => {
        setIsModalVisible(false);
        console.log('handleOk', value.password, value.confirmPassword)
        if(value.password.length < 4 && value.confirmPassword.length <4){
            alert('Password must be longer than 4 characters')
            setIsModalVisible(true);
        }else if(value.password !== value.confirmPassword){
            alert('Password not match')
            setIsModalVisible(true);
        } else {
             resetPassword(user.token, value.id, {value})
            .then(res => {
                console.log(res.data)
                alert(res.data)
                loadData(user.token);
            }).catch(err => {
                console.log(err.response)
            })
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    useEffect(() => {
        loadData(user.token)
    }, [])
    const loadData = (authtoken) => {
        listUser(authtoken)
        .then(res => {
            console.log(res.data)
            setData(res.data)

        }).catch(err => {
            console.log(err.response.data)
        })
    }

    // const handleChangeStatus = (e, _id) => {
    //     const value = {
    //         id: _id,
    //         enabled: e
    //     }
    //     changeStatus(user.token, value)
    //     .then(res => {
    //         console.log(res)
    //         loadData(user.token)
    //     }).catch(err => {
    //         console.log(err.response)
    //     })
    // }

    const roleData = ['admin', 'user']
    // const positionData = ['Warehouse Supervisor', 'Warehouse Staff']
    const positionData = ['Manager', 'Warehouse Staff']

    // const handleChangeRole = (e, _id) => {
    //     const value = {
    //         id: _id,
    //         role: e
    //     }
    //     console.log(value)
    //     changeRole(user.token, value)
    //     .then(res => {
    //         console.log(res.data)
    //         loadData(user.token)
    //     }).catch(err => {
    //         console.log(err.response)
    //     })
    // }

    const handleChangePosition = (e, _id) => {
        const value = {
            id: _id,
            position: e
        }
        changePosition(user.token, value)
        .then(res => {
            console.log(res.data)
            loadData(user.token)
        }).catch(err => {
            console.log(err.response)
        })
    }

    // const handleDelete = (_id) => {
    //     if (window.confirm('Are You Sure Delete!!')){
    //         // console.log(_id)
    //         deleteUser(user.token, _id)
    //         .then(res => {
    //             console.log(res.data)
    //             loadData(user.token)
    //         }).catch(err => {
    //             console.log(err.response)
    //         })
    //     }
    // }

    const handleDelete = (_id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then((result) => {
            if (result.isConfirmed) {
                deleteUser(user.token, _id)
                .then(res => {
                    Swal.fire(
                        'Deleted!',
                        'Account has been deleted.',
                        'success'
                    )
                    loadData(user.token)
                }).catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: err.response.data,
                        // footer: '<a href="">Why do I have this issue?</a>'
                      })
                    console.log(err.response)
                })
              
            }
          })
    }

  return (
    <div className='container-fluid'>
        <div className='row'>
            <div className='col-md-2'>
                <MenuBarAdmin />
            </div>
            <div className='col-10 mt-5'>
                <div className='row'>

                <h1>Managa Warehouse Supervisor Page</h1>
                <text style={{paddingLeft: '200px'}}></text>
                <a href='/register' className='mt-3 absbtn btn-primary py-0 my-4 btn-lg'>New User </a>

                </div>
                
                {/* <Button type='primary'>New User</Button> */}
                
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Username</th>
                            <th scope="col" style={{textAlign: 'center'}}>Position</th>
                            {/* <th scope="col">status</th> */}
                            <th scope="col">Created at</th>
                            <th scope="col">Last Login/Update</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((item, index) => (
                        <tr>
                            <th scope="row">{index +1}</th>
                            <td>{item.username}</td>
                            <td>
                                {/* <Select
                                style={{width:'100%'}}
                                value={item.role}
                                onChange={(e) => handleChangeRole(e, item._id)}
                                >
                                
                                    {roleData.map((role, index) => (
                                        <Select.Option value={role} key={index}>
                                        {role == 'admin' 
                                        ? <Tag color="green">{role}</Tag>
                                        : <Tag color='red'>{role}</Tag>
                                        }
                                </Select> */}
                                <Select
                                style={{width:'100%'}}
                                value={item.position}
                                onChange={(e) => handleChangePosition(e, item._id)}
                                >
                                    {positionData.map((position, index) => (
                                        <Select.Option value={position} key={index}>
                                            {position === 'Manager'
                                            ? <Tag color={"green"}>{position}</Tag>
                                            : <Tag color={"red"}>{position}</Tag>
                                            }
                                        </Select.Option>
                                    ))}
                                </Select>
                            </td>
                            {/* <td>
                                <Switch 
                                checked={item.enabled} 
                                onChange={(e)=>handleChangeStatus(e, item._id)}/>
                            </td> */}
                            <td>
                                {moment(item.createdAt).locale('th').format('ll')}
                            </td>
                            <td>
                                {moment(item.updatedAt).locale('th').startOf(item.updatedAt).fromNow()}
                            </td>
                            <td style={{fontSize: '20px'}}>
                                <EditOutlined style={{marginRight: '1rem'}} onClick={() => showModal(item._id)}/>
                                <DeleteOutlined onClick={()=> handleDelete(item._id)}/>
                            </td>
                        </tr>
                        ))}  
                    </tbody>
                </table>
                <Modal title="Basic Modal" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
                    <p style={{marginBottom: '-1px'}}>New Password</p>
                    <input type="password" name="password" onChange={handleChangePassword} required/>
                    <p style={{marginTop: '2px', marginBottom: '0px'}}>Confirm New Password</p>
                    <input type="password" name="confirmPassword" onChange={handleChangePassword} required/>
                </Modal>
            </div>
        </div>
    </div>
  )
}