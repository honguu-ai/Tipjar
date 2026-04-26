import { useState } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi'
import { parseEther, formatEther, isAddress } from 'viem'
import { TIPJAR_ABI } from '../contract'

const STORAGE_KEY = 'tipjar_deployed_address'

export function InteractContract() {
  const { address: userAddress, isConnected } = useAccount()

  const [contractAddr, setContractAddr] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )
  const [inputAddr, setInputAddr] = useState<string>(contractAddr)
  const [tipAmount, setTipAmount] = useState<string>('0.001')

  const isValidAddr = isAddress(contractAddr)

  const {
    data: balance,
    refetch: refetchBalance,
  } = useReadContract({
    address: isValidAddr ? contractAddr : undefined,
    abi: TIPJAR_ABI,
    functionName: 'getBalance',
    query: { enabled: isValidAddr },
  })

  const { data: owner } = useReadContract({
    address: isValidAddr ? contractAddr : undefined,
    abi: TIPJAR_ABI,
    functionName: 'owner',
    query: { enabled: isValidAddr },
  })

  const {
    writeContract: writeTip,
    data: tipHash,
    isPending: isTipping,
    error: tipError,
    reset: resetTip,
  } = useWriteContract()

  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawing,
    error: withdrawError,
    reset: resetWithdraw,
  } = useWriteContract()

  const { isLoading: tipConfirming, isSuccess: tipSuccess } = useWaitForTransactionReceipt({
    hash: tipHash,
  })

  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash })

  if (tipSuccess || withdrawSuccess) {
    refetchBalance()
  }

  function handleApplyAddr() {
    if (!isAddress(inputAddr)) return
    setContractAddr(inputAddr)
    localStorage.setItem(STORAGE_KEY, inputAddr)
    resetTip()
    resetWithdraw()
  }

  function handleTip() {
    if (!isValidAddr || !tipAmount) return
    writeTip({
      address: contractAddr,
      abi: TIPJAR_ABI,
      functionName: 'tip',
      value: parseEther(tipAmount),
    })
  }

  function handleWithdraw() {
    if (!isValidAddr) return
    writeWithdraw({
      address: contractAddr,
      abi: TIPJAR_ABI,
      functionName: 'withdrawTips',
    })
  }

  const isOwner =
    owner && userAddress && owner.toLowerCase() === userAddress.toLowerCase()

  if (!isConnected) {
    return (
      <div className="card card--muted">
        <p className="card__empty">지갑을 연결하면 컨트랙트와 상호작용할 수 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="deploy-section">
      <div className="card">
        <h2 className="card__title">컨트랙트 주소</h2>
        <div className="addr-input-row">
          <input
            className="input"
            placeholder="0x... 배포된 컨트랙트 주소 입력"
            value={inputAddr}
            onChange={e => setInputAddr(e.target.value)}
          />
          <button
            className="btn btn--primary"
            onClick={handleApplyAddr}
            disabled={!isAddress(inputAddr)}
          >
            적용
          </button>
        </div>
      </div>

      {isValidAddr && (
        <>
          <div className="card">
            <h2 className="card__title">컨트랙트 상태</h2>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-row__label">잔액</span>
                <span className="info-row__value info-row__value--accent">
                  {balance !== undefined ? `${formatEther(balance)} ETH` : '불러오는 중...'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Owner</span>
                <span className="info-row__value info-row__value--mono">
                  {owner
                    ? `${owner.slice(0, 6)}…${owner.slice(-4)}${isOwner ? ' (나)' : ''}`
                    : '불러오는 중...'}
                </span>
              </div>
            </div>
            <button className="btn-link" onClick={() => refetchBalance()}>
              새로고침
            </button>
          </div>

          <div className="card">
            <h2 className="card__title">팁 보내기 (tip)</h2>
            <p className="card__desc">
              ETH를 컨트랙트에 전송합니다. <code>tip()</code> payable 함수 호출.
            </p>
            <div className="addr-input-row">
              <input
                className="input"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.001"
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value)}
              />
              <span className="input-unit">ETH</span>
              <button
                className="btn btn--primary"
                onClick={handleTip}
                disabled={isTipping || tipConfirming}
              >
                {isTipping ? '승인 대기...' : tipConfirming ? '확인 중...' : '팁 보내기'}
              </button>
            </div>
            {tipError && (
              <div className="alert alert--error">
                {(tipError as { shortMessage?: string }).shortMessage ?? tipError.message}
              </div>
            )}
            {tipSuccess && (
              <div className="alert alert--success">
                팁 전송 완료! Tx: {tipHash?.slice(0, 10)}...
              </div>
            )}
          </div>

          <div className={`card ${!isOwner ? 'card--muted' : ''}`}>
            <h2 className="card__title">팁 출금하기 (withdrawTips)</h2>
            <p className="card__desc">
              Owner만 호출 가능. 컨트랙트 잔액 전체를 Owner 지갑으로 인출합니다.
            </p>
            {!isOwner && (
              <div className="alert alert--info">Owner 계정으로 연결해야 출금할 수 있습니다.</div>
            )}
            {isOwner && (
              <>
                <button
                  className="btn btn--danger"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || withdrawConfirming || balance === 0n}
                >
                  {isWithdrawing
                    ? '승인 대기...'
                    : withdrawConfirming
                      ? '확인 중...'
                      : '출금하기'}
                </button>
                {withdrawError && (
                  <div className="alert alert--error">
                    {(withdrawError as { shortMessage?: string }).shortMessage ?? withdrawError.message}
                  </div>
                )}
                {withdrawSuccess && (
                  <div className="alert alert--success">
                    출금 완료! Tx: {withdrawHash?.slice(0, 10)}...
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
