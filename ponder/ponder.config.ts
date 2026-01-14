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
      address: "0x84c9dcDFd5CD9CfC464bB1418b838746AAFfD56C",
      // Deployment block from latest deploy (MockOracle at block 33079689)
      startBlock: 33410258,
    },
    // All SancaPool clones created by the factory (dynamic source)
    SancaPool: {
      chain: "mantleSepolia",
      abi: SancaPoolAbi,
      address: factory({
        address: "0x84c9dcDFd5CD9CfC464bB1418b838746AAFfD56C",
        event: parseAbiItem(
          "event PoolCreated(address indexed pool, address indexed creator, uint8 maxMembers, uint256 contributionPerPeriod, uint256 periodDuration, uint8 yieldBonusSplit, string poolName, string poolDescription)",
        ),
        parameter: "pool",
      }),
      startBlock: 33410258,
    },
  },
});

