"use client";

import { resetDemoData } from "@/lib/store/store";
import { Button } from "@/components/ui/Controls";
import { Icon } from "@/components/ui/Icon";

export function ResetDemoButton({ className, variant = "secondary", onDone }) {
  function handleClick() {
    const ok = window.confirm(
      "Reset demo data?\n\nAll changes made in this browser (new reports, verifications, assessments, edited assumptions) will be replaced with the original sample records.",
    );
    if (!ok) return;
    resetDemoData();
    onDone?.();
  }
  return (
    <Button variant={variant} className={className} onClick={handleClick}>
      <Icon name="reset" />
      Reset demo data
    </Button>
  );
}
