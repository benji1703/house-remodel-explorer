import { Suspense } from "react";
import { LoadingState } from "@/components/loading/LoadingState";
import { HouseExplorer } from "@/components/HouseExplorer";

export default function Home() {
  return (
    <Suspense fallback={<div className="page-loading"><LoadingState /></div>}>
      <HouseExplorer />
    </Suspense>
  );
}
