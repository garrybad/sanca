"use client";

import { Button } from "@/components/ui/button";
import { useContribute } from "@/hooks/useContribute";
import { useApproveUSDC } from "@/hooks/useApproveUSDC";
import { useAccount, useReadContract } from "wagmi";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { formatUSDC } from "@/lib/utils";
import { toBigInt } from "@/lib/utils";
import { erc20Abi } from "viem";
import { CONTRACTS } from "@/lib/contracts";

interface ContributeButtonProps {
  poolAddress: `0x${string}`;
  poolState: "Open" | "Active" | "Completed";
  currentCycle: number;
  members: Array<{ address: string }>;
  cycleContributions?: Array<{ memberAddress: string; cycleIndex: number }>;
}

export function ContributeButton({
  poolAddress,
  poolState,
  currentCycle,
  members,
  cycleContributions = [],
}: ContributeButtonProps) {
  const { address, isConnected } = useAccount();
  const { contribute, contributionPerPeriod, isPending, isConfirming, isSuccess, error } = useContribute(poolAddress);
  const { approve: approveUSDC, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApproveSuccess } = useApproveUSDC();

  // Check current USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && poolAddress ? [address, poolAddress] : undefined,
    query: {
      enabled: !!address && !!poolAddress,
    },
  });

  // Check if user is a member
  const isUserMember = members.some(
    (member) => member.address.toLowerCase() === address?.toLowerCase()
  );

  // Check if user already contributed to current cycle
  const hasContributed = cycleContributions.some(
    (contrib) =>
      contrib.memberAddress.toLowerCase() === address?.toLowerCase() &&
      contrib.cycleIndex === currentCycle
  );

  const [needsApproval, setNeedsApproval] = useState(false);

  // Check if approval is needed based on actual allowance
  useEffect(() => {
    if (contributionPerPeriod && allowance !== undefined) {
      setNeedsApproval(allowance < contributionPerPeriod);
    }
  }, [contributionPerPeriod, allowance]);

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      toast.success("Contribution successful!");
    }
  }, [isSuccess]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(`Failed to contribute: ${error.message}`);
    }
  }, [error]);

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("USDC approved! You can now contribute.");
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Don't show if pool is not active
  if (poolState !== "Active") {
    return null;
  }

  // Don't show if user is not a member
  if (!isUserMember) {
    return null;
  }

  // Show success message if already contributed
  if (hasContributed) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="w-4 h-4 text-accent" />
        <span>You have already contributed to this cycle</span>
      </div>
    );
  }

  const handleContribute = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!contributionPerPeriod) {
      toast.error("Unable to get contribution amount");
      return;
    }

    if (needsApproval) {
      // First approve USDC with exact amount needed
      await approveUSDC(poolAddress, contributionPerPeriod);
      return;
    }

    // Then contribute
    await contribute();
  };

  const isLoading = isPending || isConfirming || isApproving || isApprovingConfirming;
  const buttonText = needsApproval
    ? "Approve USDC"
    : isLoading
      ? isConfirming || isApprovingConfirming
        ? "Confirming..."
        : "Processing..."
      : `Contribute ${formatUSDC(contributionPerPeriod || BigInt(0))} USDC`;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleContribute}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isConfirming || isApprovingConfirming ? "Confirming..." : "Processing..."}
          </>
        ) : (
          buttonText
        )}
      </Button>
      {needsApproval && !isApproving && (
        <p className="text-xs text-muted-foreground text-center">
          You need to approve USDC spending first
        </p>
      )}
    </div>
  );
}

