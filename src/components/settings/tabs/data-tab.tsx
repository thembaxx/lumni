"use client";

import { useMemo, useState } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { usePWAInstall } from "@/hooks/use-service-worker";
import { useRouter } from "@/i18n/navigation";
import { ConfirmDialog } from "@/components/settings/tabs/sections/confirm-dialog";
import { ProgressExport } from "./progress-export";

interface DataTabProps {
  studyPrefs: unknown;
  notifications: unknown;
  betaFeatures: unknown;
  onExport: () => void;
  onClear: () => void;
}

const restartTrailing = (
  <span className="ios-footnote font-semibold text-(--system-destructive)">Restart</span>
);

function RestartOnboarding() {
  const { push } = useRouter();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  return (
    <>
      <ListCell
        title="Restart Onboarding"
        subtitle="Go through the setup wizard again"
        destructive
        onClick={() => setShowRestartConfirm(true)}
        showSeparator={false}
        trailing={restartTrailing}
      />
      {showRestartConfirm && (
        <ConfirmDialog
          open={showRestartConfirm}
          title="Restart Onboarding?"
          description="Go through the setup wizard again. Your settings will be preserved."
          confirmLabel="Restart"
          cancelLabel="Cancel"
          onConfirm={() => {
            localStorage.removeItem("lumni_has_visited");
            localStorage.removeItem("lumni_onboarding");
            setShowRestartConfirm(false);
            push("/dashboard");
          }}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}
    </>
  );
}

const exportTrailing = (
  <span className="ios-footnote font-semibold text-(--system-accent)">Export</span>
);

const clearTrailing = (
  <span className="ios-footnote font-semibold text-(--system-destructive)">Clear</span>
);

function InstallAppSection() {
  const { isInstallable, install, dismissed, resetPwaDismiss } = usePWAInstall();

  const wasDismissed =
    typeof window !== "undefined" && localStorage.getItem("pwa-install-dismissed");

  const installTrailing = useMemo(
    () =>
      isInstallable ? (
        <span className="ios-footnote font-semibold text-(--system-accent)">Install</span>
      ) : (
        <span className="ios-footnote text-muted-foreground text-xs">Installed</span>
      ),
    [isInstallable],
  );

  const resetTrailing = useMemo(
    () =>
      wasDismissed ? (
        <span className="ios-footnote font-semibold text-(--system-accent)">Reset</span>
      ) : (
        <span className="ios-footnote text-muted-foreground text-xs">Active</span>
      ),
    [wasDismissed],
  );

  return (
    <ListSection header="App Installation" footer="Install Lumni on your device for offline access">
      <ListCell
        title="Install Lumni"
        subtitle={
          isInstallable
            ? "Add to home screen"
            : dismissed || wasDismissed
              ? "Prompt dismissed — reset to try again"
              : "App is available for installation"
        }
        disabled={!isInstallable}
        onClick={isInstallable ? install : undefined}
        trailing={installTrailing}
      />
      <ListCell
        title="Reset Install Prompt"
        subtitle={
          wasDismissed
            ? "Prompt will appear on next page visit"
            : "Install prompt has not been dismissed"
        }
        onClick={() => {
          resetPwaDismiss();
        }}
        showSeparator={false}
        trailing={resetTrailing}
      />
    </ListSection>
  );
}

export function DataTab({ onExport, onClear }: DataTabProps) {
  return (
    <>
      <ListSection header="Progress Report">
        <div className="px-4 py-2">
          <ProgressExport />
        </div>
      </ListSection>
      <ListSection header="Data Management" footer="Export, reset, or restart">
        <ListCell
          title="Export Settings"
          subtitle="Download your preferences as JSON"
          onClick={onExport}
          trailing={exportTrailing}
        />
        <ListCell
          title="Clear Local Data"
          subtitle="Reset all preferences to defaults"
          destructive
          onClick={onClear}
          showSeparator={false}
          trailing={clearTrailing}
        />
        <RestartOnboarding />
      </ListSection>
      <InstallAppSection />
    </>
  );
}
