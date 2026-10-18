import { Button, Col, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import MenuBarAdmin from '../../components/layout/MenuBarAdmin'
import { listUser } from '../../functions/users'
import { EditOutlined, DeleteOutlined, FormOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const ManageUser = () => {
  const [data, setData] = useState([])
  const [isAdminEditModal, setIsAdminEditModal] = useState(false)
  const [profile, setProfile] = useState(null)

  const positionData = ['Manager', 'Warehouse Staff','Admin']
  const {
    user,
  }
   = useSelector((state) => ({
  ...state
   }))

   function onChangePosition(e, id){

   }

  function onAdminEdit(item) {
    setIsAdminEditModal(true)
    setProfile(item)
  }

  async function onClickSubmitEditProfile() {

  }
  
  async function showModal(id) {

  }

  async function onDelete(id){

  }


  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      width: 100
    },
    {
      title: 'Position',
      dataIndex: 'position',
      width: 150,
      render: (data) => {
        return (
          <Select
            style={{width: '100%'}}
            value={data}
            >
              {positionData.map((item, index) => (
                <Select.Option value={item} key={index}>
                  {
                    item === 'Manager' ?
                    <Tag color={"green"}>{item}</Tag>
                    : <Tag color={'red'}>{item}</Tag>
                  }
                </Select.Option>
              ))}
            </Select>
        )
      }
    },
    {
      title: 'Created at',
      dataIndex: 'createdAt',
      render: (data) => {
        const createdAt = dayjs(data).toDate()
        return (
          createdAt
        )
      }
    },
    {
      title: 'Last Login/Update',
      dataIndex: 'updatedAt',
      render: (data) => {
        const lastActive = dayjs(data)
        return dayjs(lastActive).fromNow()
      }
    },
    {
      title: 'Action',
      width: 150,
      render: (item) => {
        return (
          <div style={{fontSize: '18px'}}>
            <Space direction='horizontal' size={16}>
              <FormOutlined  onClick={() => onAdminEdit(item)} />
              <EditOutlined  onClick={() => showModal(item._id)} />
              <DeleteOutlined onClick={()=> onDelete(item._id)} />
            </Space>
          </div>
        )
      }
    }
  ]

  function onClickRegister(){
    console.log('first')
  }

  
  useEffect(() => {
    listUser(user.token).then(res => {
      console.log('data', data)
      setData(res.data)
    }).catch((err) => {
      console.log('err.response.data', err.response.data)
    })
  }, [])

  if(!data.length) return
  return (

   <div className='container-fluid'>
    <Row gutter={[16, 16]}>
      <Col span={4}>
        <MenuBarAdmin />
      </Col>
      <Col flex="1 1 0%">
        <Space direction='horizontal'>
        <Typography.Title>
          Managa user page
        </Typography.Title>
        <Button onClick={onClickRegister}>
          register
        </Button>
        </Space>
        <Table  columns={columns} dataSource={data}/>
      </Col>
    </Row>
   </div>
   
  )
}

export default ManageUser