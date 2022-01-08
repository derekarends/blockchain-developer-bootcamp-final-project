import * as React from 'react';
import { ethers, BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import { Col, Container, Row, Button } from 'react-bootstrap';
import { Asset, EthError, Loan, LoanState } from '../../components/Types';
import { FetchState } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { Status, useSnack } from '../../components/SnackContext';
import { useLoading } from '../../components/Loading';
import { getAsset, getLoan, getLoanContract } from '../../services/apiService';

function LoanDetails() {
  const auth = useAuth();
  const snack = useSnack();
  const loading = useLoading();
  const [loan, setLoan] = React.useState<Loan>();
  const [asset, setAsset] = React.useState<Asset>();
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const [user, setUser] = React.useState<'lender' | 'borrower' | undefined>();
  const router = useRouter();
  const { id } = router.query;

  React.useEffect(() => {
    if (!id) {
      return;
    }
    loadLoan();
  }, [id]);

  React.useEffect(() => {
    if (!loan) {
      return;
    }

    auth.signer?.getAddress().then((addr: string) => {
      setUser(!loan.lender ? undefined : loan.lender === addr ? 'lender' : 'borrower');
    });
  }, [loan, auth.signer]);

  async function loadLoan(): Promise<void> {
    const loan = await getLoan(BigNumber.from(id).toNumber());
    setLoan(loan);

    const loanAsset = await getAsset(loan.assetId);
    setAsset(loanAsset);

    setState(FetchState.idle);
  }

  async function apply(): Promise<void> {
    try {
      loading.show();
      await getLoanContract(auth.signer).applyForLoan(BigNumber.from(id));
      setLoan({ ...loan, state: LoanState.Pending });
      snack.display(Status.success, 'Loan is pending approval');
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Error applying for loan');
    } finally {
      loading.hide();
    }
  }

  async function approve(): Promise<void> {
    try {
      loading.show();
      await getLoanContract(auth.signer).approveLoan(BigNumber.from(id));
      setLoan({ ...loan, state: LoanState.Approved });
      snack.display(Status.success, 'Loan is approved');
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Error approving for loan');
    } finally {
      loading.hide();
    }
  }

  async function decline(): Promise<void> {
    try {
      loading.show();
      await getLoanContract(auth.signer).declineLoan(BigNumber.from(id));
      setLoan({ ...loan, state: LoanState.New });
      snack.display(Status.success, 'Loan is was declined');
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Error declining for loan');
    } finally {
      loading.hide();
    }
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
            <Button onClick={approve}>
              Approve
            </Button>
            <Button onClick={decline} variant='danger' className='ml-8'>
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
          <Button onClick={apply}>
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
              <div>{asset?.name}</div>
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
