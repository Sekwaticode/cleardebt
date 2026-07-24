import { Children, isValidElement, useState } from "react";
import "./Stepper.css";

export function Step({ children }) {
  return <div className="w-full">{children}</div>;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = "Previous",
  nextButtonText = "Next",
}) {
  const steps = Children.toArray(children).filter(isValidElement);
  const total = steps.length;

  const [current, setCurrent] = useState(
    Math.min(Math.max(initialStep, 1), total)
  );

  const goTo = (n) => {
    const clamped = Math.min(Math.max(n, 1), total);
    setCurrent(clamped);

    if (onStepChange) {
      onStepChange(clamped);
    }
  };

  const handleNext = () => {
    if (current >= total) {
      if (onFinalStepCompleted) {
        onFinalStepCompleted();
      }
      return;
    }

    goTo(current + 1);
  };

  return (
    <div className="stepper-root">
      <div className="stepper-indicators" aria-label="Progress">
        {steps.map((_, i) => {
          const stepNum = i + 1;

          const state =
            stepNum === current
              ? "active"
              : stepNum < current
              ? "completed"
              : "pending";

          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <div className={`stepper-dot ${state}`}>{stepNum}</div>

              {i < total - 1 && (
                <div
                  className={`stepper-connector ${
                    stepNum < current ? "completed" : ""
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="stepper-content">
        {steps[current - 1]}
      </div>

      <div className="stepper-footer">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => goTo(current - 1)}
          disabled={current === 1}
        >
          {backButtonText}
        </button>

        <button
          type="button"
          className="stepper-btn primary"
          onClick={handleNext}
        >
          {current >= total ? "Finish" : nextButtonText}
        </button>
      </div>
    </div>
  );
}