import { Link } from 'react-router-dom';

// interfaces
interface IProps {
  url: string;
  icon: string;
  text: string;
}

const ButtonCircle: React.FC<IProps> = ({ url, icon, text }) => (
  <Link className='circle-button' to={`/${url}`}>
    <div className='circle'>
      <span className='material-symbols-outlined right-icon'>{icon}</span>
    </div>
    <div className='text'>{text}</div>
  </Link>
);

export default ButtonCircle;
