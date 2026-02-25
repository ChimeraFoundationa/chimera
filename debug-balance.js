import { ethers } from 'ethers';

// Ambil private key dari environment variable
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  console.error('❌ Error: PRIVATE_KEY environment variable is not set.');
  process.exit(1);
}

// RPC URL untuk Scroll Sepolia (sama dengan yang di config Anda)
const rpcUrl = 'https://sepolia-rpc.scroll.io';

async function checkBalance() {
  try {
    console.log('🔍 Checking wallet details...\n');

    // Buat wallet instance dari private key
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;

    console.log(`🔑 Derived Wallet Address: ${address}`);
    console.log('--------------------------------------------------');

    // Connect ke provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Dapatkan saldo
    const balance = await provider.getBalance(address);
    
    // Konversi balance dari Wei ke Ether
    const balanceInEth = ethers.formatEther(balance);

    console.log(`💰 Balance on Scroll Sepolia: ${balanceInEth} ETH`);

    // Dapatkan gas price
    const gasPrice = await provider.getFeeData();
    console.log(`⛽ Current Gas Price (Gwei): ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')}`);

    if (parseFloat(balanceInEth) < 0.001) { // Contoh threshold
        console.log('\n⚠️  Warning: Your balance seems very low. Deployment might fail.');
        console.log('Please top up your wallet using the Scroll Sepolia faucet.');
    }

  } catch (error) {
    console.error('❌ An error occurred:', error.message);
  }
}

checkBalance();
