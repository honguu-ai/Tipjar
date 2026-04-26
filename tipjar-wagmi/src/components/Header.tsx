import { ConnectKitButton } from 'connectkit'
import { useAccount, useChainId } from 'wagmi'
import { sepolia, hardhat } from 'wagmi/chains'

export function Header() {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  const networkLabel =
    chainId === sepolia.id
      ? { text: 'Sepolia', cls: 'badge--sepolia' }
      : chainId === hardhat.id
        ? { text: 'Hardhat Local', cls: 'badge--hardhat' }
        : { text: 'Unknown Network', cls: 'badge--unknown' }

  return (
    <header className="app-header">
      <div className="app-header__left">
        <span className="app-logo">TipJar</span>
        <span className="app-subtitle">wagmi + viem 배포 데모</span>
      </div>
      <div className="app-header__right">
        {isConnected && (
          <span className={`badge ${networkLabel.cls}`}>{networkLabel.text}</span>
        )}
        <ConnectKitButton />
      </div>
    </header>
  )
}
