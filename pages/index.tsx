import * as React from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { Col, Container, Row, Button, Card } from 'react-bootstrap';
import { Asset } from '../components/Types';
import Routes from '../utils/Routes';
import { NFT } from '../typechain/NFT';
import { AssetContract } from '../typechain/AssetContract';
import NFTContract from '../artifacts/contracts/NFT.sol/NFT.json';
import AssetContractJson from '../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { NftAddress, AssetContractAddress } from '../utils/EnvVars';
import { FetchState } from '../components/Types';

function Index() {
  const [listings, setListings] = React.useState<Asset[]>([]);
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  
  React.useEffect(() => {
    getListings()
  }, []);

  async function getListings() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, provider) as NFT;
    const assetContract = new ethers.Contract(AssetContractAddress, AssetContractJson.abi, provider) as AssetContract;
    const data = await assetContract.getListings();

    const items: Asset[] = await Promise.all(data.map(async i => {
      console.log(i.tokenId);
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
