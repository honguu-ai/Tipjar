import { useState } from 'react'
import { Header } from './components/Header'
import { DeployContract } from './components/DeployContract'
import { InteractContract } from './components/InteractContract'
import './App.css'

type Tab = 'deploy' | 'interact'

export default function App() {
  const [tab, setTab] = useState<Tab>('deploy')
  const [deployedAddress, setDeployedAddress] = useState<string>(
    () => localStorage.getItem('tipjar_deployed_address') ?? ''
  )

  return (
    <>
      <Header />

      <nav className="tab-nav">
        <button
          className={`tab-btn ${tab === 'deploy' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('deploy')}
        >
          1. 컨트랙트 배포
        </button>
        <button
          className={`tab-btn ${tab === 'interact' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('interact')}
        >
          2. 컨트랙트 상호작용
          {deployedAddress && <span className="tab-dot" />}
        </button>
      </nav>

      <main className="main-content">
        {tab === 'deploy' ? (
          <DeployContract
            onDeployed={addr => {
              setDeployedAddress(addr)
              if (addr) setTab('interact')
            }}
          />
        ) : (
          <InteractContract />
        )}
      </main>

      <footer className="app-footer">
        <span>wagmi v3 + viem v2 + ConnectKit 데모</span>
        <span className="footer-sep">|</span>
        <a
          href="https://wagmi.sh"
          target="_blank"
          rel="noopener noreferrer"
        >
          wagmi docs
        </a>
        <span className="footer-sep">|</span>
        <a
          href="https://viem.sh"
          target="_blank"
          rel="noopener noreferrer"
        >
          viem docs
        </a>
      </footer>
    </>
  )
}
