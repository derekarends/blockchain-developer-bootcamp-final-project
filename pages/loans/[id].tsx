import * as React from 'react';
import { ethers, BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import {
  Col,
  Container,
  Row,
} from 'react-bootstrap';
import { Loan } from '../../components/Types';
import { AssetContract } from '../../typechain/AssetContract';
import AssetContractJson from '../../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { LoanContract } from '../../typechain/LoanContract';
import LoanContractJson from '../../artifacts/contracts/LoanContract.sol/LoanContract.json';
import { AssetContractAddress, LoanContractAddress } from '../../utils/EnvVars';
import { FetchState } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { Status, useSnack } from '../../components/SnackContext';

function LoanDetails() {
  const auth = useAuth();
  const snack = useSnack();
  const [loan, setLoan] = React.useState<Loan>();
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const router = useRouter();
  const { id } = router.query;

  React.useEffect(() => {
    if (!id || !auth.signer) {
      return;
    }
    loadLoan();
  }, [id, auth.signer]);

  async function loadLoan() {
    const loanContract = new ethers.Contract(
      LoanContractAddress,
      LoanContractJson.abi,
      auth.signer
    ) as LoanContract;
    const loan = await loanContract.getLoan(BigNumber.from(id));
    const loanAmount = ethers.utils.formatUnits(loan.loanAmount.toString(), 'ether');
    const interest = ethers.utils.formatUnits(loan.interest.toString(), 'ether');
    const payments = ethers.utils.formatUnits(loan.paymentAmount.toString(), 'ether');
    const item: Loan = {
      id: loan.id.toNumber(),
      assetId: loan.assetId.toNumber(),
      loanAmount: loanAmount,
      interest: interest,
      paymentAmount: payments,
    };
    setLoan(item);
    setState(FetchState.idle);
  }

  if (state === FetchState.loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row>
        <Col>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Asset Id</div>
              <div>{loan.assetId}</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Amount</div>
              <div>{loan.loanAmount} ETH</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Payment</div>
              <div>{loan.paymentAmount} ETH</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Interest</div>
              <div>{loan.interest} ETH</div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default LoanDetails;
