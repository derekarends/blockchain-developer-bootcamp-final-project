import * as React from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { Marketplace } from '../../typechain/Marketplace';
import { NftAddress, MarketAddress } from '../../utils/EnvVars';
import MarketContract from '../../artifacts/contracts/Marketplace.sol/Marketplace.json';
import { Loan } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { validateForm } from '../../utils/FormValidator';
import { Col, Button, Form } from 'react-bootstrap';
import { Input, InputAmount } from '../../components/Input';
import Routes from '../../utils/Routes';

function CreateLoan() {
  const auth = useAuth();
  const router = useRouter();
  const [formInput, onFormInputChange] = React.useState<Loan>();

  async function save(e: any) {
    e.preventDefault();
    if (!validateForm(e)) {
      return;
    }
    try {
      createLoan();
    } catch (error) {
      console.log('Error creating loan: ', error);
    }
  }

  async function createLoan() {
    const loanAmount = ethers.utils.parseUnits(formInput.loanAmount, 'ether');
    const payments = ethers.utils.parseUnits(formInput.paymentAmount, 'ether');
    const interest = ethers.utils.parseUnits(formInput.interest, 'ether');

    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketContract.abi,
      auth.signer
    ) as Marketplace;

    const { assetId } = formInput;
    const tx = await marketContract.createNewLoan(assetId, interest, payments, {
      value: loanAmount,
    });
    await tx.wait();
    router.push(`${Routes.Dashboard}`);
  }

  return (
    <Col md={{ span: 6, offset: 3 }}>
      <h2>Create a Loan</h2>
      <Form onSubmit={save} className="needs-validation" noValidate>
        <Input
          id="assetId"
          label="Asset Id"
          onInputChange={(e) => onFormInputChange({ ...formInput, assetId: e.target.value })}
        />
        <InputAmount
          id="loanAmount"
          label="Amount"
          onInputChange={(e) => onFormInputChange({ ...formInput, loanAmount: e.target.value })}
        />
        <InputAmount
          id="paymentAmount"
          label="Payment Amount"
          onInputChange={(e) => onFormInputChange({ ...formInput, paymentAmount: e.target.value })}
        />
        <InputAmount
          id="interest"
          label="Interest"
          onInputChange={(e) => onFormInputChange({ ...formInput, interest: e.target.value })}
        />
        <Button onClick={save}>Create Loan</Button>
      </Form>
    </Col>
  );
}

export default CreateLoan;
