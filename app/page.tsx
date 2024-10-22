"use client"
import { Environment, ExampleConfig } from '@/config';
import { USDC_TOKEN, WETH_TOKEN } from '@/utils/constants';
import { getPairInfo, PairInfo } from '@/utils/pool';
import { getProvider, getWalletAddress } from '@/utils/providers';
import { runVolumeBot } from '@/utils/volume';
import React, { useState, ChangeEvent, FormEvent } from 'react';

interface FormData {
  timeInterval: string;
  startTime: string;
  endTime: string;
  pairAddress: string;
  pairVersion: string;
  volumeAmountUSD: string;
  tradeAmountUSD: string;
}

const BotForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData | any>({
    timeInterval: '',
    startTime: '',
    endTime: '',
    pairAddress: '',
    pairVersion: 'v2',
    volumeAmountUSD: '',
    tradeAmountUSD: '',
  });

  const [pairInfo, setPairInfo] = useState<PairInfo | boolean>(false);
  const [currentConfig, setCurrentConfig] = useState<ExampleConfig>({
    env: Environment.MAINNET,
    rpc: {
      local: process.env.LOCAL_RPC_URL || '',
      mainnet: process.env.RPC_URL || '',
    },
    wallet: {
      address: process.env.WALLET_ADDRESS || "",
      privateKey: process.env.PRIVATE_KEY || "",
    },
    chainId: 137,
    tokens: {
      in: WETH_TOKEN,
      amountIn: 1,
      out: USDC_TOKEN,
    },
  });

  const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'pairAddress') {
      let pairInfo = await getPairInfo(value, "polygon")
      console.log("Pair info =>", pairInfo);
      
      setPairInfo(pairInfo);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setFormData({
        ...formData,
        pairInfo,
        provider: getProvider(),
        walletAddress: getWalletAddress()
      })
      
      const response = await fetch('/api/VolumeBot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Success:', result);
      } else {
        console.error('Error:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Volume Bot Configuration</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Time Interval</label>
            <input
              type="text"
              name="timeInterval"
              value={formData.timeInterval}
              onChange={handleChange}
              placeholder="e.g., 5m, 1h"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Pair Address</label>
            <input
              type="text"
              name="pairAddress"
              value={formData.pairAddress}
              onChange={handleChange}
              placeholder="Enter pair address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-sm mt-2">
              {pairInfo && typeof pairInfo !== 'boolean' ? (pairInfo.symbol0 + '   /   ' + pairInfo.symbol1) : ''}
            </p>
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Pair Version</label>
            <select
              name="pairVersion"
              value={formData.pairVersion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="v2">Uniswap V2</option>
              <option value="v3">Uniswap V3</option>
            </select>
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Volume Amount</label>
            <input
              type="number"
              name="volumeAmountUSD"
              value={formData.volumeAmountUSD}
              onChange={handleChange}
              placeholder="Enter volume amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">Trade Amount</label>
            <input
              type="number"
              name="tradeAmountUSD"
              value={formData.tradeAmountUSD}
              onChange={handleChange}
              placeholder="Enter trade amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default BotForm;