import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InvoiceForm from './components/InvoiceForm';
import InvoiceResult from './components/InvoiceResult';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InvoiceForm />} />
          <Route path="/result" element={<InvoiceResult />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;