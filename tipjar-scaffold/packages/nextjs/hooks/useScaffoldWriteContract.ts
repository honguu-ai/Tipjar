'use client'
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'
import { deployedContracts } from '../contracts/deployedContracts'

type ContractMap = Record<string, Record<string, { address: string; abi: unknown[] }>>

function toNetworkName(chainId: number): string {
  if (chainId === hardhat.id) return 'localhost'
  if (chainId === sepolia.id) return 'sepolia'
  return 'localhost'
}

export function useScaffoldWriteContract(contractName: string) {
  const chainId = useChainId()
  const networkName = toNetworkName(chainId)
  const contract = (deployedContracts as unknown as ContractMap)[networkName]?.[contractName]

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function writeContractAsync({
    functionName,
    args,
    value,
  }: {
    functionName: string
    args?: unknown[]
    value?: bigint
  }) {
    if (!contract) {
      console.error(`[scaffold] '${contractName}' not found on '${networkName}'. Run 'npm run deploy' first.`)
      return
    }
    writeContract({
      address: contract.address as `0x${string}`,
      abi: contract.abi as never[],
      functionName,
      args: args as never[],
      value,
    })
  }

  return { writeContractAsync, hash, isPending, isConfirming, isSuccess, receipt, error, reset }
}
