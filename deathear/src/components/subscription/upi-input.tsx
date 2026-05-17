"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface UpiInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const UPI_REGEX = /^[a-zA-Z0-9.-]{2,}@[a-zA-Z]{2,}$/;

export function UpiInput({ value, onChange, error }: UpiInputProps) {
  const [touched, setTouched] = useState(false);

  const isValid = value ? UPI_REGEX.test(value) : true;
  const showError = touched && !isValid && value.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor="upi-id">UPI ID</Label>
      <Input
        id="upi-id"
        type="text"
        placeholder="e.g., user@paytm or user@upi"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={showError || error ? "border-destructive" : ""}
      />
      {showError && (
        <p className="text-sm text-destructive">
          Please enter a valid UPI ID (e.g., username@paytm)
        </p>
      )}
      {error && !showError && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Your UPI ID is used to set up recurring payments via UPI AutoPay (eMandate).
        You&apos;ll authorize the mandate on your UPI app.
      </p>
    </div>
  );
}
