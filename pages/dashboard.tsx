import * as React from 'react';
import Link from 'next/link';
import { Col, Container, Row, Button, Card, Image, ListGroup } from 'react-bootstrap';
import { Loan, Asset } from '../components/Types';
import Title from '../components/Title';
import Routes from '../utils/Routes';

function Dashboard() {
  const asset: Asset = { id: 1, name: 'Title', description: 'Desc', image: '', price: '', seller: '' };
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
            <Button variant="outline-primary">
              Create Loan
            </Button>
          </Link>
        </div>
      </Row>
      <Row className="mb-24">
        <Col md={6}>
          <Title>Owned Assets</Title>
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
