"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const errorMessages: Record<string, { title: string; message: string }> = {
  Configuration: {
    title: "Server configuration error",
    message: "There's a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access denied",
    message: "You don't have permission to access this resource.",
  },
  Verification: {
    title: "Verification failed",
    message: "The verification link is invalid or has expired.",
  },
  Default: {
    title: "Authentication error",
    message: "Something went wrong during authentication. Please try again.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">{errorInfo.title}</h1>
          <p className="text-muted-foreground mb-6">{errorInfo.message}</p>
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Back to sign in
            </Link>
            <Link
              href="/"
              className="block w-full py-2 px-4 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
