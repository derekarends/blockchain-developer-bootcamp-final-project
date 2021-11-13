import * as React from 'react';
import Link from 'next/link';
import { Col, Container, Row, Button, Card } from 'react-bootstrap';
import { Asset } from '../components/Types';
import Routes from '../utils/Routes';
import { FetchState } from '../components/Types';
import { useAppState } from '../components/AppStateContext';

function Index() {
  const { assets, state } = useAppState();

  if (state === FetchState.loading) {
    return <div>Loading...</div>
  }

  if (assets.length === 0) {
    return <div>No listings available</div>
  }

  return (
    <Container>
      <Row>
        {assets.map((asset: Asset) => {
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
