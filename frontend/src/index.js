import React from "react";
import ReactDOM from "react-dom";
import { PDFViewer } from '@react-pdf/renderer';
import App from "./App";
import 'bootstrap/dist/css/bootstrap.min.css';
// Redux
import { Provider } from 'react-redux';
import { createStore } from "redux";
import { composeWithDevTools } from 'redux-devtools-extension';
import rootReducer from './reducers';

// Antd
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'

// Route
import { BrowserRouter } from 'react-router-dom';

const store = createStore(rootReducer, composeWithDevTools());

// const root = ReactDOM.createRoot(document.getElementById('root'));
ReactDOM.render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  // </React.StrictMode>,
  document.getElementById("root")
);
