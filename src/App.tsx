import { useSyncExternalStore } from 'react'
import './App.css'
import IpLookup from './components/IpLookup'
import PhoneLookup from './components/PhoneLookup'

function subscribeToNavigation(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getPage() {
  if (window.location.hash === '#ip') return 'ip'
  if (window.location.hash === '#phone') return 'phone'
  return 'menu'
}

function App() {
  const page = useSyncExternalStore(subscribeToNavigation, getPage)

  return (
    <>
      <div id="background" className="background-element" aria-hidden="true" />
      <main id="foreground" className="app-content">
        {page !== 'menu' && (
          <nav className="page-navigation" aria-label="Main navigation">
            <a className="back-link" href="#">← All lookup tools</a>
          </nav>
        )}

        {page === 'menu' && (
          <section className="tool-menu" aria-labelledby="menu-title">
            <header className="menu-heading">
              <h1 id="menu-title">What would you like to look up?</h1>
            </header>
            <div className="tool-grid">
              <a className="box tool-card" href="#ip">
                <h2>IP lookup</h2>
                <p>Explore an IP address’s network, location, VPN detection, and risk signals.</p>
                <span className="tool-action">Open IP lookup <span aria-hidden="true">↗</span></span>
              </a>
              <a className="box tool-card" href="#phone">
                <h2>Phone number reputation</h2>
                <p>Check phone numbers for spam reports and reputation signals.</p>
                <span className="tool-action">Open phone lookup <span aria-hidden="true">↗</span></span>
              </a>
            </div>
          </section>
        )}

        {page === 'ip' && <IpLookup />}

        {page === 'phone' && <PhoneLookup />}

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
