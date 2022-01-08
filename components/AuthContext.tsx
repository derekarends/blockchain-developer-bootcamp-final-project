import * as React from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { ChainId, NetworkName } from '../utils/EnvVars';
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers';

export enum Status {
  error,
  disconnected,
  connecting,
  connected,
}

type AuthType = {
  signer: JsonRpcSigner;
  status: Status;
  message?: string;
  connect: () => {};
  disconnect: () => {};
};

type State = {
  signer?: JsonRpcSigner;
  status: Status;
  message?: string;
};

async function isMetaMaskConnected(): Promise<[boolean, string, Web3Provider]> {
  const { ethereum } = window;
  if (!ethereum) {
    return [false, "No Ethereum Client Found", null];
  }

  const provider = new Web3Provider(ethereum);
  const network = await provider.getNetwork()
  if (network.chainId !== ChainId) {
    return [false, `Please connect to ${NetworkName}`, provider];
  }

  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner(0);
  if (signer === undefined) {
    return [false, "No accounts connected", provider]; 
  }

  return [true, '', provider];
};



/**
 * Create an Auth context to be used throughout the application
 */
const AuthContext = React.createContext<AuthType | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

function AuthProvider(props: any) {
  const [state, setState] = React.useState<State>();

  const checkConnectivity = React.useCallback(() => {
    isMetaMaskConnected().then((metaMaskResult: [boolean, string, Web3Provider]) => {
      if (!metaMaskResult) {
        return;
      }
      
      const [metaConnected, metaMessage, provider] = metaMaskResult;
      // if we are connected update state accordingly
      if (metaConnected) {
        setState({ signer: provider.getSigner(), status: Status.connected, message: metaMessage });
      } else {
        setState({ signer: null, status: Status.error, message: metaMessage });
      }
    });
  }, []);

  const listenForEvents = () => {
    const { ethereum } = window;
    if (!ethereum) {
      return;
    }
    ethereum.on("accountsChanged", (accounts: any) => {
      checkConnectivity();
    });

    ethereum.on("chainChanged", (chainId: any) => {
      checkConnectivity();
    });

    ethereum.on('disconnect', (error: any) => {
      disconnect();
    });
  }

  React.useEffect(() => {
    checkConnectivity();
    listenForEvents();
  }, []);

  const connect = React.useCallback(() => {
    const web3Modal = new Web3Modal();
    setState({ signer: null, status: Status.connecting });
    web3Modal.connect().then((connection) => {
      const provider = new ethers.providers.Web3Provider(connection);
      setState({ signer: provider.getSigner(), status: Status.connected });
    });
  }, []);

  const disconnect = React.useCallback(() => {
    setState({ signer: null, status: Status.disconnected });
  }, []);

  const value = React.useMemo(
    () => ({
      connect,
      disconnect,
      signer: state?.signer,
      status: state?.status,
      message: state?.message
    }),
    [connect, disconnect, state]
  );

  return <AuthContext.Provider value={value} {...props} />;
}

/**
 * Used for getting the auth context
 */
function useAuth(): AuthType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error(`useAuth must be used within a AuthProvider`);
  }
  return context;
}

export { AuthProvider, useAuth };
