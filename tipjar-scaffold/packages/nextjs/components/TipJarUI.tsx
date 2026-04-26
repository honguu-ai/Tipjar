'use client'
import { useState } from 'react'
import { parseEther, formatEther } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'
import { useScaffoldReadContract } from '../hooks/useScaffoldReadContract'
import { useScaffoldWriteContract } from '../hooks/useScaffoldWriteContract'
import { deployedContracts } from '../contracts/deployedContracts'

type ContractMap = Record<string, Record<string, { address: string }>>

function toNetworkName(chainId: number) {
  if (chainId === hardhat.id) return 'localhost'
  if (chainId === sepolia.id) return 'sepolia'
  return 'localhost'
}

export function TipJarUI() {
  const { address: userAddress, isConnected } = useAccount()
  const chainId = useChainId()
  const networkName = toNetworkName(chainId)
  const [tipAmount, setTipAmount] = useState('0.001')

  // deployedContracts.ts에서 현재 네트워크의 컨트랙트 주소 확인
  const contractAddress = (deployedContracts as unknown as ContractMap)[networkName]?.TipJar?.address

  // ── Scaffold 훅 사용 ─────────────────────────────────────────────
  // contractName만 주면 deployedContracts에서 address/abi 자동 조회
  const { data: balance, refetch } = useScaffoldReadContract({
    contractName: 'TipJar',
    functionName: 'getBalance',
    watch: true,
  })

  const { data: owner } = useScaffoldReadContract({
    contractName: 'TipJar',
    functionName: 'owner',
  })

  const {
    writeContractAsync: sendTip,
    isPending: isTipping,
    isConfirming: tipConfirming,
    isSuccess: tipDone,
    error: tipError,
  } = useScaffoldWriteContract('TipJar')

  const {
    writeContractAsync: withdraw,
    isPending: isWithdrawing,
    isConfirming: withdrawConfirming,
    isSuccess: withdrawDone,
    error: withdrawError,
  } = useScaffoldWriteContract('TipJar')

  if (withdrawDone || tipDone) refetch()

  const isOwner = owner && userAddress &&
    (owner as string).toLowerCase() === userAddress.toLowerCase()

  // 배포된 네트워크 목록 확인
  const deployedNetworks = Object.keys(deployedContracts as unknown as ContractMap)
  const isWrongNetwork = !contractAddress && deployedNetworks.length > 0

  // 현재 네트워크에 컨트랙트가 없는 경우
  if (!contractAddress) {
    return (
      <div className="section">
        <div className="card card--no-deploy">
          {isWrongNetwork ? (
            <>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text-h)', fontWeight: 500 }}>
                네트워크를 변경해주세요
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                현재 연결된 네트워크: <strong>{networkName}</strong>
              </p>
              <div className="alert alert--info" style={{ textAlign: 'left' }}>
                MetaMask에서 네트워크를 아래 중 하나로 변경하세요:
                <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                  {deployedNetworks.map(n => (
                    <li key={n}><strong>{n}</strong></li>
                  ))}
                </ul>
              </div>
              <div className="scaffold-hint">
                배포된 컨트랙트 주소 ({deployedNetworks[0]}){'\n'}
                {(deployedContracts as unknown as ContractMap)[deployedNetworks[0]]?.TipJar?.address}
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text-h)', fontWeight: 500 }}>
                컨트랙트가 아직 배포되지 않았습니다
              </p>
              <div className="scaffold-hint">
                <strong># 1. 로컬 블록체인 실행 (터미널 A)</strong>{'\n'}
                npm run chain{'\n\n'}
                <strong># 2. 컨트랙트 배포 (터미널 B)</strong>{'\n'}
                npm run deploy{'\n\n'}
                <strong># Sepolia 배포</strong>{'\n'}
                npm run deploy:sepolia
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="section">
        <div className="card card--no-deploy">
          <p style={{ margin: 0 }}>지갑을 연결하면 TipJar와 상호작용할 수 있습니다.</p>
          <div className="scaffold-hint">
            <strong>배포된 컨트랙트 ({networkName})</strong>{'\n'}
            {contractAddress}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section">

      {/* 배포 정보 */}
      <div className="card">
        <h2 className="card__title">배포 정보</h2>
        <div className="scaffold-hint">
          <strong>deployedContracts.ts</strong> (npm run deploy 후 자동 생성){'\n\n'}
          네트워크: <strong>{networkName}</strong>{'\n'}
          주소: <strong>{contractAddress}</strong>
        </div>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-row__label">컨트랙트 잔액</span>
            <span className="info-row__value info-row__value--big">
              {balance !== undefined ? `${formatEther(balance as bigint)} ETH` : '...'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-row__label">Owner</span>
            <span className="info-row__value info-row__value--mono">
              {owner ? `${(owner as string).slice(0, 8)}…${(owner as string).slice(-6)}` : '...'}
              {isOwner && <span className="badge badge--ok" style={{ marginLeft: 8 }}>나</span>}
            </span>
          </div>
        </div>
        <button className="btn-link" onClick={() => refetch()}>잔액 새로고침</button>
      </div>

      {/* 팁 보내기 */}
      <div className="card">
        <h2 className="card__title">팁 보내기</h2>
        <p className="card__desc">
          <code>tip()</code> payable 함수 호출 —{' '}
          <strong>useScaffoldWriteContract('TipJar')</strong> 훅 사용
        </p>
        <div className="input-row">
          <input
            className="input"
            type="number"
            min="0"
            step="0.001"
            value={tipAmount}
            onChange={e => setTipAmount(e.target.value)}
          />
          <span className="input-unit">ETH</span>
          <button
            className="btn btn--primary"
            disabled={isTipping || tipConfirming}
            onClick={() => sendTip({ functionName: 'tip', value: parseEther(tipAmount) })}
          >
            {isTipping ? '승인 대기...' : tipConfirming ? '확인 중...' : '팁 전송'}
          </button>
        </div>
        {tipError && (
          <div className="alert alert--error">
            {(tipError as { shortMessage?: string }).shortMessage ?? tipError.message}
          </div>
        )}
        {tipDone && <div className="alert alert--success">팁 전송 완료!</div>}
      </div>

      {/* 출금 */}
      <div className="card">
        <h2 className="card__title">팁 출금 (Owner 전용)</h2>
        <p className="card__desc">
          <code>withdrawTips()</code> — Owner만 호출 가능
        </p>
        {!isOwner ? (
          <div className="alert alert--info">Owner 계정으로 연결해야 출금할 수 있습니다.</div>
        ) : (
          <>
            <button
              className="btn btn--danger"
              disabled={isWithdrawing || withdrawConfirming || balance === BigInt(0)}
              onClick={() => withdraw({ functionName: 'withdrawTips' })}
            >
              {isWithdrawing ? '승인 대기...' : withdrawConfirming ? '확인 중...' : '전액 출금'}
            </button>
            {withdrawError && (
              <div className="alert alert--error">
                {(withdrawError as { shortMessage?: string }).shortMessage ?? withdrawError.message}
              </div>
            )}
            {withdrawDone && <div className="alert alert--success">출금 완료!</div>}
          </>
        )}
      </div>

      {/* Scaffold 훅 설명 */}
      <div className="card">
        <h2 className="card__title">Scaffold-ETH 2 패턴 요약</h2>
        <div className="scaffold-hint">
          <strong># 1. 배포 → deployedContracts.ts 자동 생성</strong>{'\n'}
          npm run deploy           # localhost{'\n'}
          npm run deploy:sepolia   # Sepolia{'\n\n'}
          <strong># 2. 프론트엔드에서 Scaffold 훅 사용</strong>{'\n'}
          useScaffoldReadContract{'({ contractName: \'TipJar\', functionName: \'getBalance\' })'}{'\n'}
          useScaffoldWriteContract{'(\'TipJar\')'}
          {' → writeContractAsync({ functionName: \'tip\', value: ... })'}
        </div>
      </div>
    </div>
  )
}
