import * as React from 'react';
import Link from 'next/link';
import { ListGroup, Button } from 'react-bootstrap';
import Routes from '../utils/Routes';
import { BaseType } from './Types';

type Props = {
  items: BaseType[],
  route: string,
  loading: boolean
}

function ListItem({ items, route, loading }: Props) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!items || items.length === 0) {
    return <div>No items to display.</div>;
  }

  const listGroupItems = items.map((item: BaseType) => {
    return (
      <ListGroup.Item
        key={item.id}
        className="d-flex justify-content-between align-items-start"
      >
        <div className="ms-2 me-auto">
          <div className="fw-bold">{item.name}</div>
          {item.description}
        </div>
        <Link href={`${route}/${item.id}`}>
          <Button>Details</Button>
        </Link>
      </ListGroup.Item>
    );
  });

  return <div>{listGroupItems}</div>;
}

export default ListItem;