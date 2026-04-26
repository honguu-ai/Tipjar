import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

// Custom task: npm run account:import
// 메타마스크 개인키를 .env에 저장 (SE-2의 yarn account:import 대응)
task('account-import', '개인키를 .env 파일에 저장합니다')
  .addParam('key', '메타마스크 개인키 (0x 포함)')
  .setAction(async ({ key }: { key: string }) => {
    const envPath = path.join(__dirname, '.env')
    const cleaned = key.startsWith('0x') ? key.slice(2) : key
    const line = `DEPLOYER_PRIVATE_KEY=${cleaned}\n`

    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8')
      if (content.includes('DEPLOYER_PRIVATE_KEY=')) {
        content = content.replace(/DEPLOYER_PRIVATE_KEY=.*\n?/, line)
        fs.writeFileSync(envPath, content)
      } else {
        fs.appendFileSync(envPath, line)
      }
    } else {
      fs.writeFileSync(envPath, line)
    }
    console.log('✅ 개인키가 .env에 저장되었습니다.')
  })

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY
  ? `0x${process.env.DEPLOYER_PRIVATE_KEY.replace(/^0x/, '')}`
  : undefined

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.22',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    sepolia: {
      url: process.env.ALCHEMY_API_KEY
        ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : 'https://rpc.sepolia.org',
      accounts: deployerKey ? [deployerKey] : [],
      chainId: 11155111,
    },
  },
  namedAccounts: {
    deployer: { default: 0 },
  },
}

export default config
