import * as React from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

export enum Status {
  disconnected,
  connecting,
  connected,
}

type AuthType = {
  signer: ethers.providers.JsonRpcSigner;
  status: Status;
  connect: () => {};
  disconnect: () => {};
};

type State = {
  signer?: ethers.providers.JsonRpcSigner;
  status: Status;
  message?: string;
};

const isMetaMaskConnected = async () => {
  const { ethereum } = window;
  if (ethereum) {
    var provider = new ethers.providers.Web3Provider(ethereum);
  }

  if (!provider) {
    return false;
  }
  
  const accounts = await provider.listAccounts();
  return accounts.length > 0;
};


/**
 * Create an Auth context to be used throughout the application
 */
const AuthContext = React.createContext<AuthType | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

function AuthProvider(props: any) {
  const [state, setState] = React.useState<State>();

  React.useEffect(() => {
    isMetaMaskConnected().then((result: boolean) => {
      const { ethereum } = window;
      if (result && ethereum) {
        var provider = new ethers.providers.Web3Provider(ethereum);
        setState({ signer: provider.getSigner(), status: Status.connected });
      }
    })
  }, []);

  const connect = React.useCallback(() => {
    const web3Modal = new Web3Modal();
    setState({ signer: undefined, status: Status.connecting });
    web3Modal.connect().then((connection) => {
      const provider = new ethers.providers.Web3Provider(connection);
      setState({ signer: provider.getSigner(), status: Status.connected });
    });
  }, []);

  const disconnect = React.useCallback(() => {
    setState({ signer: undefined, status: Status.disconnected });
  }, []);

  const value = React.useMemo(
    () => ({
      connect,
      disconnect,
      signer: state?.signer,
      status: state?.status
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
