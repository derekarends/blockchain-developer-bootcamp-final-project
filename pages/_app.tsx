import 'bootstrap/dist/css/bootstrap.css';
import '../styles/globals.css';
import Link from 'next/link';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import Routes from '../utils/Routes';

function Marketplace({ Component, pageProps }) {
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
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container style={{ padding: '16px' }}>
        <Component {...pageProps} />
      </Container>
    </>
  );
}

export default Marketplace;
