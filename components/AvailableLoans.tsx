import * as React from 'react';
import Link from 'next/link';
import { Button, ListGroup } from 'react-bootstrap';
import { Loan } from './Types';
import Title from './Title';
import Routes from '../utils/Routes';

type Props = {
  availableLoans: Loan[];
};

/**
 * Create the AvailableLoans component
 * @param Props
 * @returns component
 */
function AvailableLoans({ availableLoans }: Props) {
  return (
    <div>
      <Title>Available Loans</Title>
      <ListGroup>
        {!availableLoans || availableLoans.length === 0 ? (
          <div>No loans available</div>
        ) : (
          availableLoans.map((m: Loan) => {
            return (
              <ListGroup.Item
                key={m.id}
                className="d-flex justify-content-between align-items-start"
              >
                <div className="ms-2 me-auto">
                  <div className="fw-bold">{m.name}</div>
                  {m.description}
                </div>
                <Link href={`${Routes.Loans}/${m.id}`}>
                  <Button>Apply</Button>
                </Link>
              </ListGroup.Item>
            );
          })
        )}
      </ListGroup>
    </div>
  );
}

export default AvailableLoans;
