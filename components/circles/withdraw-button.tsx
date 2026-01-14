"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useReadContract } from "wagmi";
import { SancaPoolAbi } from "@/lib/abis";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useWithdraw } from "@/hooks/useWithdraw";
import { formatUSDC } from "@/lib/utils";
import { toBigInt } from "@/lib/utils";

interface WithdrawButtonProps {
  poolAddress: `0x${string}`;
  poolState: "Open" | "Active" | "Completed";
}

export function WithdrawButton({
  poolAddress,
  poolState,
}: WithdrawButtonProps) {
  const { address, isConnected } = useAccount();
  const { withdraw, isPending, isConfirming, isSuccess, error } = useWithdraw(poolAddress);

  // Check member's remaining collateral
  const { data: memberCollateral, refetch: refetchCollateral } = useReadContract({
    address: poolAddress,
    abi: SancaPoolAbi,
    functionName: "memberCollateral",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!poolAddress && poolState === "Completed",
    },
  });

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      toast.success("Funds withdrawn successfully!");
      refetchCollateral();
    }
  }, [isSuccess, refetchCollateral]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(`Failed to withdraw: ${error.message}`);
    }
  }, [error]);

  // Don't show if pool is not completed
  if (poolState !== "Completed") {
    return null;
  }

  // Don't show if user is not connected
  if (!isConnected) {
    return (
      <Button disabled className="w-full">
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet to Withdraw
      </Button>
    );
  }

  const remainingCollateral = memberCollateral ? toBigInt(memberCollateral) : 0n;
  const hasRemainingCollateral = remainingCollateral > 0n;

  if (!hasRemainingCollateral) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No remaining collateral to withdraw</p>
      </div>
    );
  }

  const isLoading = isPending || isConfirming;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground text-center">
        Remaining collateral: {formatUSDC(remainingCollateral)} USDC
      </p>
      <Button
        onClick={() => withdraw()}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isConfirming ? "Confirming..." : "Withdrawing..."}
          </>
        ) : (
          `Withdraw ${formatUSDC(remainingCollateral)} USDC`
        )}
      </Button>
    </div>
  );
}

