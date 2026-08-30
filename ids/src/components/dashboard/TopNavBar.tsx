import { Activity, Shield, AlertTriangle, Menu } from "lucide-react";
import Link from "next/link";

interface TopNavBarProps {
  isConnected: boolean;
  throughput: number;
}

export function TopNavBar({ isConnected, throughput }: TopNavBarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e293b] bg-[#0b1326]/90 backdrop-blur-md">
      <div className="w-full flex h-16 items-center justify-between px-6 md:px-8 lg:px-10">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Shield className="h-5 w-5 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#dae2fd]">
              Edge<span className="text-[#3b82f6]">IDS</span>
            </h1>
            <p className="text-[10px] font-mono text-[#8c909f] uppercase tracking-widest hidden sm:block">
              Real-time Threat Intelligence
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#64748b]"></span>
              )}
            </div>
            <span className="text-xs font-medium text-[#dae2fd] hidden sm:block">
              {isConnected ? "SYSTEM SECURE" : "CONNECTION LOST"}
            </span>
          </div>

          {/* Throughput */}
          <div className="hidden md:flex items-center gap-2 border-l border-[#1e293b] pl-6">
            <Activity className="h-4 w-4 text-[#8c909f]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8c909f] uppercase font-mono">Network Traffic</span>
              <span className="text-sm font-mono text-[#dae2fd]">
                {throughput} <span className="text-[10px] text-[#424754]">REQ/S</span>
              </span>
            </div>
          </div>

          {/* Alerts / Mobile Menu */}
          <div className="flex items-center gap-3 border-l border-[#1e293b] pl-4 md:pl-6">
            <Link
              href="/attack"
              className="text-xs font-mono text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-400/40 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              Attack Panel
            </Link>
            <button className="relative rounded-full p-2 hover:bg-[#1e293b] transition-colors hidden sm:block">
              <AlertTriangle className="h-5 w-5 text-[#8c909f]" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]"></span>
            </button>
            <button className="md:hidden rounded-lg p-2 hover:bg-[#1e293b] text-[#dae2fd]">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
