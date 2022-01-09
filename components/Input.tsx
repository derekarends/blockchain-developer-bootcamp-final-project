import * as React from 'react';
import { FormControl, FormGroup, FormLabel, InputGroup } from 'react-bootstrap';

type Props = {
  id: string;
  label: string;
  className?: string;
  onInputChange: (e: any) => void;
};

/**
 * Wraps the Input element
 * @param Props 
 * @returns element
 */
function Input({ id, label, className, onInputChange }: Props) {
  return (
    <FormGroup className={`mb-3 ${className}`}>
      <FormLabel htmlFor={id} className="form-label">
        {label}
      </FormLabel>
      <FormControl id={id} className="form-control" onChange={onInputChange} required />
      <div className="invalid-feedback">{label} is required.</div>
    </FormGroup>
  );
}

/**
 * Wraps input with ETH tag
 * @param Props 
 * @returns element
 */
function InputAmount({ id, label, onInputChange }: Props) {
  return (
    <FormGroup className="mb-3">
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <InputGroup className="input-group has-validation">
        <input id={id} className="form-control" onChange={onInputChange} required />
        <span className="input-group-text">ETH</span>
        <div className="invalid-feedback">{label} is required.</div>
      </InputGroup>
    </FormGroup>
  );
}

export { Input, InputAmount };
