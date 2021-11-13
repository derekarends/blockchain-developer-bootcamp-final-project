import * as React from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { Col, Container, Row, Button, ListGroup } from 'react-bootstrap';
import { Loan, Asset, BaseType } from '../components/Types';
import Title from '../components/Title';
import Routes from '../utils/Routes';
import { AssetContract } from '../typechain/AssetContract';
import AssetContractJson from '../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { LoanContract } from '../typechain/LoanContract';
import LoanContractJson from '../artifacts/contracts/LoanContract.sol/LoanContract.json';
import { AssetContractAddress, LoanContractAddress } from '../utils/EnvVars';
import { FetchState } from '../components/Types';
import { useAuth } from '../components/AuthContext';
import { Status, useSnack } from '../components/SnackContext';
import ListItem from '../components/ListItem';
import { useAppState } from '../components/AppStateContext';

function Dashboard() {
  const auth = useAuth();
  const snack = useSnack();
  const [myAddress, setAddress] = React.useState('');
  const { assets, loans, state } = useAppState();

  React.useEffect(() => {
    if (!auth.signer) {
      return;
    }

    auth.signer.getAddress().then((addr: string) => {
      setAddress(addr);
    });
  }, [auth.signer]);
  
  const assetContract = new ethers.Contract(
    AssetContractAddress,
    AssetContractJson.abi,
    auth.signer
  ) as AssetContract;

  const loanContract = new ethers.Contract(
    LoanContractAddress,
    LoanContractJson.abi,
    auth.signer
  ) as LoanContract;


  function getMyAssets(): Asset[] {
    return assets.filter(f => f.owner == myAddress);
  }

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

  async function cancelAssetSale(id: number) {
    try {
      await assetContract.cancelListingAsset(id);
      snack.display(Status.success, 'Listing cancelled');
    } catch (e: unknown) {
      snack.display(Status.error, 'Error while trying to cancel listing');
    }
  }

  async function cancelLending(id: number) {
    try {
      await loanContract.cancelLoan(id);
      snack.display(Status.success, 'Lending cancelled');
    } catch (e: unknown) {
      snack.display(Status.error, 'Error while trying to cancel lending');
    }
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
              items={getMyAssets()}
              route={Routes.Assets}
              loading={state === FetchState.loading}
            />
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Selling Assets</Title>
          <ListGroup>
            <ListItem
              items={getMyListedAssets()}
              route={Routes.Assets}
              onCancel={(id) => { cancelAssetSale(id) }}
              loading={state === FetchState.loading}
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
                loading={state === FetchState.loading}
              />
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Lendings</Title>
          <ListGroup>
            <ListItem
                items={getMyLendings()}
                route={Routes.Loans}
                onCancel={(id) => { cancelLending(id) }}
                loading={state === FetchState.loading}
              />
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
