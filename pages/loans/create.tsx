import * as React from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { LoanContract } from '../../typechain/LoanContract';
import { LoanContractAddress } from '../../utils/EnvVars';
import LoanContractJson from '../../artifacts/contracts/LoanContract.sol/LoanContract.json';
import { EthError, Loan } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { validateForm } from '../../utils/FormValidator';
import { Col, Button, Form } from 'react-bootstrap';
import { Input, InputAmount } from '../../components/Input';
import Routes from '../../utils/Routes';
import { useSnack, Status } from '../../components/SnackContext';
import { useLoading } from '../../components/Loading';

function CreateLoan() {
  const auth = useAuth();
  const router = useRouter();
  const snack = useSnack();
  const loading = useLoading();
  const [formInput, onFormInputChange] = React.useState<Loan>();

  async function save(e: any) {
    e.preventDefault();
    if (!validateForm(e)) {
      return;
    }

    const loanAmount = ethers.utils.parseUnits(formInput.loanAmount, 'ether');

    const loanContract = new ethers.Contract(
      LoanContractAddress,
      LoanContractJson.abi,
      auth.signer
    ) as LoanContract;

    try {
      loading.show();
      const { assetId } = formInput;
      const tx = await loanContract.createNewLoan(assetId, {
        value: loanAmount,
      });
      await tx.wait();
      router.push(`${Routes.Dashboard}`);
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Something went wrong');
    } finally {
      loading.hide();
    }
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
        <Button onClick={save}>Create Loan</Button>
      </Form>
    </Col>
  );
}

export default CreateLoan;
