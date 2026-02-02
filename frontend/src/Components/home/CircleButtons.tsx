import Slider from '../Slider/Slider'
import ButtonCircle from '../button/ButtonCircle'

const CircleButtons: React.FC = () => (
  <Slider>
    
    <ButtonCircle icon='stadium' text='Concert' url='list' />
    <ButtonCircle icon='sports' text='Sports' url='list' />
    <ButtonCircle icon='piano' text='Musical' url='list' />
    <ButtonCircle icon='festival' text='Festival' url='list' />
  </Slider>
);

export default CircleButtons;
