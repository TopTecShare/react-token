import React, { useEffect, useState } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
// eslint-disable-next-line camelcase
import {
  encrypt,
  recoverPersonalSignature,
  recoverTypedSignatureLegacy,
  recoverTypedSignature,
  recoverTypedSignature_v4 as recoverTypedSignatureV4,
} from 'eth-sig-util';
import { ethers } from 'ethers';
import { toChecksumAddress } from 'ethereumjs-util';
import { signTypedData } from 'eth-sig-util';
import { create } from 'ipfs-http-client'
import { useContractLoader, useUserProviderAndSigner } from 'eth-hooks';
import { useContractConfig } from './hooks/useContractConfig';
import { Transactor } from './helpers/Transactor';

const { isMetaMaskInstalled } = MetaMaskOnboarding;

function App() {
  const [ name, setName ] = useState("");
  const [ surname, setSurname ] = useState("");
  const [ alert, setAlert ] = useState("");
  const chainId = 4;
  const config = useContractConfig();
  const [ provider, setProvider ] = useState();
  const providerAndSigner = useUserProviderAndSigner(provider)
  const contracts = useContractLoader(providerAndSigner.signer, config, chainId);
  const tx = Transactor(providerAndSigner.signer);
  
  useEffect( () => {
    const loadProvider = async() => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const userAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setProvider(provider);
    }
    loadProvider();
  }, []);

  const newAlert = (text) => {
    setAlert(text);
    setTimeout(() => {
      setAlert("");
   }, 3500)
  }

  const encryptData = async(cleartext) => {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    const encryptionKeyDisplay = await window.ethereum.request({
      method: 'eth_getEncryptionPublicKey',
      params: [accounts[0]],
    });

    const cyphertext = stringifiableToHex(
      encrypt(
        encryptionKeyDisplay,
        { data: cleartext },
        'x25519-xsalsa20-poly1305',
      ),
    );

    return cyphertext;
  }

  const decryptData = async(cyphertext) => {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    const cleartext = await window.ethereum.request({
      method: 'eth_decrypt',
      params: [cyphertext, accounts[0]],
    });

    return cleartext;
  }

  const stringifiableToHex = (value) => {
    return ethers.utils.hexlify(Buffer.from(JSON.stringify(value)));
  }

  const uploadToIPFS = async (data) => {
    const file = JSON.stringify({data: data, version: "v1"});
    const client = create(new URL('https://ipfs.infura.io:5001/api/v0'));
    const cid = await client.add(file);
    console.log("[uploadToIPFS] cid", cid.path);

    return cid.path;
  }

  const createPIN = async() => {
    console.log("createPIN");

    let userData = prompt("KYC Provider\nINPUT DATA\nPlease enter your full name", "John Doe");

    if(userData === "") {
      setAlert("Error: null data");

      return;
    }

    try {
      console.log("Encrypting...");
      const dataToUpload = await encryptData(userData);
      console.log("Uploading...");
      const cid = await uploadToIPFS(dataToUpload);
      console.log("Minting...");
      await tx(contracts.NFTManager.create(cid));
      console.log("...OK");

      newAlert("Token created with data:" + userData);
    } catch(e) {
      console.log("...FAIL");
      console.error(e);
      newAlert("Error occurred");
    }
  }

  const getPIN = async() => {
    try {
      const tokenID = await contracts.NFTManager.get();
      const cid = await contracts.NFTManager.tokenURI(tokenID);
      const res = await fetch(`https://ipfs.io/ipfs/${cid}`);
      const response = await res.json();
      const userData = await decryptData(response.data);
      newAlert("Token was read and contains data: " + userData);
    } catch(e) {
      console.log("...FAIL");
      console.error(e);
      newAlert("Error occurred");
    }
  }

  const deletePIN = async() => {
    try {
      console.log("Deleting...");
      await tx(contracts.NFTManager.remove());
      console.log("...OK");
      newAlert("Token was deleted");
    } catch(e) {
      console.log("...FAIL");
      console.error(e);
      newAlert("Error!");
    }
  }

  return (
    <div className="text-center">
      <span className="form-signin">
        <h1 className="h3 mb-3 font-weight-normal">KYC Token</h1>
        { alert.length > 0 &&
          <div className="alert alert-primary" role="alert">{alert}</div>
        }
        <br />
        <div class="mb-3">
          <input type="text" class="form-control" id="name" placeholder="Name" onChange={(e) => setName(e.target.value)} />
        </div>
        <div class="mb-3">
          <input type="text" class="form-control" id="surname" placeholder="Surname" onChange={(e) => setSurname(e.target.value)} />
        </div>
        <button className="btn btn-lg btn-primary btn-block" onClick={() => createPIN()}>Create Personal Identity NFT</button>
        <button className="btn btn-lg btn-success btn-block" onClick={() => getPIN()}>Read Personal Identity NFT</button>
        <button className="btn btn-lg btn-danger btn-block" onClick={() => deletePIN()}>Delete Personal Identity NFT</button>
        <p className="mt-5 mb-3 text-muted">Personal Identity Token</p>
      </span>
    </div>
  );
}

export default App;
