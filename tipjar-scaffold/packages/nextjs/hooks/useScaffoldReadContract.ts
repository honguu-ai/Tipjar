'use client'
import { useReadContract, useChainId } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'
import { deployedContracts } from '../contracts/deployedContracts'

type AllContracts = typeof deployedContracts
type NetworkName = keyof AllContracts extends never ? string : keyof AllContracts

// chainId → deployedContracts의 네트워크 키 변환
function toNetworkName(chainId: number): string {
  if (chainId === hardhat.id) return 'localhost'
  if (chainId === sepolia.id) return 'sepolia'
  return 'localhost'
}

export function useScaffoldReadContract({
  contractName,
  functionName,
  args,
  watch,
}: {
  contractName: string
  functionName: string
  args?: unknown[]
  watch?: boolean
}) {
  const chainId = useChainId()
  const networkName = toNetworkName(chainId) as NetworkName

  // deployedContracts에서 현재 네트워크의 컨트랙트 정보를 가져옴
  const allOnNetwork = (deployedContracts as unknown as Record<string, Record<string, { address: string; abi: unknown[] }>>)[networkName]
  const contract = allOnNetwork?.[contractName]

  return useReadContract({
    address: contract?.address as `0x${string}` | undefined,
    abi: contract?.abi as never[],
    functionName,
    args: args as never[],
    query: {
      enabled: !!contract,
      // watch=true이면 5초마다 자동 갱신
      refetchInterval: watch ? 5_000 : undefined,
    },
  })
}
