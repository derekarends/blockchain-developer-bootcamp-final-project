import * as React from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { Col, Container, Row, Button, ListGroup } from 'react-bootstrap';
import { Loan, Asset } from '../components/Types';
import Title from '../components/Title';
import Routes from '../utils/Routes';
import { NFT } from '../typechain/NFT';
import { Marketplace } from '../typechain/Marketplace';
import NFTContract from '../artifacts/contracts/NFT.sol/NFT.json';
import MarketplaceContract from '../artifacts/contracts/Marketplace.sol/Marketplace.json';
import { NftAddress, MarketAddress } from '../utils/EnvVars';
import { FetchState } from '../components/Types';
import { useAuth } from '../components/AuthContext';

function Dashboard() {
  const auth = useAuth();
  const [getAssetsState, setAssetsState] = React.useState<FetchState>(FetchState.loading);
  const [assets, setAssets] = React.useState<Asset[]>();

  React.useEffect(() => {
    getMyAssets()
  }, []);

  async function getMyAssets() {
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    const marketContract = new ethers.Contract(MarketAddress, MarketplaceContract.abi, auth.signer) as Marketplace;
    const data = await marketContract.getMyAssets();

    const items: Asset[] = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      const meta = JSON.parse(tokenUri);
      const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      const item: Asset = {
        id: i.tokenId.toNumber(),
        name: meta.name,
        description: meta.description,
        price,
        seller: i.seller,
        image: meta.image,
        state: i.state
      };
      return item;
    }));
    setAssets(items);
    setAssetsState(FetchState.idle);
  }

  const loans: Loan[] = [
    {
      id: 1,
      name: 'Loan 1',
      description: 'Desc of loan 1',
    },
    {
      id: 2,
      name: 'Loan 2',
      description: 'Desc of loan 2',
    },
  ];

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
            {getAssetsState === FetchState.loading ? (
              <div>Loading...</div>
            ) : (
              assets.map((asset: Asset) => {
                return (
                  <ListGroup.Item
                    key={asset.id}
                    className="d-flex justify-content-between align-items-start"
                  >
                    <div className="ms-2 me-auto">
                      <div className="fw-bold">{asset.name}</div>
                      {asset.description}
                    </div>
                    <Link href={`${Routes.Assets}/${asset.id}`}>
                      <Button>Details</Button>
                    </Link>
                  </ListGroup.Item>
                );
              })
            )}
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Selling Assets</Title>
          <ListGroup>
            {loans.map((loan: Loan) => {
              return (
                <ListGroup.Item
                  key={loan.id}
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{loan.name}</div>
                    {loan.description}
                  </div>
                  <Link href={`${Routes.Loans}/${loan.id}`}>
                    <Button>View</Button>
                  </Link>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Title>Loans</Title>
          <ListGroup>
            {loans.map((loan: Loan) => {
              return (
                <ListGroup.Item
                  key={loan.id}
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{loan.name}</div>
                    {loan.description}
                  </div>
                  <Link href={`${Routes.Loans}/${loan.id}`}>
                    <Button>Details</Button>
                  </Link>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Lendings</Title>
          <ListGroup>
            {loans.map((loan: Loan) => {
              return (
                <ListGroup.Item
                  key={loan.id}
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{loan.name}</div>
                    {loan.description}
                  </div>
                  <Link href={`${Routes.Loans}/${loan.id}`}>
                    <Button>View</Button>
                  </Link>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
