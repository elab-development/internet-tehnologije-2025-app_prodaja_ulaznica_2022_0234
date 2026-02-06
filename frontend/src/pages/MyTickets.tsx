import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';
import Heading from '../components/heading/Heading';

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Master>
      <Section className="container mx-auto px-4 py-8">
        <Heading type={1} color="text-gray-800" text="My Account" />
        
        {/* User Info Card */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Username:</span>
                <span className="font-semibold text-gray-800">{user?.korisnickoIme}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold text-gray-800">{user?.email}</span>
              </div>
              {user?.ime && (
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">First Name:</span>
                  <span className="font-semibold text-gray-800">{user.ime}</span>
                </div>
              )}
              {user?.prezime && (
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Last Name:</span>
                  <span className="font-semibold text-gray-800">{user.prezime}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Role:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/tickets')}
                className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition group"
              >
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">My Tickets</p>
                    <p className="text-sm text-gray-600">View purchased tickets</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition group"
              >
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Browse Events</p>
                    <p className="text-sm text-gray-600">Find new events</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Admin Panel (if admin) */}
          {user?.role === 'admin' && (
            <div className="bg-purple-50 rounded-lg shadow-md p-6 mb-6 border border-purple-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Panel</h2>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full flex items-center justify-between p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition group"
              >
                <div className="flex items-center">
                  <svg className="w-8 h-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold">Admin Dashboard</p>
                    <p className="text-sm opacity-90">Manage events and users</p>
                  </div>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </Section>
    </Master>
  );
};

export default MyAccount;