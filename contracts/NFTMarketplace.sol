// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "./interfaces/AggregatorV3Interface.sol";

contract NFTMarketplace is ERC721URIStorage {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    address payable owner;
    uint256 listPrice = 0.00001 ether;
    uint256 commissionRate = 10; // 10%

    AggregatorV3Interface internal priceFeed;

    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 priceUSD; // Price in USD (in cents)
        bool currentlyListed;
        address arbiter;
        uint256 saleTimestamp;
    }

    mapping(uint256 => ListedToken) private idToListedToken;

    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 priceUSD,
        bool currentlyListed,
        address arbiter
    );

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
        priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306); // Chainlink ETH/USD price feed on Sapolia
    }

    function updateListPrice(uint256 _listPrice) public payable {
        require(owner == msg.sender, "Only owner can update listing price");
        listPrice = _listPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    function createToken(string memory tokenURI, uint256 priceUSD, address arbiter) public payable returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        createListedToken(newTokenId, priceUSD, arbiter);

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 priceUSD, address arbiter) private {
        require(msg.value == listPrice, "Sending the correct price for listing");
        require(priceUSD > 0, "Price must be positive");

        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            priceUSD,
            true,
            arbiter,
            0
        );

        _transfer(msg.sender, address(this), tokenId);

        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            priceUSD,
            true,
            arbiter
        );
    }

    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;
        uint currentId;

        for(uint i = 0; i < nftCount; i++) {
            currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }

        return tokens;
    }

    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        uint currentId;

        for(uint i = 0; i < totalItemCount; i++) {
            if(idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender) {
                currentId = i + 1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function executeSale(uint256 tokenId) public payable {
        ListedToken storage listing = idToListedToken[tokenId];
        uint256 priceUSD = listing.priceUSD;
        uint256 priceETH = getPriceInETH(priceUSD);

        require(msg.value >= priceETH, "Please submit the asking price in ETH");

        // Hold ETH in escrow
        listing.saleTimestamp = block.timestamp;
    }

    function finalizeSale(uint256 tokenId) public {
        ListedToken storage listing = idToListedToken[tokenId];
        require(listing.saleTimestamp != 0, "Sale not initialized");
        require(block.timestamp > listing.saleTimestamp + 1 days, "Dispute period not over");

        uint256 priceETH = getPriceInETH(listing.priceUSD);
        uint256 commission = (priceETH * commissionRate) / 100;
        uint256 sellerAmount = priceETH - commission;

        listing.currentlyListed = false;
        listing.owner = payable(msg.sender);
        _itemsSold.increment();

        // Transfer NFT to the buyer
        _transfer(address(this), msg.sender, tokenId);
        approve(address(this), tokenId);

        // Transfer commission to the owner
        payable(owner).transfer(commission);

        // Transfer the remaining ETH to the seller
        listing.seller.transfer(sellerAmount);
    }

    function disputeSale(uint256 tokenId) public {
        ListedToken storage listing = idToListedToken[tokenId];
        require(msg.sender == listing.arbiter, "Only the arbiter can dispute");
        require(block.timestamp <= listing.saleTimestamp + 1 days, "Dispute period over");

        // Return NFT to the seller
        _transfer(address(this), listing.seller, tokenId);
        listing.currentlyListed = false;
        listing.saleTimestamp = 0;

        // Return ETH to the buyer
        payable(msg.sender).transfer(getPriceInETH(listing.priceUSD));
    }

    function getPriceInETH(uint256 priceUSD) public view returns (uint256) {
        (, int price, , , ) = priceFeed.latestRoundData();
        uint256 ethPriceInUSD = uint256(price) * 10**10;
        return (priceUSD * 10**18) / ethPriceInUSD;
    }

    receive() external payable {}
}
