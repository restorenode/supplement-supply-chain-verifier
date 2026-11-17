import { CheckIcon, XIcon } from "@/components/icons";
import { AnalyteStatus } from "@/lib/api";

/** Pass / Fail / Not stated — icon + text so status never depends on color. */
export default function AnalyteStatusCell({ status }: { status: AnalyteStatus }) {
  if (status === "PASS") {
    return (
      <span className="analyte-status">
        <CheckIcon size={12} />
        Pass
      </span>
    );
  }
  if (status === "FAIL") {
    return (
      <span className="analyte-status analyte-status--fail">
        <XIcon size={12} />
        Fail
      </span>
    );
  }
  return <span className="analyte-status faint">Not stated</span>;
}
