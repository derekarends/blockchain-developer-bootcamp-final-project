import * as React from 'react';
import Link from 'next/link';
import { Container, Nav, Navbar } from 'react-bootstrap';
import Routes from '../utils/Routes';
import { Status, useAuth } from '../components/AuthContext';
import Snack from './Snack';
import { Loading } from './Loading';

function Marketplace({ Component, pageProps }) {
  const auth = useAuth();

  function connectionStatus() {
    switch (auth.status) {
      case Status.connecting:
        return <Nav.Item className="nav-link">Connecting...</Nav.Item>;
      case Status.connected:
        return <Nav.Item className="nav-link">Connected</Nav.Item>;
      default:
        return (
          <Nav.Item onClick={() => auth.connect()} className="nav-link">
            Connect
          </Nav.Item>
        );
    }
  }

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand>Dapp Market</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Item>
                <Link href={Routes.Marketplace}>
                  <a className="nav-link">Marketplace</a>
                </Link>
              </Nav.Item>
              <Nav.Item>
                <Link href={Routes.Dashboard}>
                  <a className="nav-link">Dashboard</a>
                </Link>
              </Nav.Item>
              {connectionStatus()}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Loading />
      <Container style={{ padding: '16px' }}>
        <Snack />
        <Component {...pageProps} />
      </Container>
    </>
  );
}

export default Marketplace;
