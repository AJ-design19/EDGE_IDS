"use client";

import { useIDSWebSocket } from "@/hooks/useIDSWebSocket";
import { TopNavBar } from "./TopNavBar";
import { HeroMetrics } from "./HeroMetrics";
import { LiveDetectionFeed } from "./LiveDetectionFeed";
import { ThreatVisualization } from "./ThreatVisualization";
import { DeviceActivityPanel } from "./DeviceActivityPanel";
import { ThreatIntelligencePanel } from "./ThreatIntelligencePanel";

export default function DashboardLayout() {
  const { events, isConnected, stats, threatEvents } = useIDSWebSocket("ws://localhost:7001/ws");

  // Approximate throughput: packets processed per second based on the active connections / random jitter
  // This could also be provided by the backend, but we mock it based on stats here for effect
  const throughput = isConnected ? Math.floor(Math.random() * 50 + stats.activeFlows * 1.5) : 0;

  return (
    <div className="min-h-screen bg-[#0b1326] font-sans text-slate-50 selection:bg-[#3b82f6]/30">
      <TopNavBar isConnected={isConnected} throughput={throughput} />
      
      <main className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Hero Metrics */}
        <section>
          <HeroMetrics stats={stats} />
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Live Feed & Charts */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            <LiveDetectionFeed events={events} />
            <ThreatVisualization events={events} />
          </div>

          {/* Right Column: Panels */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 h-full">
            <div className="h-[400px]">
              <ThreatIntelligencePanel events={threatEvents} />
            </div>
            <div className="flex-1 min-h-[300px]">
              <DeviceActivityPanel connectedIPs={stats.connectedIPs} />
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
