import * as React from 'react';
import Link from 'next/link';
import { Alert, Container, Nav, Navbar } from 'react-bootstrap';
import Routes from '../utils/Routes';
import { Status, useAuth } from '../components/AuthContext';
import Snack from './Snack';
import { Loading } from './Loading';

/**
 * Create the Marketplace component
 * @param param component and props
 * @returns component
 */
function Marketplace({ Component, pageProps }) {
  const auth = useAuth();
  const [addr, setAddr] = React.useState('');

  /**
   * Get the address of the connected wallet
   */
  React.useEffect(() => {
    auth.signer?.getAddress().then((res: string) => {
      setAddr(`${res.slice(0, 8)}...`);
    });
  }, [auth.signer]);

  /**
   * Check the connection status and return a navItem
   * @returns element
   */
  function connectionStatus(): JSX.Element {
    switch (auth.status) {
      case Status.connecting:
        return <Nav.Item className="nav-link">Connecting...</Nav.Item>;
      case Status.connected:
        return <Nav.Item className="nav-link">{addr}</Nav.Item>;
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
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>
            <Link href={'/'}>
              <a className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Eth-Bay
              </a>
            </Link>
          </Navbar.Brand>
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
        {auth.status === Status.error ?
          <Alert variant="primary">{auth.message}</Alert> : null}
        <Snack />
        <Component {...pageProps} />
      </Container>
    </>
  );
}

export default Marketplace;
