import { Link } from 'react-router-dom';
import ButtonLink from '../Button/ButtonLink';

const Footer: React.FC = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="container mx-auto px-4">
      {/* Main footer content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Logo */}
        <div>
          <Link to="/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" className="w-16 h-16 fill-white">
              <path d="M 9 16 C 6.8026661 16 5 17.802666 5 20 L 5 60 C 5 62.197334 6.8026661 64 9 64 L 51 64 C 52.210938 64 53.264444 63.423754 54 62.564453 C 54.735556 63.423754 55.789062 64 57 64 L 71 64 C 73.197334 64 75 62.197334 75 60 L 75 20 C 75 17.802666 73.197334 16 71 16 L 57 16 C 55.789062 16 54.735556 16.576246 54 17.435547 C 53.264444 16.576246 52.210938 16 51 16 L 9 16 z M 9 18 L 51 18 C 52.116666 18 53 18.883334 53 20 A 1 1 0 0 0 54 21 A 1 1 0 0 0 55 20 C 55 18.883334 55.883334 18 57 18 L 71 18 C 72.116666 18 73 18.883334 73 20 L 73 60 C 73 61.116666 72.116666 62 71 62 L 57 62 C 55.883334 62 55 61.116666 55 60 A 1 1 0 0 0 54 59 A 1 1 0 0 0 53 60 C 53 61.116666 52.116666 62 51 62 L 9 62 C 7.8833339 62 7 61.116666 7 60 L 7 20 C 7 18.883334 7.8833339 18 9 18 z" />
            </svg>
          </Link>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-3">
          <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
          <Link to="/venues" className="text-gray-300 hover:text-white">Venues</Link>
          <Link to="/members/tickets" className="text-gray-300 hover:text-white">My tickets</Link>
          <Link to="/members/account" className="text-gray-300 hover:text-white">My account</Link>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-3">
          <Link to="/help" className="text-gray-300 hover:text-white">Help</Link>
          <Link to="/news" className="text-gray-300 hover:text-white">News</Link>
          <Link to="/contact" className="text-gray-300 hover:text-white">Contact us</Link>
          <Link to="/promoters" className="text-gray-300 hover:text-white">For promoters</Link>
        </div>

        {/* Sign up/in */}
        <div className="flex flex-col gap-4">
          <Link to="/members/signup" className="text-gray-300 hover:text-white">Sign up</Link>
          <span className="text-gray-500">or</span>
          <ButtonLink color="blue-filled" text="Sign in" url="members/signin" />
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <p className="text-gray-300 mb-4">Don't miss the latest on Modern ticketing news and events.</p>
        <div className="flex gap-2">
          <input
            type="email"
            name="email"
            autoComplete="off"
            placeholder="your@emailaddress.com"
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-gray-400">&copy; 2024 - Modern ticketing</span>
        <div className="flex gap-2 text-gray-400 text-sm">
          <Link to="/legal/privacy-policy" className="hover:text-white">Privacy policy</Link>
          <span>&bull;</span>
          <Link to="/legal/cookies" className="hover:text-white">Cookies</Link>
          <span>&bull;</span>
          <Link to="/legal/terms-of-service" className="hover:text-white">Terms of service</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;