import { createConfig, factory } from "ponder";
import { parseAbiItem } from "viem";
import { SancaFactoryAbi } from "./abis/SancaFactoryAbi";
import { SancaPoolAbi } from "./abis/SancaPoolAbi";

export default createConfig({
  chains: {
    mantleSepolia: {
      id: 5003,
      rpc: process.env.PONDER_RPC_URL_5003!,
    },
  },
  contracts: {
    SancaFactory: {
      chain: "mantleSepolia",
      abi: SancaFactoryAbi,
      address: "0xAD3bD3482b15856DB7A48903A4DF25CE209546DF",
      // Around the deployment block from your logs
      startBlock: 33036783,
    },
    // All SancaPool clones created by the factory (dynamic source)
    SancaPool: {
      chain: "mantleSepolia",
      abi: SancaPoolAbi,
      address: factory({
        address: "0xAD3bD3482b15856DB7A48903A4DF25CE209546DF",
        event: parseAbiItem(
          "event PoolCreated(address indexed pool, address indexed creator, uint8 maxMembers, uint256 contributionPerPeriod, uint256 periodDuration, uint8 yieldBonusSplit, string poolName, string poolDescription)",
        ),
        parameter: "pool",
      }),
      startBlock: 33036783,
    },
  },
});

