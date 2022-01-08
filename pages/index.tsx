import * as React from 'react';
import Link from 'next/link';
import { Col, Container, Row, Button, Card } from 'react-bootstrap';
import { Asset, FetchState } from '../components/Types';
import Routes from '../utils/Routes';
import { getAssetsForSale } from '../services/apiService';

/**
 * Main display of the market place. Rendering the layout of all the assets for sale
 */
function Index() {
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const [assets, setAssets] = React.useState<Asset[]>([]);

  React.useEffect(() => {
    getAssetsForSale().then((res: Asset[]) => {
      setAssets(res);
      setState(FetchState.idle);
    });
  }, []);

  if (state === FetchState.loading) {
    return <div>Loading...</div>
  }

  if (!assets || assets.length === 0) {
    return <div>No listings available</div>
  }

  return (
    <Container>
      <Row>
        {assets.map((asset: Asset) => {
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
