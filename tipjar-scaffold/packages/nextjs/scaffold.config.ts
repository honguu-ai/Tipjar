import { hardhat, sepolia } from 'viem/chains'
import type { Chain } from 'viem'

// 이 파일에서 대상 네트워크와 전역 설정을 관리합니다.
// SE-2의 scaffold.config.ts에 해당합니다.
export const scaffoldConfig = {
  // 프론트엔드가 지원할 네트워크 목록
  targetNetworks: [hardhat, sepolia] as Chain[],

  // 블록 polling 간격 (ms)
  pollingInterval: 30_000,

  // .env.local에서 가져옴
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '',
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
} as const
