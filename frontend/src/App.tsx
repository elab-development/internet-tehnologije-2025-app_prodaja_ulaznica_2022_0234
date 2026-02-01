import Header from './Components/layout/Header'

function App() {
  return (
    <div>
      <Header />
      <main className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Dobrodošli na veb sajt za prodaju ulaznica! 🎫
        </h1>
        <p className="text-gray-600 mt-4">
          Header je sada aktivan - probaj dropdown i mobile menu!
        </p>
      </main>
    </div>
  )
}

export default App