"use client";

import React from "react";
import { AppStoreProvider } from "./_state/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}
