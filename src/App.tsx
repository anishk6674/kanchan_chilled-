import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
//import DownloadPdfStatic from './DownloadPdfStatic'; // Adjust path as needed
//import DownloadPdfProgrammatic from './DownloadPdfProgrammatic'; // Adjust path as needed

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import OrdersForm from './pages/OrdersForm';
import CustomerForm from './pages/CustomerForm';
import DailyUpdate from './pages/DailyUpdate';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import CanManagement from './pages/CanManagement';
import Settings from './pages/Settings';
import DownloadPdfDynamic  from './pages/Modal';




import { AppProvider } from './context/AppContext';

function App() {
  return (

    
    <AppProvider>
       
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<OrdersForm />} />
            <Route path="orders/edit/:id" element={<OrdersForm />} />
            <Route path="customers/new" element={<CustomerForm />} />
            <Route path="customers/edit/:id" element={<CustomerForm />} />
            <Route path="daily-update" element={<DailyUpdate />} />
            <Route path="billing" element={<Billing />} />
            <Route path="reports" element={<Reports />} />
            <Route path="can-management" element={<CanManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="modal" element={<DownloadPdfDynamic  />} />
           
          </Route>
        </Routes>
      </Router>



     
    </AppProvider>
  );
}

export default App;