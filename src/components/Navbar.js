import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

function Navbar() {

const [connected, toggleConnect] = useState(false);
const location = useLocation();
const [currAddress, updateAddress] = useState('0x');


async function getAddress() {
  const ethers = require("ethers");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const addr = await signer.getAddress();
  updateAddress(addr);
}


function updateButton() {
  const ethereumButton = document.querySelector('.enableEthereumButton');
  if (ethereumButton) {
    ethereumButton.textContent = connected ? "Connected" : "Connect Wallet";
    ethereumButton.classList.remove("hover:bg-blue-70", "bg-blue-500");
    ethereumButton.classList.add("hover:bg-green-70", "bg-green-500");
  }
}


async function connectWebsite() {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== '0xaa36a7') {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    });
  }
  await window.ethereum.request({ method: 'eth_requestAccounts' })
    .then(() => {
      toggleConnect(true);
      getAddress();
    });
}



  useEffect(() => {
    if (window.ethereum === undefined)
      return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        toggleConnect(false);
        updateAddress('0x');
      } else {
        getAddress();
        toggleConnect(true);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    (async () => {
      const val = window.ethereum.isConnected();
      if (val) {
        await getAddress();
        toggleConnect(true);
      }
      updateButton();
    })();

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [location.pathname, connected]);

  useEffect(() => {
    const ethereumButton = document.querySelector('.enableEthereumButton');
    if (ethereumButton) {
      ethereumButton.textContent = connected ? "Connected" : "Connect Wallet";
      ethereumButton.classList.remove("hover:bg-blue-70", "bg-blue-500");
      ethereumButton.classList.add("hover:bg-green-70", "bg-green-500");
    }
  }, [connected]);

    return (
      <div className="">
        <nav className="w-screen">
          <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
          <li className='flex items-end ml-5 pb-2'>
            <Link to="/">
            <div className='inline-block font-bold text-xl ml-2'>
              NFT Marketplace
            </div>
            </Link>
          </li>
          <li className='w-2/6'>
            <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
              {location.pathname === "/" ? 
              <li className='border-b-2 hover:pb-0 p-2'>
                <Link to="/">Marketplace</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2'>
                <Link to="/">Marketplace</Link>
              </li>              
              }
              {location.pathname === "/sellNFT" ? 
              <li className='border-b-2 hover:pb-0 p-2'>
                <Link to="/sellNFT">List My NFT</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2'>
                <Link to="/sellNFT">List My NFT</Link>
              </li>              
              }              
          
              <li>
                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={connectWebsite}>{connected? "Connected":"Connect Wallet"}</button>
              </li>
            </ul>
          </li>
          </ul>
        </nav>
        {/* <div className='text-white text-bold text-right mr-10 text-sm'>
          {currAddress !== "0x" ? "Connected to":"Not Connected. Please login to view NFTs"} {currAddress !== "0x" ? (currAddress.substring(0,15)+'...'):""}
        </div> */}
        <div className='text-white text-bold text-right mr-10 text-sm'>
        {currAddress !== "0x" ? `Connected to ${currAddress.substring(0, 15)}...` : "Not Connected. Please login to view NFTs"}
      </div>
      </div>
    );
  }

  export default Navbar;