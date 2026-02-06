import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import Input from '../components/form/Input';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      
      // Redirect na osnovu role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
      
      showAlert({
        type: 'success',
        text: 'Successfully logged in!',
        show: true
      });
    } catch (err: any) {
      showAlert({
        type: 'error',
        text: err.response?.data?.message || 'Login failed. Please try again.',
        show: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dobro došli nazad!</h1>
          <p className="text-gray-600 mt-2">Prijavite se na svoj nalog</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Adresa
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="vasa@emailadresa.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Lozinka
            </label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              maxLength={50}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Zapamti me
              </label>
            </div>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Zaboravili ste lozinku?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Prijavljivanje...' : 'Prijavite se'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Nemate nalog?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Registrujte se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;