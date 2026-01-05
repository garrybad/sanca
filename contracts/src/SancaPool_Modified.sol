// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * PROPOSAL MODIFIKASI SANCA POOL CONTRACT
 * 
 * Perubahan yang diperlukan:
 * 
 * 1. Tambah state variables untuk track contributions per cycle:
 *    - mapping(uint256 => mapping(address => bool)) public cycleContributions;
 *    - mapping(uint256 => uint256) public cycleUSDCBalance;
 *    - mapping(uint256 => uint256) public cycleContributionCount; // count contributors per cycle
 * 
 * 2. Tambah fungsi contribute(uint256 cycle):
 *    - Member contribute contributionPerPeriod USDC (TIDAK wrap ke mUSD)
 *    - Track per cycle per member
 *    - Jika semua sudah contribute, bisa trigger draw
 * 
 * 3. Modifikasi triggerDraw():
 *    - Require semua member sudah contribute untuk cycle tersebut
 *    - Jika ada yang belum contribute, liquidate dari collateral mereka
 * 
 * 4. Modifikasi fulfillRandomness():
 *    - Transfer prize USDC (contributionPerPeriod * maxMembers) ke winner
 *    - Transfer yield dari mUSD ke winner
 * 
 * 5. Tambah fungsi liquidateCollateral():
 *    - Jika member tidak contribute, ambil dari collateral mUSD mereka
 *    - Convert mUSD ke USDC dan tambahkan ke cycleUSDCBalance
 * 
 * 6. Tambah event Contributed(uint256 indexed cycle, address indexed member, uint256 amount)
 */

