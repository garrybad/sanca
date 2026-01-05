/**
 * Contract addresses configuration
 * Loaded from environment variables
 */

export const CONTRACTS = {
  // Factory contract (creates pools)
  FACTORY: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
    process.env.SANCA_FACTORY ||
    "0xAD3bD3482b15856DB7A48903A4DF25CE209546DF") as `0x${string}`,

  // Token addresses
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    process.env.USDC_ADDY ||
    "0xAcab8129E2cE587fD203FD770ec9ECAFA2C88080") as `0x${string}`,

  MUSD: (process.env.NEXT_PUBLIC_MUSD_ADDRESS ||
    process.env.MOCK_MUSD ||
    "0x411958809d096dE13926fB75c04d26370156eFF2") as `0x${string}`,

  // Pool implementation (for reference)
  POOL_IMPL: (process.env.NEXT_PUBLIC_POOL_IMPL_ADDRESS ||
    process.env.SANCA_POOL_IMPL ||
    "0x01D706b372Db8F90E9f49e61e3fD5227DF824B22") as `0x${string}`,
} as const;

