/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        RPC_URL: process.env.RPC_URL,
        PRIVATE_KEY: process.env.PRIVATE_KEY,
        WALLET_ADDRESS: process.env.WALLET_ADDRESS,
        LOCAL_RPC_URL: process.env.LOCAL_RPC_URL
    },
};

module.exports = nextConfig;