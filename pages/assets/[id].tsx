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

function AssetDetails() {
  const auth = useAuth();
  const snack = useSnack();
  const [asset, setAsset] = React.useState<Asset>();
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const [isSelling, setIsSelling] = React.useState<boolean>(false);
  const [salePrice, setSalePrice] = React.useState<string>('0');
  const router = useRouter();
  const { id } = router.query;

  React.useEffect(() => {
    loadAsset();
  }, []);

  async function loadAsset() {
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketplaceContract.abi,
      auth.signer
    ) as Marketplace;
    const a = await marketContract.getAsset(BigNumber.from(id));

    const tokenUri = await tokenContract.tokenURI(a.tokenId);
    const meta = JSON.parse(tokenUri);
    const price = ethers.utils.formatUnits(a.price.toString(), 'ether');
    const item: Asset = {
      id: a.tokenId.toNumber(),
      name: meta.name,
      description: meta.description,
      price,
      seller: a.seller,
      image: meta.image,
      state: a.state,
    };
    setAsset(item);
    setState(FetchState.idle);
  }

  async function buyAsset() {
    setState(FetchState.buying);

    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketplaceContract.abi,
      auth.signer
    ) as Marketplace;

    try {
      const price = ethers.utils.parseUnits(asset.price.toString(), 'ether');
      const transaction = await marketContract.buyAsset(BigNumber.from(id), {
        value: price,
      });
      await transaction.wait();
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Something went wrong');
      setState(FetchState.idle);
    }

    await loadAsset();
  }

  async function sellAsset() {
    setState(FetchState.selling);
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketplaceContract.abi,
      auth.signer
    ) as Marketplace;
    const listingPrice = await marketContract.getListingPrice();

    const tokenId = BigNumber.from(id);
    const priceInEth = ethers.utils.parseUnits(salePrice, 'ether');

    try {
      await tokenContract.approve(marketContract.address, tokenId);
      const transaction = await marketContract.listExistingAsset(tokenId, priceInEth, {
        value: listingPrice,
      });
      await transaction.wait();
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Something went wrong');
      setState(FetchState.idle);
    }

    await loadAsset();
    setIsSelling(false);
  }

  if (state === FetchState.loading) {
    return <div>Loading...</div>;
  }

  const loans: Loan[] = [
    {
      id: 1,
      name: 'Loan 1',
      description: 'Desc of loan 1',
    },
    {
      id: 2,
      name: 'Loan 2',
      description: 'Desc of loan 2',
    },
  ];

  return (
    <Container>
      <Row>
        <Col md={4}>
          <Image src={asset.image} />
        </Col>
        <Col>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Title</div>
              <div>{asset.name}</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Description</div>
              <div>{asset.description}</div>
            </Col>
          </Row>
          <Row className="mb-16">
            <Col>
              <div className="fw-bold">Price</div>
              <div>{asset.price}</div>
            </Col>
          </Row>
          {asset.state === AssetState.ForSale ? (
            <Row>
              <Col>
                <Button
                  style={{ width: '64px' }}
                  onClick={buyAsset}
                  disabled={state === FetchState.buying}
                >
                  Buy
                </Button>
              </Col>
            </Row>
          ) : asset.state === AssetState.NotForSale ? (
            <Row>
              <Col>
                <Button
                  style={{ width: '64px' }}
                  onClick={() => {
                    setIsSelling(true);
                  }}
                  disabled={isSelling}
                >
                  Sell
                </Button>
              </Col>
            </Row>
          ) : null}
          {isSelling ? (
            <>
              <Row className="mt-16">
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <FormLabel htmlFor="assetPrice">Price</FormLabel>
                    <InputGroup className="input-group has-validation">
                      <input
                        id="assetPrice"
                        className="form-control"
                        onChange={(e) => setSalePrice(e.target.value)}
                        required
                      />
                      <span className="input-group-text">ETH</span>
                      <div className="invalid-feedback">Asset Price is required.</div>
                    </InputGroup>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button
                    style={{ width: '85px', marginRight: '16px' }}
                    onClick={() => {
                      sellAsset();
                    }}
                    disabled={state === FetchState.selling}
                  >
                    Confirm
                  </Button>
                  <Button
                    style={{ width: '75px' }}
                    onClick={() => {
                      setIsSelling(false);
                    }}
                    disabled={state === FetchState.selling}
                    variant={'secondary'}
                  >
                    Cancel
                  </Button>
                </Col>
              </Row>
            </>
          ) : null}
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Title>Available Loans</Title>
          <ListGroup>
            {loans.map((loan: Loan) => {
              return (
                <ListGroup.Item
                  key={loan.id}
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">{loan.name}</div>
                    {loan.description}
                  </div>
                  <Link href={`${Routes.Loans}/${loan.id}`}>
                    <Button>Apply</Button>
                  </Link>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default AssetDetails;
