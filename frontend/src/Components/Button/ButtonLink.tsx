import { Link } from 'react-router-dom';

interface IProps {
  url: string;
  text: string;
  color: string;
  leftIcon?: string;
  rightIcon?: string;
}

const ButtonLink: React.FC<IProps> = ({ url, text, color, leftIcon, rightIcon }) => (
  <Link to={`/${url}`} className={`button ${color}`}>
    {leftIcon && (
      <span className="material-symbols-outlined left-icon">{leftIcon}</span>
    )}
    {text}
    {rightIcon && (
      <span className="material-symbols-outlined right-icon">{rightIcon}</span>
    )}
  </Link>
);

export default ButtonLink;