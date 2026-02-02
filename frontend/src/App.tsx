import Heading from './components/heading/Heading'
import Header from './components/layout/Header'
import Section from './components/section/Section'
import FormSearch from './components/home/FormSearch'   
import CircleButtons from './components/home/CircleButtons' 


function App() {
  return (
    <div>
      <Section className='white-background'>
      <div className='container'>
        <div className='center'>
          <Heading type={1} color='gray' text='WELCOME' />
          <p className='gray'>Look for any kinds of events, in any country and city that you want.</p>
        </div>
      </div>
      <div className='center'>
        <div className='container'>
          <div className='top-search'>
            <FormSearch />
          </div>
        </div>
        <div className='circle-buttons'>
          <CircleButtons />
        </div>
      </div>

      
    </Section>
    </div>
  )
}

export default App