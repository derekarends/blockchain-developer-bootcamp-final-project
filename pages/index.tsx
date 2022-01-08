import * as React from 'react';
import Link from 'next/link';
import { Col, Container, Row, Button, Card } from 'react-bootstrap';
import { Asset, AssetState } from '../components/Types';
import Routes from '../utils/Routes';
import { FetchState } from '../components/Types';
import { useAppState } from '../components/AppStateContext';

/**
 * Main display of the market place. Rendering the layout of all the assets for sale
 */
function Index() {
  const { assets, state } = useAppState();

  if (state === FetchState.loading) {
    return <div>Loading...</div>
  }

  // Only show the assets that are currently for sale
  const filteredAssets = assets?.filter((f: Asset) => f?.state === AssetState.ForSale);
  if (filteredAssets.length === 0) {
    return <div>No listings available</div>
  }

  return (
    <Container>
      <Row>
        {filteredAssets.map((asset: Asset) => {
          return (
            <Col key={asset.id} md={3}>
              <Card className='paper' style={{ marginBottom: '16px' }}>
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
