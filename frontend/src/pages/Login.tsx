import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import Input from '../Components/Form/Input';
import { handleApiError } from '../utils/ErrorHandler';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { showAlert } = useAlert();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // VALIDACIJA EMAIL-A
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Ukloni grešku kada korisnik počne da kuca
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // INPUT VALIDACIJA
    let hasErrors = false;
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email je obavezan';
      hasErrors = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Unesite validnu email adresu';
      hasErrors = true;
    }

    if (!formData.password) {
      newErrors.password = 'Lozinka je obavezna';
      hasErrors = true;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Lozinka mora imati najmanje 6 karaktera';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      
      // Redirect na osnovu parametara
      const eventId = searchParams.get('event_id');
      if (eventId) {
        navigate(`/events/${eventId}/queue`);
      } else {
        navigate('/');
      }
      
      showAlert({
        type: 'success',
        text: 'Uspešno ste se prijavili!',
        show: true
      });
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      showAlert({
        type: 'error',
        text: errorMessage,
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
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
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
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
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