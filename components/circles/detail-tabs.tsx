"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import CircleMembers from "./members";
import CircleTimeline from "./timeline";
import CircleActivity from "./activity";

type TabType = "members" | "timeline" | "activity";

interface CircleDetailTabsProps {
  circleId: number;
}

export default function CircleDetailTabs({ circleId }: CircleDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("timeline");

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: "timeline", label: "Rotation Timeline" },
    { id: "members", label: "Members" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          // <Button
          //   key={tab.id}
          //   variant={activeTab === tab.id ? "default" : "ghost"}
          //   size="sm"
          //   onClick={() => setActiveTab(tab.id)}
          //   className={activeTab !== tab.id ? "bg-transparent" : ""}
          // >
          //   {tab.label}
          // </Button>

          <div
            key={tab.id}
            className={`cursor-pointer text-sm font-medium p-2 rounded-t ${
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-white transition-all"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "timeline" && <CircleTimeline circleId={circleId} />}
        {activeTab === "members" && <CircleMembers circleId={circleId} />}
        {activeTab === "activity" && <CircleActivity circleId={circleId} />}
      </div>
    </div>
  );
}
