import * as React from 'react';
import { ethers, BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Col,
  Container,
  Row,
  Button,
  Image,
  ListGroup,
  FormGroup,
  FormLabel,
  InputGroup,
} from 'react-bootstrap';
import { Loan, Asset, EthError, AssetState } from '../../components/Types';
import Title from '../../components/Title';
import Routes from '../../utils/Routes';
import { NFT } from '../../typechain/NFT';
import { Marketplace } from '../../typechain/Marketplace';
import NFTContract from '../../artifacts/contracts/NFT.sol/NFT.json';
import MarketplaceContract from '../../artifacts/contracts/Marketplace.sol/Marketplace.json';
import { NftAddress, MarketAddress } from '../../utils/EnvVars';
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
    loadLoan();
  }, []);

  async function loadLoan() {
    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketplaceContract.abi,
      auth.signer
    ) as Marketplace;
    const loan = await marketContract.getLoan(BigNumber.from(id));
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
              <div>{loan.loanAmount}</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Payment</div>
              <div>{loan.paymentAmount}</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Interest</div>
              <div>{loan.interest}</div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default LoanDetails;
