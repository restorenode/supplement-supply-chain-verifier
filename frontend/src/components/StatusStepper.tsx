type StepStatus = "idle" | "pending" | "success" | "error";

type Step = {
  key: string;
  label: string;
  status: StepStatus;
  detail?: string;
};

type StatusStepperProps = {
  steps: Step[];
};

export default function StatusStepper({ steps }: StatusStepperProps) {
  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div className={`stepper-item status-${step.status}`} key={step.key}>
            <div className="stepper-marker">
              <span className="stepper-index">{index + 1}</span>
            </div>
            {!isLast ? <div className="stepper-line" /> : null}
            <div className="stepper-content">
              <div className="stepper-label">{step.label}</div>
              <div className="stepper-meta">
                <span className="stepper-state">{step.status}</span>
                {step.detail ? <span className="stepper-detail">{step.detail}</span> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
