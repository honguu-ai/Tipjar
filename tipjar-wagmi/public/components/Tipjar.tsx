"use client";

import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import {
  useConnect,
  useConnection,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { contract } from "@/contract";

function shortAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function CounterDapp() {
  const connection = useConnection();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const { connect, connectors, isPending: isConnecting, error: connectError } =
    useConnect();

  const injectedConnector = useMemo(
    () => connectors.find((c) => c.type === "injected") ?? connectors[0],
    [connectors],
  );

  const {
    data: counter,
    isLoading: isCounterLoading,
    error: counterError,
    refetch: refetchCounter,
  } = useReadContract({
    ...contract,
    functionName: "getCounter",
    query: {
      enabled: true,
    },
  });

  const { data: owner } = useReadContract({
    ...contract,
    functionName: "owner",
    query: { enabled: true },
  });

  const {
    data: txHash,
    writeContractAsync,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const isOnSepolia = connection.chainId === sepolia.id;
  const canWrite = connection.isConnected && isOnSepolia && !isWriting;

  async function runWrite(functionName: "incrementCounter" | "decrementCounter" | "resetCounter") {
    setActionError(null);
    try {
      await writeContractAsync({
        ...contract,
        functionName,
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  // 트랜잭션 확정되면 값 새로고침
  if (isConfirmed) {
    // react 렌더 중 refetch 루프를 피하려고, hash가 있을 때만 1회성으로 처리
    // (wagmi/query 캐시 덕에 과도한 네트워크 요청은 발생하지 않습니다)
    void refetchCounter();
  }

  const counterText =
    typeof counter === "bigint" ? formatUnits(counter, 0) : "—";

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Sepolia Counter</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              컨트랙트: <span className="font-mono">{shortAddress(contract.address)}</span>
            </p>
            {typeof owner === "string" && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Owner: <span className="font-mono">{shortAddress(owner)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {connection.isConnected ? (
              <>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  연결됨:{" "}
                  <span className="font-mono text-zinc-950 dark:text-zinc-50">
                    {shortAddress(connection.address)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!isOnSepolia && (
                    <button
                      className="h-10 rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                      onClick={() => switchChain({ chainId: sepolia.id })}
                      disabled={isSwitching}
                    >
                      Sepolia로 전환
                    </button>
                  )}
                  <button
                    className="h-10 rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    onClick={() => disconnect()}
                  >
                    연결 해제
                  </button>
                </div>
              </>
            ) : (
              <button
                className="h-10 rounded-full bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                onClick={() => injectedConnector && connect({ connector: injectedConnector })}
                disabled={!injectedConnector || isConnecting}
              >
                지갑 연결(Injected)
              </button>
            )}
            {connectError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {connectError.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="py-6 text-center font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
                  {isCounterLoading ? "로딩…" : counterText}
                </div>
              </div>
            </div>
            {counterError && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                {counterError.message}
              </p>
            )}
            {!connection.isConnected && (
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                읽기는 지갑 없이도 가능하지만, 쓰기(증가/감소/리셋)는 지갑 연결이 필요해요.
              </p>
            )}
            {connection.isConnected && !isOnSepolia && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                현재 네트워크가 Sepolia가 아닙니다. Sepolia로 전환 후 트랜잭션을 실행하세요.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                컨트롤
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {canWrite ? "트랜잭션 실행 가능" : "지갑 연결/네트워크 확인"}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                className="h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                onClick={() => runWrite("incrementCounter")}
                disabled={!canWrite}
              >
                +1 증가
              </button>
              <button
                className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900/70"
                onClick={() => runWrite("resetCounter")}
                disabled={!canWrite}
              >
                리셋
              </button>
              <button
                className="h-11 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 dark:bg-rose-500 dark:hover:bg-rose-400"
                onClick={() => runWrite("decrementCounter")}
                disabled={!canWrite}
              >
                -1 감소
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {(isWriting || isConfirming) && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="font-medium">
                  {isWriting ? "지갑에서 서명 요청 중…" : "트랜잭션 확정 대기 중…"}
                </div>
                {txHash && (
                  <div className="mt-1 break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {txHash}
                  </div>
                )}
              </div>
            )}

            {(writeError || receiptError || actionError) && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <div className="font-medium">오류</div>
                <div className="mt-1 text-xs">
                  {actionError ??
                    writeError?.message ??
                    receiptError?.message ??
                    "알 수 없는 오류"}
                </div>
              </div>
            )}

            {isConfirmed && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
                <div className="font-medium">성공적으로 반영됐어요.</div>
                {txHash && (
                  <div className="mt-1 break-all font-mono text-xs opacity-80">
                    {txHash}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
