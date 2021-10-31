import * as React from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { NFT } from '../../typechain/NFT';
import { Marketplace } from '../../typechain/Marketplace';
import { NftAddress, MarketAddress } from '../../utils/EnvVars';
import NFTContract from '../../artifacts/contracts/NFT.sol/NFT.json';
import MarketContract from '../../artifacts/contracts/Marketplace.sol/Marketplace.json';
import { Asset } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { validateForm } from '../../utils/FormValidator';
import { toBase64 } from '../../utils/File';
import { Col, Button, InputGroup, FormGroup, Form, FormLabel, FormControl } from 'react-bootstrap';
import { Input } from '../../components/Input';
import Routes from '../../utils/Routes';

function CreateAsset() {
  const auth = useAuth();
  const router = useRouter();
  const [fileUrl, setFileUrl] = React.useState(null);
  const [formInput, onFormInputChange] = React.useState<Asset>();

  async function onFileInputChange(e: any) {
    const file = e.target.files[0];
    try {
      const fileInBase64 = await toBase64(file);
      setFileUrl(fileInBase64);
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  }

  async function save(e: any) {
    e.preventDefault();
    if (!validateForm(e)) {
      return;
    }

    const { name, description } = formInput;
    const data = JSON.stringify({
      name,
      description,
      image: 'fileUrl',
    });

    try {
      listNewAsset(data);
    } catch (error) {
      console.log('Error listing asset: ', error);
    }
  }

  async function listNewAsset(url: string) {
    const nftContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    let transaction = await nftContract.createToken(url);
    const tx = await transaction.wait();
    const event = tx.events[0];
    const value = event.args[2];
    const tokenId = value.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, 'ether');

    /* then list the item for sale on the marketplace */
    const marketContract = new ethers.Contract(
      MarketAddress,
      MarketContract.abi,
      auth.signer
    ) as Marketplace;
    const listingPrice = await marketContract.getListingPrice();

    transaction = await marketContract.listNewAsset(NftAddress, tokenId, price, {
      value: listingPrice,
    });
    await transaction.wait();
    router.push(`${Routes.Dashboard}`);
  }

  return (
    <Col md={{ span: 6, offset: 3 }}>
      <h2>Create an Asset</h2>
      <Form onSubmit={save} className="needs-validation" noValidate>
        <Input
          id="assetName"
          label="Name"
          onInputChange={(e) => onFormInputChange({ ...formInput, name: e.target.value })}
        />
        <Input
          id="assetDescription"
          label="Description"
          onInputChange={(e) => onFormInputChange({ ...formInput, description: e.target.value })}
        />
        <FormGroup className="mb-3">
          <FormLabel htmlFor="assetPrice">Price</FormLabel>
          <InputGroup className="input-group has-validation">
            <input
              id="assetPrice"
              className="form-control"
              onChange={(e) => onFormInputChange({ ...formInput, price: e.target.value })}
              required
            />
            <span className="input-group-text">ETH</span>
            <div className="invalid-feedback">Asset Price is required.</div>
          </InputGroup>
        </FormGroup>
        <FormGroup className="mb-3">
          <FormLabel htmlFor="assetFile">Asset</FormLabel>
          <FormControl
            id="assetFile"
            type="file"
            name="Asset"
            className="form-control"
            onChange={onFileInputChange}
            required
          />
          <div className="invalid-feedback">Asset is required.</div>
          {fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}
        </FormGroup>
        <Button onClick={save}>Create Digital Asset</Button>
      </Form>
    </Col>
  );
}

export default CreateAsset;
