import * as React from 'react';
import { ethers, BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import {
  Col,
  Container,
  Row,
  Button,
  Image,
  FormGroup,
  FormLabel,
  InputGroup,
} from 'react-bootstrap';
import { Loan, Asset, EthError, AssetState } from '../../components/Types';
import { NFT } from '../../typechain/NFT';
import NFTContract from '../../artifacts/contracts/NFT.sol/NFT.json';
import { NftAddress } from '../../utils/EnvVars';
import { FetchState } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { Status, useSnack } from '../../components/SnackContext';
import { useLoading } from '../../components/Loading';
import AvailableLoans from '../../components/AvailableLoans';
import { getAssetContract, getAsset, getLoansForAsset } from '../../services/apiService';

enum SellingState {
  owner,
  notOwner,
}

/**
 * Create the AssetDetails component
 * @returns component
 */
function AssetDetails() {
  const auth = useAuth();
  const snack = useSnack();
  const loading = useLoading();
  const [asset, setAsset] = React.useState<Asset>();
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const [isSelling, setIsSelling] = React.useState<boolean>(false);
  const [sellingState, setSellingState] = React.useState<SellingState>(SellingState.notOwner);
  const [salePrice, setSalePrice] = React.useState<string>('0');
  const router = useRouter();
  const { id } = router.query;

  // If there is an id and a signer load the asset
  React.useEffect(() => {
    if (!id) {
      return;
    }
    loadAsset();
  }, [id]);

  // If there is an asset get the signers address and set selling state
  React.useEffect(() => {
    if (!asset) {
      return;
    }
    auth.signer?.getAddress().then((addr: string) => {
      setSellingState(addr === asset.owner ? SellingState.owner : SellingState.notOwner);
    });
  }, [asset, auth.signer]);

  // Load the asset using id from query string
  async function loadAsset(): Promise<void> {
    const asset = await getAsset(BigNumber.from(id).toNumber());
    setAsset(asset);

    const allLoans = await getLoansForAsset(asset);
    setLoans(allLoans);

    setState(FetchState.idle);
  }

  // If the current user does not own this asset, allow the user to buy the asset
  async function buyAsset(): Promise<void> {
    setState(FetchState.buying);

    try {
      loading.show();
      const price = ethers.utils.parseUnits(asset.price.toString(), 'ether');
      const transaction = await getAssetContract(auth.signer).buyAsset(BigNumber.from(id), {
        value: price,
      });
      await transaction.wait();
      snack.display(Status.success, `You now own asset "${asset.name}"`);
      setState(FetchState.idle);
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Something went wrong');
      setState(FetchState.idle);
    } finally {
      loading.hide();
    }

    await loadAsset();
  }

  // If the current user is the owner, allow the user to sell asset
  async function sellAsset(): Promise<void> {
    setState(FetchState.selling);
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    const assetContract = getAssetContract(auth.signer);
    const listingFee = await assetContract.listingFee();

    const tokenId = BigNumber.from(id);
    const priceInEth = ethers.utils.parseUnits(salePrice, 'ether');

    try {
      loading.show();
      await tokenContract.approve(assetContract.address, tokenId);
      const transaction = await assetContract.listExistingAsset(tokenId, priceInEth, {
        value: listingFee,
      });
      await transaction.wait();
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'Something went wrong');
      setState(FetchState.idle);
    } finally {
      loading.hide();
    }

    await loadAsset();
    setIsSelling(false);
  }

  // Get all the available loans
  const availableLoans = loans.filter((f: Loan) => f.assetId === parseInt(id as string));

  // Display loading if we are fetching the asset
  if (state === FetchState.loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row>
        <Col md={4}>
          <Image src={asset.image} width="100%" className="paper rounded-corner"/>
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
          {asset.state === AssetState.ForSale && sellingState !== SellingState.owner ? (
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
          ) : asset.state === AssetState.NotForSale && sellingState === SellingState.owner ? (
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
        <Row className='mt-16'>
          <Col md={6}>
            <AvailableLoans availableLoans={availableLoans} />
          </Col>
        </Row>
      ) : null}
    </Container>
  );
}

export default AssetDetails;
