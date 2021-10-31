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
import ListItem from '../components/ListItem';

function Dashboard() {
  const auth = useAuth();
  const snack = useSnack();
  const [getMyAssetsState, setMyAssetsState] = React.useState<FetchState>(FetchState.loading);
  const [getListedAssetsState, setListedAssetsState] = React.useState<FetchState>(FetchState.loading);
  const [getLendingState, setLendingState] = React.useState<FetchState>(FetchState.loading);
  const [getLoanSate, setLoanState] = React.useState<FetchState>(FetchState.loading);
  const [myAssets, setMyAssets] = React.useState<Asset[]>();
  const [listedAssets, setListedAssets] = React.useState<Asset[]>();
  const [myLoans, setLoans] = React.useState<Loan[]>();
  const [myLendings, setLendings] = React.useState<Loan[]>();

  React.useEffect(() => {
    getMyAssets();
    getMyListedAssets();
    getMyLoans();
    getMyLendings();
  }, []);

  async function mapResultToAsset(data: any): Promise<Asset[]> {
    const items: Asset[] = await Promise.all(
      data.map(async (i) => {
        const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
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
          state: i.state,
        };
        return item;
      })
    );

    return items;
  }

  async function mapResultToLoan(data: any): Promise<Loan[]> {
    return await Promise.resolve([]);
  }

  async function getMyAssets() {
    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketplaceContract.abi,
      auth.signer
    ) as Marketplace;
    const data = await marketContract.getMyAssets();
    const items: Asset[] = await mapResultToAsset(data);
    setMyAssets(items);
    setMyAssetsState(FetchState.idle);
  }

  async function getMyListedAssets() {
    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketplaceContract.abi,
      auth.signer
    ) as Marketplace;
    const data = await marketContract.getMyListedAssets();
    const items: Asset[] = await mapResultToAsset(data);
    setListedAssets(items);
    setListedAssetsState(FetchState.idle);
  }

  function getMyLoans() {

  }

  async function getMyLendings() {
    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketplaceContract.abi,
      auth.signer
    ) as Marketplace;
    const data = await marketContract.getMyLendings();
    const items: Loan[] = await mapResultToLoan(data);
    setLendings(items);
    setLendingState(FetchState.idle);
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
              items={myAssets}
              route={Routes.Assets}
              loading={getMyAssetsState === FetchState.loading}
            />
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Selling Assets</Title>
          <ListGroup>
            <ListItem
              items={listedAssets}
              route={Routes.Assets}
              loading={getListedAssetsState === FetchState.loading}
            />
          </ListGroup>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Title>Loans</Title>
          <ListGroup>
            <ListItem
                items={myLoans}
                route={Routes.Loans}
                loading={getListedAssetsState === FetchState.loading}
              />
          </ListGroup>
        </Col>
        <Col md={6}>
          <Title>Lendings</Title>
          <ListGroup>
            <ListItem
                items={myLendings}
                route={Routes.Loans}
                loading={getListedAssetsState === FetchState.loading}
              />
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
