import 'bootstrap/dist/css/bootstrap.css';
import '../styles/globals.css';
import * as React from 'react';
import { AuthProvider } from '../components/AuthContext';
import Marketplace from '../components/Marketplace';
import { SnackProvider } from '../components/SnackContext';
import { AppStateProvider } from '../components/AppStateContext';
import { LoadingProvider } from '../components/Loading';

function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppStateProvider>
        <LoadingProvider>
          <SnackProvider>
            <Marketplace Component={Component} pageProps={pageProps} />
          </SnackProvider>
        </LoadingProvider>
      </AppStateProvider>
    </AuthProvider>
  );
}

export default App;
