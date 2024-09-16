import logo from '@/assets/enya-logo.svg';
import { snapPackageVersion } from '@/config';
import { MetamaskActions, MetaMaskContext } from '@/context/MetamaskContext.tsx';
import { useContext } from 'react';
import { HeaderButtons } from './ConnectButton.tsx';
import { connectSnap, getSnap } from '@/lib/snap.ts';

const Navbar = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      console.warn("Installed snap", installedSnap)

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  const toHcWallet = () => {
    window.open('https://hc-wallet.sepolia.boba.network/', 'blank');
  };

  return (
    <>
      <nav className="w-full flex md:justify-center justify-between items-center p-4">
        <div className="md:flex-[0.5] flex-initial justify-center items-center">
          <img src={logo} alt="logo" className="w-32 cursor-pointer" />
        </div>
        <div className="flex items-center justify-center space-x-6">
          <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
            Snap Version:{' '}
            <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400 font-semibold">
              {snapPackageVersion}
            </span>
          </span>
          <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
            Installed Snap:{' '}
            <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400 font-semibold">
              {state?.installedSnap?.version}
            </span>
          </span>
          <ul className="text-white md:flex hidden list-none flex-row justify-between items-center flex-initial">
            <HeaderButtons
              state={state}
              onConnectClick={handleClick}
              onSetupWallet={toHcWallet}
            />
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
