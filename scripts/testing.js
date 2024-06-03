const Marketplace =  require("../src/Marketplace.json");
async function getNFts () {
const MyContract = await ethers.getContractFactory("NFTMarketplace");
const contract = await MyContract.attach(
  Marketplace.address
);

// Now you can call functions of the contract
var vals = await contract.getListPrice();
console.log(vals);

}

getNFts();


