/**
 * Contract addresses configuration
 * Loaded from environment variables
 */

export const CONTRACTS = {
  // Factory contract (creates pools)
  FACTORY: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
    process.env.SANCA_FACTORY ||
    "0x5117711063B5cd297E118E28E29Ed9628eEA9B28") as `0x${string}`,

  // Token addresses
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    process.env.USDC_ADDY ||
    "0xdd84FFAA4178Fb4549b0582a76d01bd1Fd5148bc") as `0x${string}`,

  MUSD: (process.env.NEXT_PUBLIC_MUSD_ADDRESS ||
    process.env.MOCK_MUSD ||
    "0xa723f154Fc604D3953CC85a52Ab3C4e2255021b8") as `0x${string}`,

  // Pool implementation (for reference)
  POOL_IMPL: (process.env.NEXT_PUBLIC_POOL_IMPL_ADDRESS ||
    process.env.SANCA_POOL_IMPL ||
    "0x255C16b685B24A6916983Abc6Af62EF0aC34d714") as `0x${string}`,
} as const;

