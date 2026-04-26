import { useState } from 'react'
import { useDeployContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi'
import { sepolia, hardhat } from 'wagmi/chains'
import { TIPJAR_ABI, TIPJAR_BYTECODE } from '../contract'

const STORAGE_KEY = 'tipjar_deployed_address'

interface DeployContractProps {
  onDeployed: (address: string) => void
}

export function DeployContract({ onDeployed }: DeployContractProps) {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()

  const [savedAddress, setSavedAddress] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )

  const { deployContract, data: txHash, isPending, error } = useDeployContract()

  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const contractAddress = receipt?.contractAddress ?? null

  function handleDeploy() {
    deployContract({
      abi: TIPJAR_ABI,
      bytecode: TIPJAR_BYTECODE,
    })
  }

  function handleSave() {
    if (!contractAddress) return
    localStorage.setItem(STORAGE_KEY, contractAddress)
    setSavedAddress(contractAddress)
    onDeployed(contractAddress)
  }

  function handleClearSaved() {
    localStorage.removeItem(STORAGE_KEY)
    setSavedAddress('')
    onDeployed('')
  }

  const networkName =
    chainId === sepolia.id ? 'Sepolia' : chainId === hardhat.id ? 'Hardhat Local' : '알 수 없음'

  if (!isConnected) {
    return (
      <div className="card card--muted">
        <p className="card__empty">지갑을 연결하면 컨트랙트를 배포할 수 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="deploy-section">
      <div className="card">
        <h2 className="card__title">컨트랙트 배포</h2>
        <div className="info-grid">
          <InfoRow label="컨트랙트" value="TipJar.sol" />
          <InfoRow label="네트워크" value={networkName} />
          <InfoRow
            label="배포 계정"
            value={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '-'}
          />
        </div>

        <button
          className="btn btn--primary"
          onClick={handleDeploy}
          disabled={isPending || isConfirming}
        >
          {isPending
            ? '지갑 승인 대기 중...'
            : isConfirming
              ? '블록 확인 중...'
              : '배포하기'}
        </button>

        {error && (
          <div className="alert alert--error">
            <strong>오류:</strong> {(error as { shortMessage?: string }).shortMessage ?? error.message}
          </div>
        )}
      </div>

      {txHash && (
        <div className="card">
          <h2 className="card__title">트랜잭션</h2>
          <InfoRow
            label="Tx Hash"
            value={txHash}
            mono
            external={
              chainId === sepolia.id
                ? `https://sepolia.etherscan.io/tx/${txHash}`
                : undefined
            }
          />

          {isConfirming && (
            <div className="alert alert--info">블록체인에서 컨트랙트 생성을 확인하는 중...</div>
          )}

          {contractAddress && (
            <>
              <div className="divider" />
              <h2 className="card__title">배포 완료</h2>
              <InfoRow
                label="컨트랙트 주소"
                value={contractAddress}
                mono
                external={
                  chainId === sepolia.id
                    ? `https://sepolia.etherscan.io/address/${contractAddress}`
                    : undefined
                }
              />

              <div className="abi-box">
                <label className="abi-box__label">ABI (복사하여 외부 앱에 사용)</label>
                <textarea
                  className="abi-box__text"
                  readOnly
                  rows={6}
                  value={JSON.stringify(TIPJAR_ABI, null, 2)}
                />
              </div>

              <button className="btn btn--success" onClick={handleSave}>
                주소 저장 → Interact 탭에서 사용
              </button>
            </>
          )}
        </div>
      )}

      {savedAddress && (
        <div className="card card--saved">
          <div className="card__row">
            <span className="card__label">저장된 컨트랙트</span>
            <button className="btn-link" onClick={handleClearSaved}>
              초기화
            </button>
          </div>
          <code className="addr-display">{savedAddress}</code>
        </div>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
  external,
}: {
  label: string
  value: string
  mono?: boolean
  external?: string
}) {
  return (
    <div className="info-row">
      <span className="info-row__label">{label}</span>
      {external ? (
        <a
          className={`info-row__value info-row__value--link ${mono ? 'info-row__value--mono' : ''}`}
          href={external}
          target="_blank"
          rel="noopener noreferrer"
        >
          {value.length > 42 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value}
        </a>
      ) : (
        <span className={`info-row__value ${mono ? 'info-row__value--mono' : ''}`}>
          {value.length > 42 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value}
        </span>
      )}
    </div>
  )
}
