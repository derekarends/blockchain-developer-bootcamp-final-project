import * as React from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { Col, Container, Row, Button, Card } from 'react-bootstrap';
import { Asset } from '../components/Types';
import Routes from '../utils/Routes';
import { NFT } from '../typechain/NFT';
import { Marketplace } from '../typechain/Marketplace';
import NFTContract from '../artifacts/contracts/NFT.sol/NFT.json';
import MarketplaceContract from '../artifacts/contracts/Marketplace.sol/Marketplace.json';
import { NftAddress, MarketAddress } from '../utils/EnvVars';
import { FetchState } from '../components/Enums';

function Index() {
  const [listings, setListings] = React.useState<Asset[]>([]);
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  
  React.useEffect(() => {
    loadListings()
  }, []);

  async function loadListings() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, provider) as NFT;
    const marketContract = new ethers.Contract(MarketAddress, MarketplaceContract.abi, provider) as Marketplace;
    const data = await marketContract.getListings();

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
      };
      return item;
    }));
    setListings(items);
    setState(FetchState.idle);
  }

  if (state === FetchState.loading) {
    return <div>Loading...</div>
  }

  if (listings.length === 0) {
    return <div>No listings available</div>
  }

  return (
    <Container>
      <Row>
        {listings.map((asset: Asset) => {
          return (
            <Col key={asset.id}>
              <Card style={{ width: '18rem', marginBottom: '10px' }}>
                <Card.Img variant="top" src={asset.image} />
                <Card.Body>
                  <Card.Title>{asset.name}</Card.Title>
                  <Card.Text>{asset.description}</Card.Text>
                  <Card.Text>Price: {asset.price} ETH</Card.Text>
                  <Link href={`${Routes.Assets}/${asset.id}`}>
                    <Button variant="primary">Details</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}

export default Index;
