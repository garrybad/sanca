"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumericFormat } from "react-number-format";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CreateCircleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCircleDialog({
  open,
  onOpenChange,
}: CreateCircleDialogProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    circleName: "",
    description: "",
    contribution: "",
    cycleDuration: "5",
    memberCount: "5",
    rotationOrder: "auto",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate circle creation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onOpenChange(false);
      // Reset form
      setFormData({
        circleName: "",
        description: "",
        contribution: "",
        cycleDuration: "5",
        memberCount: "5",
        rotationOrder: "auto",
      });
      router.push("/circles/1");
    } catch (err) {
      console.error("Failed to create circle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form on cancel
    setFormData({
      circleName: "",
      description: "",
      contribution: "",
      cycleDuration: "5",
      memberCount: "5",
      rotationOrder: "auto",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Circle</DialogTitle>
          <DialogDescription>
            Set up a rotating savings group with your community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Circle Name */}
          <div className="space-y-2">
            <Label className="block text-sm font-semibold text-foreground">
              Circle Name
            </Label>
            <Input
              type="text"
              name="circleName"
              placeholder="e.g., Community Builders, Tech Savings..."
              value={formData.circleName}
              onChange={handleChange}
              required
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Choose a memorable name for your circle
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="block text-sm font-semibold text-foreground">
              Description
            </Label>
            <Textarea
              name="description"
              placeholder="Describe your circle's purpose and goals...."
              onChange={handleChange}
              rows={3}
              className="w-full bg-background border border-border px-3 py-2 text-foreground placeholder-muted-foreground text-sm"
            />
          </div>

          {/* Contribution Amount */}
          <div className="space-y-2">
            <Label className="block text-sm font-semibold text-foreground">
              Monthly Contribution
            </Label>
            <NumericFormat
              id="contribution"
              className="bg-background border-border text-foreground"
              customInput={Input}
              value={formData.contribution}
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              allowNegative={false}
              onValueChange={(values) => {
                const { floatValue } = values;
                setFormData({
                  ...formData,
                  contribution: floatValue ? floatValue.toString() : "",
                });
              }}
              placeholder="$ 0"
              required
            />
            <p className="text-xs text-muted-foreground">
              Amount each member contributes per month
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Cycle Duration */}
            <div className="space-y-2">
              <Label className="block text-sm font-semibold text-foreground">
                Category
              </Label>
              <Select
                value={formData.cycleDuration}
                onValueChange={(value) =>
                  setFormData({ ...formData, cycleDuration: value })
                }
              >
                <SelectTrigger className="w-full bg-background border border-border text-foreground">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="5">5 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Member Count */}
            <div className="space-y-2">
              <Label className="block text-sm font-semibold text-foreground">
                Number of Members
              </Label>
              <Select
                value={formData.memberCount}
                onValueChange={(value) =>
                  setFormData({ ...formData, memberCount: value })
                }
              >
                <SelectTrigger className="w-full bg-background border border-border text-foreground">
                  <SelectValue placeholder="Select a number of members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 members</SelectItem>
                  <SelectItem value="4">4 members</SelectItem>
                  <SelectItem value="5">5 members</SelectItem>
                  <SelectItem value="6">6 members</SelectItem>
                  <SelectItem value="8">8 members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rotation Order */}
          <div className="space-y-2">
            <Label className="block text-sm font-semibold text-foreground">
              Rotation Order
            </Label>
            <Select
              value={formData.rotationOrder}
              onValueChange={(value) =>
                setFormData({ ...formData, rotationOrder: value })
              }
            >
              <SelectTrigger className="w-full bg-background border border-border text-foreground">
                <SelectValue placeholder="Select a rotation order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic (Lottery/Random)</SelectItem>
                <SelectItem value="manual">Manual (Members decide)</SelectItem>
                <SelectItem value="sequential">Sequential</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">
              Circle Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Monthly Contribution:
                </span>
                <span className="font-mono font-bold text-foreground">
                  ${formData.contribution || "0"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Members:</span>
                <span className="font-semibold text-foreground">
                  {formData.memberCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Fund Size:</span>
                <span className="font-mono font-bold text-accent">
                  $
                  {(
                    (Number.parseInt(formData.contribution) || 0) *
                    Number.parseInt(formData.memberCount)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Commitment:</span>
                <span className="font-semibold text-foreground">
                  {formData.cycleDuration} months
                </span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-transparent w-full"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating..." : "Create Circle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
