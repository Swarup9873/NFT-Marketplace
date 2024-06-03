import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import { ethers } from "ethers";

export default function NFTPage (props) {

    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");
    const [priceInEth, setPriceInEth] = useState(null);
    const [saleFinalized, setSaleFinalized] = useState(false);


async function getNFTData(tokenId) {
    const ethers = require("ethers");
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
   
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
    //create an NFT Token
    var tokenURI = await contract.tokenURI(tokenId);
    const listedToken = await contract.getListedTokenForId(tokenId);
    tokenURI = GetIpfsUrlFromPinata(tokenURI);
    let meta = await axios.get(tokenURI);
    meta = meta.data;
    console.log(listedToken);

    let item = {
        price: meta.price,
        tokenId: tokenId,
        seller: listedToken.seller,
        owner: listedToken.owner,
        image: meta.image,
        name: meta.name,
        description: meta.description,
        arbiter: meta.arbiter,
        saleTimestamp: listedToken.saleTimestamp ? listedToken.saleTimestamp.toNumber() : null 
    }
    console.log(item);
    updateData(item);
    updateDataFetched(true);
    console.log("address", addr)
    updateCurrAddress(addr);

    const priceInETH = await contract.getPriceInETH(ethers.utils.parseUnits(meta.price, 'ether'));
    setPriceInEth(ethers.utils.formatUnits(priceInETH, 'ether'));
}


async function buyNFT(tokenId) {
    try {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        const salePrice = ethers.utils.parseUnits(data.price, 'ether')
        updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
        //run the executeSale function
        let transaction = await contract.executeSale(tokenId, {value:salePrice});
        await transaction.wait();

        alert('You successfully bought the NFT!');
        updateMessage("");
    }
    catch(e) {
        alert("Upload Error"+e)
    }
}

async function finalizeSale(tokenId) {
    try {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        updateMessage("Finalizing the sale... Please Wait (Up to 5 mins)");
        let transaction = await contract.finalizeSale(tokenId);
        await transaction.wait();
        alert('You successfully finalized the sale of the NFT!');
        updateMessage("");

        setSaleFinalized(true);
    } catch (e) {
        alert("Finalize Error: " + e.message);
    }
}

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);
    if(typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);


    // const priceInEth = ethPrice ? (data.price / ethPrice).toFixed(4) : "Loading...";


    const handleDisputeSale = async (tokenId) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            await contract.disputeSale(tokenId);
            console.log("Dispute initiated successfully.");
        } catch (error) {
            console.error("Error initiating dispute:", error);
        }
    };

    return(
        <div style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{priceInEth ? `${priceInEth} ETH` : 'Loading...'}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                        Arbiter: <span className="text-sm">{data.arbiter}</span>
                    </div>
                    <div>
                    { currAddress !== data.owner && currAddress !== data.seller ?
                        <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                        : <div className="" color="white">You are the owner of this NFT</div>
                    }
                    
                    <div className="text-green text-center mt-3">{message}</div>
                    </div>
                    <div>
                        {currAddress === data.seller && data.saleTimestamp  && (data.saleTimestamp && (Date.now() / 1000) > (data.saleTimestamp + 86400)) ?
                            <button className="enableEthereumButton bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => finalizeSale(tokenId)}>Finalize Sale</button>
                            : <div className="" color="white"></div>
                        }
                        
                    </div> 
                    <div>
                        {currAddress === data.seller && data.saleTimestamp  && (data.saleTimestamp && (Date.now() / 1000) < (data.saleTimestamp + 86400)) ?
                            <div>Since you are the seller of this nft you have to finalize the sale after 1day of sale execution</div>
                            : <div className="" color="white"></div>
                        }
                        
                    </div> 
                    
                    <div>
                    { currAddress === data.arbiter  ?
                        (
                            <>
                                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => handleDisputeSale(data.tokenId)}>Dispute Sale</button>
                                <div className="" color="white">Since you are the arbiter of this nft sale, you can dispute the sale(Before 1 day after the sale is completed)</div>
                            </>
                        )
                        : 
                        <div className="" color="white"></div>
                       
                    }
                    </div>
                </div>
            </div>
        </div>
    )
}