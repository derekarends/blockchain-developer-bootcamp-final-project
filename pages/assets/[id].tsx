import * as React from 'react';
import { ethers, BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Col, Container, Row, Button, Image, ListGroup } from 'react-bootstrap';
import { Loan, Asset } from '../../components/Types';
import Title from '../../components/Title';
import Routes from '../../utils/Routes';
import { NFT } from '../../typechain/NFT';
import { Marketplace } from '../../typechain/Marketplace';
import NFTContract from '../../artifacts/contracts/NFT.sol/NFT.json';
import MarketplaceContract from '../../artifacts/contracts/Marketplace.sol/Marketplace.json';
import { NftAddress, MarketAddress } from '../../utils/EnvVars';
import { FetchState } from '../../components/Enums';

function AssetDetails() {
  const [asset, setAsset] = React.useState<Asset>();
  const [state, setState] = React.useState<FetchState>(FetchState.loading);
  const router = useRouter();
  const { id } = router.query;
  
  React.useEffect(() => {
    loadAsset()
  }, []);

  async function loadAsset() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, provider) as NFT;
    const marketContract = new ethers.Contract(MarketAddress, MarketplaceContract.abi, provider) as Marketplace;
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
    };
    setAsset(item);
    setState(FetchState.idle);
  }

  async function buyAsset() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(NftAddress, NFTContract.abi, provider) as NFT;
    const marketContract = new ethers.Contract(MarketAddress, MarketplaceContract.abi, provider) as Marketplace;

    await marketContract.
  }

  if (state === FetchState.loading) {
    return <div>Loading...</div>
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
          <Row>
            <Col>
              <Button style={{ width: '64px' }}>Buy</Button>
            </Col>
          </Row>
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
