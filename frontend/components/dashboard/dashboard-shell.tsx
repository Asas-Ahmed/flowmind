"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLoader } from "./dashboard-loader";

type DashboardShellProps = {
  children: React.ReactNode;
};

const LOADER_KEY = "flowmind-dashboard-loader-seen";

export function DashboardShell({ children }: DashboardShellProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hasSeenLoader = sessionStorage.getItem(LOADER_KEY);

      if (!hasSeenLoader) {
        sessionStorage.setItem(LOADER_KEY, "true");
        setShowLoader(true);
      }

      setIsChecking(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <DashboardLoader onFinish={() => setShowLoader(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          opacity: isChecking || showLoader ? 0 : 1,
          y: isChecking || showLoader ? 10 : 0,
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </>
  );
}