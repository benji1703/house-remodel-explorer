import { Suspense } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/loading/LoadingState";
import { HouseExplorer } from "@/components/HouseExplorer";

export default function Home() {
  return (
    <Suspense fallback={<div className="page-loading"><LoadingState><Link className="loading-plan-link" href="/?view=plan" prefetch={false}>Explore the 2D plan ↗</Link></LoadingState></div>}>
      <HouseExplorer />
    </Suspense>
  );
}
