"use client";

import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import TeamWorkIcon from "@hugeicons/core-free-icons/TeamWorkIcon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudyGroups } from "@/hooks/use-study-groups";
import { useAuth } from "@/lib/auth/auth-context";
import { CreateGroupDialog } from "./create-group-dialog";
import { DiscoverGroups } from "./discover-groups";
import { GroupAdminPanel } from "./group-admin-panel";
import { JoinGroupDialog } from "./join-group-dialog";
import { StudyGroupCard } from "./study-group-card";

function MyGroupsTab() {
  const t = useTranslations();
  const { data: groups, isLoading } = useStudyGroups();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{t("studyGroups.subtitle")}</p>
        <div className="flex items-center gap-2">
          <JoinGroupDialog />
          <CreateGroupDialog />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-32" />
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <StudyGroupCard key={group.$id} group={group} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <HugeiconsIcon icon={TeamWorkIcon} className="size-10 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{t("studyGroups.empty")}</p>
          <p className="text-muted-foreground text-sm">{t("studyGroups.emptyHint")}</p>
        </Card>
      )}
    </div>
  );
}

function AdminTab() {
  const { user } = useAuth();
  const { data: groups, isLoading } = useStudyGroups();
  const adminGroups = groups?.filter((g) => g.createdBy === user?.$id);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (!adminGroups || adminGroups.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {adminGroups.map((group) => (
        <Card key={group.$id} className="p-4">
          <GroupAdminPanel group={group} />
        </Card>
      ))}
    </div>
  );
}

const TABS = ["my-groups", "discover", "admin"] as const;
type Tab = (typeof TABS)[number];

export function GroupsHub() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<Tab>("my-groups");
  const { user } = useAuth();
  const { data: groups } = useStudyGroups();

  const isAdmin = groups?.some((g) => g.createdBy === user?.$id);

  const visibleTabs = TABS.filter((tab) => tab !== "admin" || isAdmin);

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{t("studyGroups.title")}</h1>
      </div>

      <div className="flex gap-1 border-border border-b" role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-primary border-b-2 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "my-groups" && <HugeiconsIcon icon={TeamWorkIcon} className="size-4" />}
            {tab === "discover" && <HugeiconsIcon icon={Search01Icon} className="size-4" />}
            {tab === "admin" && <HugeiconsIcon icon={UserIcon} className="size-4" />}
            {t(`studyGroups.tab.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === "my-groups" && <MyGroupsTab />}
      {activeTab === "discover" && <DiscoverGroups />}
      {activeTab === "admin" && <AdminTab />}
    </div>
  );
}
