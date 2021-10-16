import 'bootstrap/dist/css/bootstrap.css';
import '../styles/globals.css';
import * as React from 'react';
import { AuthProvider } from '../components/AuthContext';
import Marketplace from '../components/Marketplace';

function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Marketplace Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}

export default App;
