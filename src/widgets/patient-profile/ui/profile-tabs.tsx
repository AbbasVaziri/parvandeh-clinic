"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { toPersianDigits } from "@/shared/lib/persian";

interface ProfileTabsProps {
  defaultTab: string;
  examCount: number;
  docCount: number;
  info: React.ReactNode;
  exams: React.ReactNode;
  docs: React.ReactNode;
}

const TABS = ["info", "exams", "docs"] as const;

export function ProfileTabs({
  defaultTab,
  examCount,
  docCount,
  info,
  exams,
  docs,
}: ProfileTabsProps) {
  const router = useRouter();
  const [tab, setTab] = useState(
    TABS.includes(defaultTab as (typeof TABS)[number]) ? defaultTab : "info"
  );

  function handleChange(value: string) {
    setTab(value);
    router.replace(`?tab=${value}`, { scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={handleChange}>
      <TabsList className="grid h-11 w-full grid-cols-3">
        <TabsTrigger value="info">اطلاعات بیمار</TabsTrigger>
        <TabsTrigger value="exams">
          سوابق معاینه
          {examCount > 0 ? ` (${toPersianDigits(examCount)})` : ""}
        </TabsTrigger>
        <TabsTrigger value="docs">
          مدارک و تصاویر
          {docCount > 0 ? ` (${toPersianDigits(docCount)})` : ""}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="mt-6">
        {info}
      </TabsContent>
      <TabsContent value="exams" className="mt-6">
        {exams}
      </TabsContent>
      <TabsContent value="docs" className="mt-6">
        {docs}
      </TabsContent>
    </Tabs>
  );
}
