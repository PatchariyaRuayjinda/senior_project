import React from 'react'
import { Menu } from 'antd';
import {UserAddOutlined,
    LoginOutlined,
    HomeOutlined,
    LogoutOutlined,
    UserOutlined,
    ProfileOutlined
} from '@ant-design/icons';

import Swal from 'sweetalert2'

// Router
import { Link, useNavigate } from 'react-router-dom'
// Redux
import { useDispatch, useSelector } from 'react-redux';

export default function Header() {
    const { SubMenu } = Menu;
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user } = useSelector((state) => ({...state}))
    // console.log(user)
    const logout = () => {
        Swal.fire({
            position: 'top-center',
            icon: 'success',
            title: 'Logout success',
            showConfirmButton: false,
            timer: 1000
          })
        dispatch({
            type: 'LOGOUT',
            payload: null
        })
        navigate('/')
    }
    return (
        <div class='container-fluid' style={{position: "fixed"}}>
            {/* <div class='fixed-top'> */}
        <Menu mode="horizontal" >
            {!user && <>
                <Menu.Item key="mail" icon={<HomeOutlined />}>
                    <Link to="/">Home</Link>
                </Menu.Item>
            </>}

            {user && <>
                <Menu.Item key="mail" icon={<HomeOutlined />}>
                    {user.position === 'Warehouse Supervisor'
                    ? <Link to='/admin/index'>Home</Link>
                    : <Link to='/user/index'>Home</Link>
                    }
                    {/* <Link to="/">Home</Link> */}
                </Menu.Item>
            </>}
            

            {!user && <>
                <Menu.Item key="mail" style={{marginLeft: 'auto' }} icon={<LoginOutlined />}>
                    <Link to="/login">Login</Link>
                </Menu.Item>

                <Menu.Item key="register" icon={<UserAddOutlined />}>
                    <Link to="/Register">Register</Link>
                </Menu.Item>
            </>}
            
            {user && <>
                {/* <Menu.Item key="app" style={{marginLeft: 'auto' }} icon={<LogoutOutlined />} onClick={logout}>
                    Logout
                </Menu.Item> */}
                <SubMenu
                    style={{marginLeft: 'auto' }}
                    key="SubMenu"
                    icon={<UserOutlined />}
                    title={user.username}
                >
                        <Menu.Item key="setting:1" icon={<ProfileOutlined />}>Profile</Menu.Item>
                        <Menu.Item key="setting:2" icon={<LogoutOutlined />} onClick={logout}>logout</Menu.Item>
                    {/* <Menu.ItemGroup title="Item-2">
                        <Menu.Item key="setting:3">Option3</Menu.Item>
                        <Menu.Item key="setting:4">Option4</Menu.Item>
                    </Menu.ItemGroup> */}
                </SubMenu>

            </>}
            
{/*             
            <Menu.Item key="alipay">
                <a href="https://ant.design" target="_blank" rel="noopener noreferrer">
                    Navigation Four-Link
                </a>
            </Menu.Item> */}
        </Menu>
        {/* </div> */}
        </div>
    )
}
