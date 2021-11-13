import * as React from 'react';
import { Alert } from 'react-bootstrap';
import { Status, useSnack } from './SnackContext';

function Snack() {
  const snack = useSnack();

  React.useEffect(() => {
    setTimeout(() => {
      snack.close();
    }, 10000);
  }, []);

  const variant =
    snack.status === Status.error ? 'danger'
      : snack.status === Status.success ? 'success'
      : 'primary';

  if (!snack.show) {
    return <></>;
  }

  return <Alert variant={variant}>{snack.message}</Alert>;
}

export default Snack;
