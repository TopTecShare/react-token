const { ethers } = require("hardhat");
const parseArgs = require("minimist");

async function main() {
  const argv = parseArgs(process.argv.slice(2), {
    string: ["wallet", "w", "amount", "a"],
  });
  const wallet = argv.wallet;
  const amount = argv.amount;

  await ethers.provider.send("hardhat_impersonateAccount", [
    "0x503828976D22510aad0201ac7EC88293211D23Da",
  ]);
  const impersonatedAccount = ethers.provider.getSigner("0x503828976D22510aad0201ac7EC88293211D23Da");
  console.log(`SENDING ${amount} ETH to ${wallet}`);
  await impersonatedAccount.sendTransaction({
    to: wallet,
    value: ethers.utils.parseEther(amount),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
