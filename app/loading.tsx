import { LoadingState } from "@/components/loading/LoadingState";
import Link from "next/link";

export default function Loading() {
  return <div className="page-loading"><LoadingState><Link className="loading-plan-link" href="/?view=plan" prefetch={false}>Explore the 2D plan ↗</Link></LoadingState></div>;
}
