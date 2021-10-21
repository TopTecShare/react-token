const contractListPromise = import("../abi/nft.json");

export const loadAppContracts = async () => {
  const config = {};
  config.deployedContracts = (await contractListPromise).default ?? {};
  return config;
};
