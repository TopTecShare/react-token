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
const { isMetaMaskInstalled } = MetaMaskOnboarding;

function App() {
  const [ data, setData ] = useState("");
  const chainId = 31337;
  const config = useContractConfig();
  const [ provider, setProvider ] = useState();
  const providerAndSigner = useUserProviderAndSigner(provider)
  const contracts = useContractLoader(providerAndSigner.signer, config, chainId);

  useEffect( () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
  }, []);

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
    const dataToUpload = await encryptData(data);
    const cid = await uploadToIPFS(dataToUpload);
    console.log("[createPIN] cid:", cid);
    await contracts.NFTManager.createIdentityToken(cid);
  }

  const getPIN = async() => {
    const tokenID = await contracts.NFTManager.getIdentityToken();
    const cid = await contracts.NFTManager.tokenURI(tokenID);
    const res = await fetch(`https://ipfs.io/ipfs/${cid}`);
    const response = await res.json();
    const userData = decryptData(response.data);
    console.log("userData", userData); // available in plaintext to querying dapp
  }

  const deletePIN = async() => {
    await contracts.NFTManager.deleteIdentityToken();
  }

  return (
    <div>
      <textarea onChange={e => setData(e.target.value)}>{data}</textarea>
      <button onClick={() => createPIN()}>Create Personal Identity NFT</button>
      <button onClick={() => getPIN()}>Read Personal Identity NFT</button>
      <button onClick={() => deletePIN()}>Delete Personal Identity NFT</button>
    </div>
  );
}

export default App;
