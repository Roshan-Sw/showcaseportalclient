"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import { BeatLoader } from "react-spinners";

export default function AdminDashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.accessToken) {
      console.log("No valid session token in layout, redirecting to /signin");
      router.replace("/signin");
    }
  }, [status, session, router]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <BeatLoader color="#2ac4ab" size={15} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin Dashboard" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isMobileView={isMobileView}
        />

        <div className="flex flex-1 pt-16">
          <Sidebar
            isOpen={isSidebarOpen}
            isMobileOpen={isMobileSidebarOpen}
            isMobileView={isMobileView}
            closeMobileSidebar={closeMobileSidebar}
          />

          <main
            className={`flex-1 bg-[#f8fafb] min-w-0 transition-all duration-300 ease-in-out ${
              isSidebarOpen && !isMobileView ? "md:ml-64" : "md:ml-20"
            }`}
          >
            <div className="p-2 md:p-4 overflow-auto">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
