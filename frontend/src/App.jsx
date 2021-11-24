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
import { create } from 'ipfs-http-client';
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

    console.log("encryptionKeyDisplay", encryptionKeyDisplay)

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

  const createPIN = async() => {
    console.log("createPIN");

    if(firstName === "" || lastName === "" || email === "") {
      setAlert("Error: null data");

      return;
    }

    try {
      console.log("Minting...");
      await tx(contracts.PersonalIdentityToken.create(firstName, lastName, email));
      console.log("...OK");

      newAlert("Token created");
    } catch(e) {
      console.log("...FAIL");
      console.error(e);
      newAlert("Error occurred");
    }
  }

  const getPIN = async() => {
    try {
      const tokenID = await contracts.PersonalIdentityToken.get();
      const cid = await contracts.PersonalIdentityToken.tokenURI(tokenID);
      const res = await fetch(`https://ipfs.io/ipfs/${cid}`);
      const response = await res.json();
      const userData = await fetch("/get/"+response.data);
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
      await tx(contracts.PersonalIdentityToken.remove());
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
        <h1 className="h3 mb-3 font-weight-normal">Personal Identity Token</h1>
        { alert.length > 0 &&
          <div className="alert alert-primary" role="alert">{alert}</div>
        }
        <br />
        <div class="mb-3">
          <input type="text" class="form-control" id="firstName" placeholder="firstName" onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div class="mb-3">
          <input type="text" class="form-control" id="lastName" placeholder="lastName" onChange={(e) => setLastSurname(e.target.value)} required />
        </div>
        <div class="mb-3">
          <input type="email" class="form-control" id="email" placeholder="email" onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button className="btn btn-lg btn-primary btn-block" onClick={() => createPIN()}>Create Personal Identity NFT</button>
        <button className="btn btn-lg btn-success btn-block" onClick={() => getPIN()}>Read Personal Identity NFT</button>
        <button className="btn btn-lg btn-danger btn-block" onClick={() => deletePIN()}>Delete Personal Identity NFT</button>
        <p className="mt-5 mb-3 text-muted">Personal Identity Token - made for ChainLink fall hack</p>
      </span>
    </div>
  );
}

export default App;
