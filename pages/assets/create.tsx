import * as React from 'react';
import { ethers } from 'ethers';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { useRouter } from 'next/router';
import { NFT } from '../../typechain/NFT';
import { AssetContract } from '../../typechain/AssetContract';
import { NftAddress, AssetContractAddress } from '../../utils/EnvVars';
import NFTContract from '../../artifacts/contracts/NFT.sol/NFT.json';
import AssetContractJson from '../../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { Asset, EthError } from '../../components/Types';
import { useAuth } from '../../components/AuthContext';
import { validateForm } from '../../utils/FormValidator';
import { Col, Button, InputGroup, FormGroup, Form, FormLabel, FormControl } from 'react-bootstrap';
import { Input } from '../../components/Input';
import Routes from '../../utils/Routes';
import { useSnack, Status } from '../../components/SnackContext';
import { toBase64 } from '../../utils/File';

const client = ipfsHttpClient({
  url: 'https://ipfs.infura.io:5001/api/v0'
});

function CreateAsset() {
  const auth = useAuth();
  const router = useRouter();
  const snack = useSnack();
  const [file, setFile] = React.useState(null);
  const [base64File, setBase64File] = React.useState(null);
  const [formInput, onFormInputChange] = React.useState<Asset>();

  async function onFileInputChange(e: any): Promise<void> {
    const file = e.target.files[0];
    setFile(file);
    const b64 = await toBase64(file);
    setBase64File(b64);
  }

  async function saveFile(): Promise<string> {
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`),
          pin: false
        }
      );
      return `https://ipfs.infura.io/ipfs/${added.path}`;
    } catch (e: unknown) {
      snack.display(Status.error, `Error uploading file`);
      console.log(e);
      return '';
    }
  }

  async function save(e: any): Promise<void> {
    e.preventDefault();
    if (!validateForm(e)) {
      return;
    }

    const fileUrl = await saveFile();
    const { name, description } = formInput;
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });

    try {
      const added = await client.add(data, { pin: false });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
     listNewAsset(url);
    } catch (e: unknown) {
      const err = e as EthError;
      snack.display(Status.error, err?.data?.message ?? 'An error happened when listing the asset');
    }
  }

  async function listNewAsset(url: string): Promise<void> {
    const nftContract = new ethers.Contract(NftAddress, NFTContract.abi, auth.signer) as NFT;
    let transaction = await nftContract.createToken(url);
    const tx = await transaction.wait();
    const event = tx.events[0];
    const value = event.args[2];
    const tokenId = value.toNumber();

    const assetContract = new ethers.Contract(
      AssetContractAddress,
      AssetContractJson.abi,
      auth.signer
    ) as AssetContract;

    const price = ethers.utils.parseUnits(formInput.price, 'ether');
    const listingFee = await assetContract.listingFee();
    transaction = await assetContract.listNewAsset(NftAddress, tokenId, price, {
      value: listingFee,
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
          {!!base64File && <img className="rounded mt-4" width="350" src={base64File} />}
        </FormGroup>
        <Button onClick={save}>Create Digital Asset</Button>
      </Form>
    </Col>
  );
}

export default CreateAsset;
