import * as React from 'react';
import Link from 'next/link';
import { Col, Container, Row, Button, Card } from 'react-bootstrap';
import { NFT } from '../components/Types';
import Routes from '../utils/Routes';

function Index() {
  const items: NFT[] = [
    {
      id: 1,
      title: 'NFT 1',
      description: 'Desc 1',
      img: 'holder.js/100px180',
    },
    {
      id: 2,
      title: 'NFT 2',
      description: 'Desc 2',
      img: 'holder.js/100px180',
    },
    {
      id: 3,
      title: 'NFT 3',
      description: 'Desc 3',
      img: 'holder.js/100px180',
    },
  ];

  return (
    <Container fluid>
      <Row>
        {items.map((nft: NFT) => {
          return (
            <Col key={nft.id}>
              <Card style={{ width: '18rem', marginBottom: '10px' }}>
                <Card.Img variant="top" src={nft.img} />
                <Card.Body>
                  <Card.Title>{nft.title}</Card.Title>
                  <Card.Text>{nft.description}</Card.Text>
                  <Link href={`${Routes.Assets}/${nft.id}`}>
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
