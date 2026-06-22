"use client";

import * as m from "motion/react-m";
import { Anim } from "@/components/shared/anim";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/ui/voice-recorder";

interface AnimatedDialogContentProps {
  children?: React.ReactNode;
  onRecordingComplete?: (audioBlob: Blob | null) => void;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AnimatedDialogContent({
  children,
  onRecordingComplete,
  title = "Voice Recording",
  description = "Record your voice message and send it.",
  open,
  onOpenChange,
}: AnimatedDialogContentProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>{children}</DialogTrigger>
      <Anim>
        <DialogContent className="sm:max-w-md">
          <m.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 26,
              stiffness: 300,
            }}
          >
            <DialogHeader>
              <m.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <DialogTitle>{title}</DialogTitle>
              </m.div>
              <m.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <DialogDescription>{description}</DialogDescription>
              </m.div>
            </DialogHeader>
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <VoiceRecorder onRecordingComplete={onRecordingComplete} />
            </m.div>
          </m.div>
        </DialogContent>
      </Anim>
    </Dialog>
  );
}
