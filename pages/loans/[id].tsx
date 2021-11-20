import * as React from 'react';
import { ethers, BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import { Col, Container, Row, Button } from 'react-bootstrap';
import { EthError, Loan, LoanState } from '../../components/Types';
import { LoanContract } from '../../typechain/LoanContract';
import LoanContractJson from '../../artifacts/contracts/LoanContract.sol/LoanContract.json';
import { LoanContractAddress } from '../../utils/EnvVars';
import { FetchState } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { useAppState } from '../../components/AppStateContext';
import { Status, useSnack } from '../../components/SnackContext';

function LoanDetails() {
  const auth = useAuth();
  const { assets } = useAppState();
  const snack = useSnack();
  const [loan, setLoan] = React.useState<Loan>();
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const [user, setUser] = React.useState<'lender' | 'borrower' | undefined>();
  const router = useRouter();
  const { id } = router.query;

  React.useEffect(() => {
    if (!id || !auth.signer) {
      return;
    }
    loadLoan();
  }, [id, auth.signer]);

  React.useEffect(() => {
    if (!loan) {
      return;
    }

    auth.signer.getAddress().then((addr: string) => {
      setUser(!loan.lender ? undefined : loan.lender === addr ? 'lender' : 'borrower');
    });
  }, [loan]);

  const loanContract = new ethers.Contract(
    LoanContractAddress,
    LoanContractJson.abi,
    auth.signer
  ) as LoanContract;

  async function loadLoan(): Promise<void> {
    const loan = await loanContract.getLoan(BigNumber.from(id));
    const loanAmount = ethers.utils.formatUnits(loan.loanAmount.toString(), 'ether');
    const item: Loan = {
      id: loan.id.toNumber(),
      assetId: loan.assetId.toNumber(),
      loanAmount: loanAmount,
      state: loan.state,
      lender: loan.lender,
    };
    setLoan(item);
    setState(FetchState.idle);
  }

  async function apply(): Promise<void> {
    setState(FetchState.buying);
    try {
      await loanContract.applyForLoan(BigNumber.from(id));
      setLoan({ ...loan, state: LoanState.Pending });
      snack.display(Status.success, 'Loan is pending approval');
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Error applying for loan');
    }
    setState(FetchState.idle);
  }

  async function approve(): Promise<void> {
    setState(FetchState.buying);
    try {
      await loanContract.approveLoan(BigNumber.from(id));
      setLoan({ ...loan, state: LoanState.Approved });
      snack.display(Status.success, 'Loan is approved');
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Error approving for loan');
    }
    setState(FetchState.idle);
  }

  async function decline(): Promise<void> {
    setState(FetchState.buying);
    try {
      await loanContract.declineLoan(BigNumber.from(id));
      setLoan({ ...loan, state: LoanState.New });
      snack.display(Status.success, 'Loan is was declined');
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Error declining for loan');
    }
    setState(FetchState.idle);
  }

  if (state === FetchState.loading) {
    return <div>Loading...</div>;
  }

  const stateToText =
    loan.state === LoanState.Pending
      ? 'Pending'
      : loan.state === LoanState.Approved
      ? 'Approved'
      : 'New';

  function renderLender() {
    return (
      <>
        {loan.state === LoanState.Pending ? (
          <>
            <Button onClick={approve} disabled={state === FetchState.selling}>
              Approve
            </Button>
            <Button onClick={decline} disabled={state === FetchState.selling} variant='danger' className='ml-8'>
              Decline
            </Button>
          </>
        ) : null}
      </>
    );
  }

  function renderBorrower() {
    return (
      <>
        {loan.state === LoanState.New ? (
          <Button onClick={apply} disabled={state === FetchState.buying}>
            Apply
          </Button>
        ) : null}
      </>
    );
  }

  return (
    <Container>
      <Row>
        <Col>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Asset</div>
              <div>{assets.find((f) => f.id === loan.assetId)?.name}</div>
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
              <div className="fw-bold">State</div>
              <div>{stateToText}</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              {user === undefined ? <></> : user === 'lender' ? renderLender() : renderBorrower()}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default LoanDetails;
