# Basic NFT Marketplace where users can list any NFT they have for sale in USD and you can use the data from oracle to charge the buyer that amount in ETH. On a successful trade the admin of the contract (contract deployer) gets 10% commission of the price. During listing an NFT the seller can assign a role of arbiter to another address, who will get 1 day after a sale is finalised to dispute the sale. If that address disputes the sale within that time frame the sale should not happen and the seller should get its NFT back. If not then the sale should happen like normal.



To set up the repository and run the marketplace locally, run the below
```bash
git clone 'https://github.com/Swarup9873/NFT-Marketplace.git'
npm install
npm start
```

# You can see the address of your deployed contract in the Marketplace.json file located in the src folder.



# Set up your Alchemy Api urls for ethereum seploia testnet  and the private key of your metamask account. And then paste them in hardhat.config.js file :
```bash
sepolia: {
      url: process.env.REACT_APP_ALCHEMY_API_URL,
      accounts: [process.env.REACT_APP_PRIVATE_KEY]
    },
```



# The same way Set up your Pinata Api url and secret key and then paste them in pinata.js file located in the src folder :
```bash
const key = process.env.REACT_APP_PINATA_KEY;
const secret = process.env.REACT_APP_PINATA_SECRET;
```




When the react frontend starts in your localhost then:
  1. you should connect your metamask wallet (I have used the ethereum sepolia network). 
  2. Click on the List my NFT section and upload your NFT with the necessary requirements as mentioned in that section.
  3. Your NFT image and metadata will be uploaded to the Pinata IPFS database. So you must have an account and configure your pinata api key and secret key.
  4. A succeffful listing of the nft will require you to approve transactions on metmask.
  5. Now switch to another account on metamask and try out the "Buy NFT" functionality. After buying the NFT the seller has to Finalize the sale after 1day of executing the sale.
  6. Now switch to the arbiter account in the metamask and try out the dispute sale functionality which can only be done after executing the sale and before finalizing the sale.
