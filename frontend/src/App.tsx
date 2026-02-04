import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { AlertProvider } from './providers/AlertProvider';
import Alert from './Components/alert/Alert';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Help from './pages/Help';
import ContactUs from './pages/ContactUs';
import MyAccount from './pages/MyAccount';
import EventDetail from './pages/EventDetail';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AlertProvider>
          <Alert />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/help" element={<Help />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/account" element={<MyAccount />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/checkout/:purchaseId" element={<Checkout />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

          </Routes>
        </AlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;