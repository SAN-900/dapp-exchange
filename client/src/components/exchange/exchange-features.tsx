import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { useNavigate } from 'react-router'

export default function ExchangeIndexFeature() {
  const navigate = useNavigate()
  const { publicKey } = useWallet()

  if (publicKey) {
    navigate(`/swap/${publicKey.toString()}`)
  }

  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <WalletButton />
      </div>
    </div>
  )
}
