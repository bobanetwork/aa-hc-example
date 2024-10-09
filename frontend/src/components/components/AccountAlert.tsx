import { MetaMaskContext } from '@/context/MetamaskContext.tsx'
import { AlertTriangle, } from 'lucide-react'
import { useContext } from 'react'

const NetworkAlert = () => {

  const [state] = useContext(MetaMaskContext)

  if (!state.selectedAcount) {
    return (
      <div className="flex w-6/12 rounded-md shadow-sm border m-auto my-2 p-5 items-center justify-start gap-2 bg-red-600 margin-auto">
        <AlertTriangle color="#fff" />
        <p className="text-sm text-white">
          Please select snap account or create snap account on link
          <a href="https://hc-wallet.sepolia.boba.network/" className="underline ml-1" target='blank'>HC Wallet</a>
        </p>
      </div>
    )
  }

  return <></>

}

export default NetworkAlert
