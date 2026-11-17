"use client";

import { FormEvent, ReactNode, RefObject } from "react";

type BatchIdFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (batchId: string) => void;
  buttonLabel: ReactNode;
  disabled?: boolean;
  large?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
};

/** The hero "BATCH ID | value  [Verify]" search form used on Home and Verify. */
export default function BatchIdForm({ value, onChange, onSubmit, buttonLabel, disabled, large, inputRef }: BatchIdFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = value.trim();
    if (!id) {
      inputRef?.current?.focus();
      return;
    }
    onSubmit(id);
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search">
      <label className={`prefixed prefixed--hero${large ? " prefixed--xl" : ""}`}>
        <span className="prefixed__label">BATCH ID</span>
        <input
          ref={inputRef}
          className="prefixed__input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="VA-2025-0001"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label="Batch ID"
          maxLength={64}
        />
      </label>
      <button type="submit" className={`btn btn--primary btn--hero${large ? " btn--xl" : ""}`} disabled={disabled}>
        {buttonLabel}
      </button>
    </form>
  );
}
