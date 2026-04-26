import { createConfig, http } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { scaffoldConfig } from './scaffold.config'

const { alchemyApiKey, walletConnectProjectId } = scaffoldConfig

export const wagmiConfig = createConfig({
  chains: [hardhat, sepolia],
  connectors: [
    injected(),
    ...(walletConnectProjectId ? [walletConnect({ projectId: walletConnectProjectId })] : []),
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(
      alchemyApiKey
        ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
        : undefined
    ),
  },
  ssr: true,
})
