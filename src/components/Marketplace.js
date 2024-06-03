import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function Marketplace() {
    const [data, updateData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const ethers = require("ethers");
                
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                
                let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
                // Fetch all the NFTs from the contract
                let transaction = await contract.getAllNFTs();

                // Fetch all the details of every NFT from the contract and display
                const items = await Promise.all(transaction.map(async i => {
                    try{
                        let tokenURI = await contract.tokenURI(i.tokenId);
                        tokenURI = GetIpfsUrlFromPinata(tokenURI);
                        let meta = await axios.get(tokenURI);
                        meta = meta.data;

                        console.log(meta);

                        let price = i.price ? ethers.utils.formatUnits(i.price.toString(), 'ether') : "0";
                        
                        let item = {
                            price,
                            tokenId: i.tokenId.toNumber(),
                            seller: i.seller,
                            owner: i.owner,
                            image: meta.image,
                            name: meta.name,
                            description: meta.description,
                        };
                        return item;
                    }catch (metaError) {
                    console.error("Error fetching or parsing metadata for token ID", i.tokenId.toNumber(), metaError);
                    return null;
                    }
                }));

                
                const validItems = items.filter(item => item !== null);
                updateData(validItems);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching NFTs:", error);
                setError("Failed to load NFTs. Please try again later.");
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="flex flex-col place-items-center mt-20">
                    <div className="md:text-xl font-bold text-white">Loading NFTs...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Navbar />
                <div className="flex flex-col place-items-center mt-20">
                    <div className="md:text-xl font-bold text-white">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="flex flex-col place-items-center mt-20">
                <div className="md:text-xl font-bold text-white">Top NFTs</div>
                <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                    {data.map((value, index) => (
                        <NFTTile data={value} key={index}></NFTTile>
                    ))}
                </div>
            </div>
        </div>
    );
}








