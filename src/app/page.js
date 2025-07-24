"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BeatLoader } from "react-spinners";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.accessToken) {
      console.log("No valid session token, redirecting to /signin");
      router.replace("/signin");
    } else {
      console.log("Valid session token found, redirecting to /admin");
      router.replace("/admin");
    }
  }, [status, session, router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <BeatLoader color="#2ac4ab" size={15} />
    </div>
  );
}
