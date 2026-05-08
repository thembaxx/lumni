"use client";

import { ToolsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ToolsDialog } from "./tools-dialog";
import { cn } from "@/lib/utils";

export function FloatingToolsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed bottom-[100px] right-5 z-40",
          "w-14 h-14 rounded-full",
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/25",
          "flex items-center justify-center",
          "active:scale-95 transition-transform"
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isHovered ? (
            <motion.div
              key="tools-hover"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HugeiconsIcon icon={ToolsIcon} className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="tools-normal"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HugeiconsIcon icon={ToolsIcon} className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <ToolsDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}