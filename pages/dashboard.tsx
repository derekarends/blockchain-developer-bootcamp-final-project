import * as React from 'react';
import Link from 'next/link';
import { Col, Container, Row, Button, ListGroup } from 'react-bootstrap';
import { Loan, Asset, BaseType } from '../components/Types';
import Title from '../components/Title';
import Routes from '../utils/Routes';
import { useAuth } from '../components/AuthContext';
import { useSnack } from '../components/SnackContext';
import ListItem from '../components/ListItem';
import { useLoading } from '../components/Loading';
import { getOwnerLoans, getOwnerAssets } from '../services/apiService';

/**
 * Create the Dashboard component
 * @returns component
 */
function Dashboard() {
  const auth = useAuth();
  const snack = useSnack();
  const loading = useLoading();
  const [myAddress, setAddress] = React.useState('');
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);

  React.useEffect(() => {
    auth.signer?.getAddress().then((addr: string) => {
      setAddress(addr);
    });
  }, [auth.signer]);

  React.useEffect(() => {
    if (!auth.signer) {
      return;
    }

    getOwnerAssets(auth.signer).then((ownerAssets: Asset[]) => {
      setAssets(ownerAssets);
      getOwnerLoans(auth.signer, ownerAssets).then((assetLoans: Loan[]) => {
        setLoans(assetLoans);
      });
    });
  }, [auth.signer]);

  // Gets the assets the current user is selling
  function getMyListedAssets(): BaseType[] {
    return assets
      .filter((f: Asset) => f.seller === myAddress)
      .map((m: Asset) => {
        return {
          id: m.id,
          name: m.name,
          description: m.description,
        };
      });
  }

  // Get the loans the current user is borrowing
  function getMyLoans(): BaseType[] {
    return loans
      .filter((f: Loan) => f.borrower === myAddress)
      .map((m: Loan) => {
        return {
          id: m.id,
          name: m.name,
          description: m.description,
        };
      });
  }

  // Get the the loans the current user is issuing
  function getMyLendings(): BaseType[] {
    return loans
      .filter((f: Loan) => f.lender === myAddress)
      .map((m: Loan) => {
        return {
          id: m.id,
          name: m.name,
          description: m.description,
        };
      });
  }

  return (
    <Container>
      <Row className="mb-16">
        <div className="d-flex justify-content-end">
          <Link href={Routes.CreateAsset}>
            <Button variant="outline-primary" className="mr-16">
              Create Listing
            </Button>
          </Link>
          <Link href={Routes.CreateLoan}>
            <Button variant="outline-primary">Create Loan</Button>
          </Link>
        </div>
      </Row>
      <Row className="mb-24">
        <Col md={6}>
          <Title>Owned Assets</Title>
          <ListGroup>
            <ListItem
              items={assets}
              route={Routes.Assets}
            />
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Selling Assets</Title>
          <ListGroup>
            <ListItem
              items={getMyListedAssets()}
              route={Routes.Assets}
            />
          </ListGroup>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Title>Loans</Title>
          <ListGroup>
            <ListItem
              items={getMyLoans()}
              route={Routes.Loans}
            />
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Lendings</Title>
          <ListGroup>
            <ListItem
              items={getMyLendings()}
              route={Routes.Loans}
            />
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
