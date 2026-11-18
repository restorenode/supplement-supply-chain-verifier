"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import BatchIdForm from "@/components/BatchIdForm";
import { ArrowRightIcon } from "@/components/icons";

export default function HomeSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <BatchIdForm
      large
      value={value}
      onChange={setValue}
      inputRef={inputRef}
      onSubmit={(id) => router.push(`/verify?batch=${encodeURIComponent(id)}`)}
      buttonLabel={
        <>
          Verify batch
          <ArrowRightIcon />
        </>
      }
    />
  );
}
