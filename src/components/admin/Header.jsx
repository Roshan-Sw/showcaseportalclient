"use client";

import Image from "next/image";
import { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header({ toggleSidebar, isSidebarOpen, isMobileView }) {
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleTogglePopup = () => {
    setIsLogoutPopupOpen(!isLogoutPopupOpen);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/signin");
  };

  return (
    <header className="fixed w-full bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            {isSidebarOpen && !isMobileView ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          <div className="flex items-center ml-4">
            <div className="h-8 w-8 rounded-full bg-[rgba(21,184,157,0.85)] flex items-center justify-center text-white font-semibold">
              SW
            </div>

            <h1 className="ml-2 pb-1 text-lg font-semibold text-gray-800 hidden md:block">
              SHOWCASE CRM
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <div className="relative">
            <button
              onClick={handleTogglePopup}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-[rgb(225,227,234)] flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo-sw.png"
                  alt="User Logo"
                  width={32}
                  height={32}
                  priority
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-700">
                  {session?.user?.name || "-"}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {session?.user?.email || "-"}
                </span>
              </div>
            </button>
            {isLogoutPopupOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-sm z-20">
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <FiLogOut className="w-5 h-5 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
