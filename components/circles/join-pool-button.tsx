"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useJoinPool } from "@/hooks/useJoinPool";
import { useApproveUSDC } from "@/hooks/useApproveUSDC";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import { formatUnits } from "viem";

interface JoinPoolButtonProps {
  poolAddress: `0x${string}`;
  poolState: "Open" | "Active" | "Completed";
  currentMembers: number;
  maxMembers: number;
  members?: Array<{ address: string }>; // List of member addresses
}

export function JoinPoolButton({
  poolAddress,
  poolState,
  currentMembers,
  maxMembers,
  members = [],
}: JoinPoolButtonProps) {
  const { address, isConnected } = useAccount();

  // Check if user is already a member
  const isUserMember = address && members.some(
    (m) => m.address.toLowerCase() === address.toLowerCase()
  );
  const { join, fullCollateral, isPending: isJoining, isConfirming: isConfirmingJoin, isSuccess: isJoinSuccess, error: joinError } = useJoinPool(poolAddress);
  const { approve, isPending: isApproving, isConfirming: isConfirmingApprove, isSuccess: isApproveSuccess } = useApproveUSDC();

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

  const [needsApproval, setNeedsApproval] = useState(false);

  // Check if approval is needed
  useEffect(() => {
    if (fullCollateral && allowance !== undefined) {
      setNeedsApproval(allowance < fullCollateral);
    }
  }, [fullCollateral, allowance]);

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("USDC approved successfully!");
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Handle join success
  useEffect(() => {
    if (isJoinSuccess) {
      toast.success("Successfully joined the pool!");
    }
  }, [isJoinSuccess]);

  // Handle errors
  useEffect(() => {
    if (joinError) {
      toast.error(`Failed to join pool: ${joinError.message}`);
    }
  }, [joinError]);

  const handleApprove = async () => {
    if (!fullCollateral) return;
    // Approve exact amount needed (not unlimited)
    await approve(poolAddress, fullCollateral);
  };

  const handleJoin = async () => {
    if (!fullCollateral) return;
    
    // Check allowance first
    if (needsApproval) {
      toast.error("Please approve USDC spending first");
      return;
    }

    await join();
  };

  // Don't show button if pool is not open or already full
  if (poolState !== "Open" || currentMembers >= maxMembers) {
    return null;
  }

  // Don't show if user is already a member
  if (isUserMember) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">You are already a member of this pool</p>
      </div>
    );
  }

  // Don't show if user is not connected
  if (!isConnected) {
    return (
      <Button disabled className="w-full">
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet to Join
      </Button>
    );
  }

  const isLoading = isApproving || isConfirmingApprove || isJoining || isConfirmingJoin;

  return (
    <div className="space-y-2">
      {fullCollateral && (
        <p className="text-sm text-muted-foreground text-center">
          Required: {formatUnits(fullCollateral, 6)} USDC
        </p>
      )}
      
      {needsApproval ? (
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isConfirmingApprove ? "Confirming..." : "Approving..."}
            </>
          ) : (
            "Approve USDC"
          )}
        </Button>
      ) : (
        <Button
          onClick={handleJoin}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isConfirmingJoin ? "Confirming..." : "Joining..."}
            </>
          ) : (
            "Join Pool"
          )}
        </Button>
      )}
    </div>
  );
}

