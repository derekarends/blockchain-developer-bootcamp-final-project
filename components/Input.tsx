import * as React from 'react';
import { FormControl, FormGroup, FormLabel } from 'react-bootstrap';

type Props = {
  id: string,
  label: string,
  onInputChange: (e: any) => void
}

function Input({
  id,
  label,
  onInputChange
}: Props) {
  return (
    <FormGroup className="mb-3">
      <FormLabel htmlFor={id} className="form-label">
        {label}
      </FormLabel>
      <FormControl
        id={id}
        className="form-control"
        onChange={onInputChange}
        required
      />
      <div className="invalid-feedback">
        {label} is required.
      </div>
    </FormGroup>
  );
}

export default Input;
