import 'bootstrap/dist/css/bootstrap.css';
import '../styles/globals.css';
import * as React from 'react';
import { AuthProvider } from '../components/AuthContext';
import Marketplace from '../components/Marketplace';
import { SnackProvider } from '../components/SnackContext';

function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SnackProvider>
        <Marketplace Component={Component} pageProps={pageProps} />
      </SnackProvider>
    </AuthProvider>
  );
}

export default App;
