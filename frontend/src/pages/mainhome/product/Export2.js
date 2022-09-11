import React from "react";
import { useEffect, useState } from "react";
import { findAllProductInShelf } from "../../../functions/productInShelf";
import Sidebar from "../../../components/layout/Sidebar";
import {Link} from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink, 
  Font 
} from '@react-pdf/renderer';
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  DataTableCell
} from '@david.kucsai/react-pdf-table'
import fontDev from './THSarabun.ttf'

//Register Font 
Font.register({family: 'THSarabun', src: fontDev})

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4',
    fontFamily: 'THSarabun',
    textAlign: 'center'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  }
});
const textstyles = StyleSheet.create({
  textNumber: {
    textAlign: 'right',
    paddingRight: 2,
    // position: 'absolute'
    // marginRight: '10px',
    // position: 'fixed'
  },
  textHead: {
    textAlign: 'center',
  },
  textstring: {
    textAlign: 'left',
    paddingLeft: 2
  }
})

export default function Export2() {
    const { user } = useSelector((state) => ({...state}))
    const [movement, setMovement] = useState(null);
    useEffect(() => {
        findAllProductInShelf()
          .then((res) => {
            console.log(res.data)
            setMovement(res.data);
            console.log(movement)
          })
          .catch((err) => {
            console.log(err.response.data);
          });
      }, []);
      if(movement === null){
        return(
          <div>Waiting...</div>
        )
      }else {
      return(
        <div className="container-fluid">
            <div className="row">
            <Sidebar />
            <div class="ml col-s-9 mt-5">
                <div class="row">
                    <h1 className="col-8 text-light">Export</h1>
                   <PDFDownloadLink
                      document={
                        <Document>
                          <Page size="A4" style={styles.page}>
                              <View style={styles.section}>
                                {/* <Text>{movement._id}</Text> */}
                                {/* <Text>Test</Text> */}
                                <Table>
                                  <TableHeader>
                                    <TableCell style={textstyles.textHead}>ProductName</TableCell>
                                    <TableCell style={textstyles.textHead}>Movement</TableCell>
                                    <TableCell style={textstyles.textHead}>%</TableCell>
                                    <TableCell style={textstyles.textHead}>Group</TableCell>
                                    <TableCell style={textstyles.textHead}>Shelf</TableCell>
                                    <TableCell style={textstyles.textHead}>Floor</TableCell>
                                    <TableCell style={textstyles.textHead}>Lock</TableCell>
                                  </TableHeader>
                                  <TableBody data={movement} style={styles.positionTable}>
                                    <DataTableCell style={textstyles.textstring} getContent={x => x.Name} />
                                    <DataTableCell style={textstyles.textNumber} getContent={x => x.movement} />
                                    <DataTableCell style={textstyles.textNumber} getContent={x => x.totalQuantity} />
                                    <DataTableCell style={textstyles.textstring} getContent={x => x.group} />
                                    <DataTableCell style={textstyles.textNumber} getContent={x => x.shelfNumber} />
                                    <DataTableCell style={textstyles.textNumber} getContent={x => x.floorNumber} />
                                    <DataTableCell style={textstyles.textNumber} getContent={x => x.lockNumber} />
                                  </TableBody>
                                </Table>
                              </View>
                            
                          </Page>
                        </Document>
                      }
                      fileName='newShelf.pdf'
                      className='btn btn-primary m-1 my-3'
                    >
                      PDF Download
                    </PDFDownloadLink>
                </div>
                <table class="table table-bordered table-light">
            <thead>
              <tr className="text-center">
                <th scope="col">ProductName</th>
                <th scope="col">Movement</th>
                <th scope="col">%</th>
                <th scope="col">group</th>
                <th scope="col">ShelfNumber</th>
                <th scope="col">FloorNumber</th>
                <th scope="col">LockNumber</th>
                {
                    user.position === 'Warehouse Staff' && <>
                    <th scope="col">Action</th>
                    </>
          }
                
              </tr>
            </thead>
            {movement.map((movement) => (
              <tbody>
                <td scope="row">{movement.Name}</td>
                <td>{movement.movement}</td>
                <td>{movement.totalQuantity}</td>
                <td>{movement.group}</td>
                <td>{movement.shelfNumber}</td>
                <td>{movement.floorNumber}</td>
                <td>{movement.lockNumber}</td>
                {
                    user.position === 'Warehouse Staff' && <>
                    <Link to={'/updateGroup/' + movement._id + '/' + movement.group } className='btn btn-outline-warning btn-sm mx-1'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                      <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                    </svg>
                </Link>
                    </>
          }
                
              </tbody>
            ))}
          </table> 
            </div>
            </div>
           
        </div>
    )
  }
}