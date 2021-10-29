import * as React from 'react';
import Link from 'next/link';
import { ethers, BigNumber } from 'ethers';
import { Col, Container, Row, Button, ListGroup } from 'react-bootstrap';
import { Loan, Asset, EthError } from '../components/Types';
import Title from '../components/Title';
import Routes from '../utils/Routes';
import { NFT } from '../typechain/NFT';
import { Marketplace } from '../typechain/Marketplace';
import NFTContract from '../artifacts/contracts/NFT.sol/NFT.json';
import MarketplaceContract from '../artifacts/contracts/Marketplace.sol/Marketplace.json';
import { NftAddress, MarketAddress } from '../utils/EnvVars';
import { FetchState } from '../components/Types';
import { useAuth } from '../components/AuthContext';
import { Status, useSnack } from '../components/SnackContext';

function Dashboard() {
  const auth = useAuth();
  const snack = useSnack();
  const [getMyAssetsState, setMyAssetsState] = React.useState<FetchState>(FetchState.loading);
  const [getListedAssetsState, setListedAssetsState] = React.useState<FetchState>(FetchState.loading);
  const [myAssets, setMyAssets] = React.useState<Asset[]>();
  const [listedAssets, setListedAssets] = React.useState<Asset[]>();

  React.useEffect(() => {
    getMyAssets();
    getMyListedAssets();
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
    setMyAssets(items);
    setMyAssetsState(FetchState.idle);
  }

  async function getMyListedAssets() {
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    const marketContract = new ethers.Contract(MarketAddress, MarketplaceContract.abi, auth.signer) as Marketplace;
    const data = await marketContract.getMyListedAssets();

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
    setListedAssets(items);
    setListedAssetsState(FetchState.idle);
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

  function mapAssets(assets: Asset[]) {
    if (!assets || assets.length === 0) {
      return <div>No assets to display.</div>
    }

    return assets.map((asset: Asset) => {
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
            {getMyAssetsState === FetchState.loading ? <div>Loading...</div> : mapAssets(myAssets)}
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Selling Assets</Title>
          <ListGroup>
            {getListedAssetsState === FetchState.loading ? <div>Loading...</div> : mapAssets(listedAssets)}
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
