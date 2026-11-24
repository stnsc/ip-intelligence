import { useEffect } from 'react'
import './App.css'
import IpLookup from './components/IpLookup'

function App() {
  useEffect(() => {
    if (window.location.hash !== '#ip') {
      window.history.replaceState(null, '', '#ip')
    }
  }, [])

  return (
    <>
      <div id="background" className="background-element" aria-hidden="true" />
      <main id="foreground" className="app-content">
        <IpLookup />
      </main>
      <footer className="footer-element">
        <p className="font-xanh-mono italic" style={{ fontSize: '1.3rem' }}>IP Intelligence</p>
        <p className="font-xanh-mono">made by Vlad in 2026.</p>
        <p className="font-xanh-mono"><a href="https://stnsc.net" target="_blank" rel="noopener noreferrer">stnsc.net</a></p>
      </footer>
    </>
  )
}

export default App
