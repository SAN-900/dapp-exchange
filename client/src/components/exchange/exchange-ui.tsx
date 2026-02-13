import { PublicKey } from "@solana/web3.js"
import { useMemo } from "react"
import { useParams } from "react-router"
import { AppHero } from "../app-hero"
import ExchangeFrame from "./exchange-frame"


export default function Exchange(){
    const params = useParams() as { address: string }
    const address = useMemo(() => {
    if (!params.address) {
      return
    }
      try {
      return new PublicKey(params.address)
    } catch (e) {
      console.log(`Invalid public key`, e)
    }
  }, [params])
  if (!address) {
    return <div>Error loading account</div>
  }

    return (
        <div>
            <AppHero> 
                <ExchangeFrame />
            </AppHero>
        </div>
    )

}