import { Link } from 'react-router-dom';
import Slider from '../Slider/Slider';

interface ButtonCircleProps {
  icon: string;
  text: string;
  url: string;
}

const ButtonCircle: React.FC<ButtonCircleProps> = ({ icon, text, url }) => (
  <Link className='circle-button' to={url}>
    <div className='circle'>
      <span className='material-symbols-outlined'>{icon}</span>
    </div>
    <div className='text'>{text}</div>
  </Link>
);

const CircleButtons: React.FC = () => (
  <Slider touch={true} margin={10}>
    <ButtonCircle icon='theater_comedy' text='Theater' url='/events?category=theater' />
    <ButtonCircle icon='stadium' text='Concert' url='/events?category=concert' />
    <ButtonCircle icon='child_care' text='Kids' url='/events?category=kids' />
    <ButtonCircle icon='sports_football' text='Sports' url='/events?category=sports' />
    <ButtonCircle icon='attractions' text='Attractions' url='/events?category=attractions' />
    <ButtonCircle icon='piano' text='Musical' url='/events?category=musical' />
    <ButtonCircle icon='comedy_mask' text='Comedy' url='/events?category=comedy' />
    <ButtonCircle icon='festival' text='Festival' url='/events?category=festival' />
  </Slider>
);

export default CircleButtons;