import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { AlertProvider } from './providers/AlertProvider';
import Alert from './Components/alert/Alert';
import ProtectedRoute from './Components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Help from './pages/Help';
import ContactUs from './pages/ContactUs';
import MyAccount from './pages/MyAccount';
import EventDetail from './pages/EventDetail';
import Queue from './pages/Queue';  
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import MyTickets from './pages/MyTickets';
import EventSearch from './pages/EventSearch';
import SeatSelection from './pages/SeatSelection';




function App() {


  
  return (
    <Router>
      <AuthProvider>
        <AlertProvider>
          <Alert />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/help" element={<Help />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/search" element={<EventSearch />} />

            {/* Protected user routes */}
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <MyAccount />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tickets" 
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:eventId/queue" 
              element={
                <ProtectedRoute>
                  <Queue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/:purchaseId" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:eventId/seats/:ticketTypeId" 
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              } 
/>
            

            {/* Protected admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/events/create" 
              element={
                <ProtectedRoute adminOnly>
                  <CreateEvent />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/events/:id/edit" 
              element={
                <ProtectedRoute adminOnly>
                  <EditEvent />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;