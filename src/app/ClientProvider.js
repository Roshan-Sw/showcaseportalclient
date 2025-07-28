"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function ClientProvider({ children }) {
  return (
    <SessionProvider>
      <Toaster position="top-right" reverseOrder={true} />
      {children}
    </SessionProvider>
  );
}
