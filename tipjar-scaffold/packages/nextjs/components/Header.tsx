'use client'
import { ConnectKitButton } from 'connectkit'
import { useChainId, useAccount } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'

export function Header() {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  const network =
    chainId === hardhat.id  ? { label: 'Localhost:8545', cls: 'badge--localhost' } :
    chainId === sepolia.id  ? { label: 'Sepolia',        cls: 'badge--sepolia'   } :
                              { label: 'Unknown',         cls: 'badge--unknown'   }

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo">⛽ TipJar Scaffold</span>
        <span className="header__sub">Scaffold-ETH 2 패턴 · Hardhat + Next.js + wagmi</span>
      </div>
      <div className="header__right">
        {isConnected && <span className={`badge ${network.cls}`}>{network.label}</span>}
        <ConnectKitButton />
      </div>
    </header>
  )
}
