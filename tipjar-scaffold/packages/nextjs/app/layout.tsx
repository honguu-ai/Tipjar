import type { Metadata } from 'next'
import { Providers } from './providers'
import { Header } from '../components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'TipJar — Scaffold-ETH 2 스타일 데모',
  description: 'Hardhat + Next.js + wagmi + 자동 생성 deployedContracts.ts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
