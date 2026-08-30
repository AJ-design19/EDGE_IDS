"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SplineIntro } from "@/components/SplineIntro";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-[#020817]">
      <SplineIntro show={showIntro} onComplete={() => setShowIntro(false)} />
      
      {/* Wrap dashboard in a motion div to fade it in after intro */}
      <motion.div 
        className="flex-1 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{ pointerEvents: showIntro ? 'none' : 'auto' }}
      >
        <DashboardLayout />
      </motion.div>
    </div>
  );
}
