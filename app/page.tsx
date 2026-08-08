import { Suspense } from "react";
import { HouseExplorer } from "@/components/HouseExplorer";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HouseExplorer />
    </Suspense>
  );
}
