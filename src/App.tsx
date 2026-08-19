import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <section id="content" className="content-element">
      <div>
        <h1>IP Intelligence</h1>
      </div>
    </section>
  )
}

export default App
