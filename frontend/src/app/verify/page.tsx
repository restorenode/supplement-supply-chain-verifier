import type { Metadata } from "next";
import VerifyClient from "@/app/verify/VerifyClient";

export const metadata: Metadata = {
  title: "Verify a batch"
};

export default function VerifyPage() {
  return <VerifyClient />;
}
