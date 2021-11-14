import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// WARN: strict mode causes annoying deprecation warnings in the console, for the production build it should be enabled
// (well, this app will never be in any kind of production, but howbeit...)

// ReactDOM.render(
//   <React.StrictMode>
//     <Router basename={window.location.pathname}>
//       <Routes>
//         <Route path="/" element={<App />} />
//       </Routes>
//     </Router>
//   </React.StrictMode>,
//   document.getElementById('root')
// );

ReactDOM.render(
  <Router basename={window.location.pathname}>
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  </Router>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
