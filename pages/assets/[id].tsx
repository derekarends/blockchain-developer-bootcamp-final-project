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
import { AssetContract } from '../../typechain/AssetContract';
import NFTContract from '../../artifacts/contracts/NFT.sol/NFT.json';
import AssetContractJson from '../../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { NftAddress, AssetContractAddress } from '../../utils/EnvVars';
import { FetchState } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { Status, useSnack } from '../../components/SnackContext';
import { useAppState } from '../../components/AppStateContext';

function AssetDetails() {
  const auth = useAuth();
  const snack = useSnack();
  const { loans } = useAppState();
  const [asset, setAsset] = React.useState<Asset>();
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const [loanState, setLoanState] = React.useState<FetchState>(FetchState.loading);
  const [isSelling, setIsSelling] = React.useState<boolean>(false);
  const [salePrice, setSalePrice] = React.useState<string>('0');
  const router = useRouter();
  const { id } = router.query;

  React.useEffect(() => {
    if (!id || !auth.signer) {
      return;
    }
    loadAsset();
  }, [id, auth.signer]);

  async function loadAsset() {
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    const assetContract = new ethers.Contract(
      AssetContractAddress,
      AssetContractJson.abi,
      auth.signer
    ) as AssetContract;
    const asset = await assetContract.getAsset(BigNumber.from(id));

    const tokenUri = await tokenContract.tokenURI(asset.tokenId);
    const meta = JSON.parse(tokenUri);
    const price = ethers.utils.formatUnits(asset.price.toString(), 'ether');
    const item: Asset = {
      id: asset.tokenId.toNumber(),
      name: meta.name,
      description: meta.description,
      price,
      seller: asset.seller,
      image: meta.image,
      state: asset.state,
      owner: asset.owner,
    };
    setAsset(item);
    setState(FetchState.idle);
  }

  async function buyAsset() {
    setState(FetchState.buying);

    const assetContract = new ethers.Contract(
      AssetContractAddress,
      AssetContractJson.abi,
      auth.signer
    ) as AssetContract;

    try {
      const price = ethers.utils.parseUnits(asset.price.toString(), 'ether');
      const transaction = await assetContract.buyAsset(BigNumber.from(id), {
        value: price,
      });
      await transaction.wait();
      snack.display(Status.success, `You now own asset "${asset.name}"`);
      setState(FetchState.idle);
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
    const assetContract = new ethers.Contract(
      AssetContractAddress,
      AssetContractJson.abi,
      auth.signer
    ) as AssetContract;
    const listingFee = await assetContract.listingFee();

    const tokenId = BigNumber.from(id);
    const priceInEth = ethers.utils.parseUnits(salePrice, 'ether');

    try {
      await tokenContract.approve(assetContract.address, tokenId);
      const transaction = await assetContract.listExistingAsset(tokenId, priceInEth, {
        value: listingFee,
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

  const availableLoans = loans.filter((f: Loan) => f.assetId === parseInt(id as string));;

  if (state === FetchState.loading) {
    return <div>Loading...</div>;
  }

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
              <div>{asset.price} ETH</div>
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
      {asset.state === AssetState.ForSale ? (
        <Row>
          <Col md={6}>
            <Title>Available Loans</Title>
            <ListGroup>
              {!availableLoans || availableLoans.length === 0 ? (
                <div>No loans available</div>
              ) : (
                availableLoans.map((m: Loan) => {
                    return (
                      <ListGroup.Item
                        key={m.id}
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div className="ms-2 me-auto">
                          <div className="fw-bold">{m.name} ETH</div>
                          {m.description}
                        </div>
                        <Link href={`${Routes.Loans}/${m.id}`}>
                          <Button>Apply</Button>
                        </Link>
                      </ListGroup.Item>
                    );
                  })
              )}
            </ListGroup>
          </Col>
        </Row>
      ) : null}
    </Container>
  );
}

export default AssetDetails;
