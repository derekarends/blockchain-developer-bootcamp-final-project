import * as React from 'react';
import { Alert } from 'react-bootstrap';
import { Status, useSnack } from './SnackContext';

function Snack() {
  const snack = useSnack();
  if (!snack.show) {
    return <></>;
  }

  React.useEffect(() => {
    setTimeout(() => {
      snack.close();
    }, 10000);
  }, []);

  const variant = snack.status === Status.error ? 'danger' :
    snack.status === Status.success ? 'success' : 'primary'
  
  return (
    <Alert variant={variant}>
      {snack.message}
    </Alert>
  );
}

export default Snack;