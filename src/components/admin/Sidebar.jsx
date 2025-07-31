"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUsers, FaBuilding } from "react-icons/fa";
import {
  FiChevronDown,
  FiChevronRight,
  FiFolder,
  FiCpu,
  FiGlobe,
  FiVideo,
  FiPenTool,
} from "react-icons/fi";
import { FaUsersGear } from "react-icons/fa6";
import { useState } from "react";
import { Popover } from "@mui/material";

export default function Sidebar({
  isOpen,
  isMobileOpen,
  isMobileView,
  closeMobileSidebar,
}) {
  const pathname = usePathname();
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(true);

  const navItems = [
    {
      icon: <FaUsersGear className="w-6 h-6 flex-shrink-0" />,
      label: "User Management",
      path: "/admin/user-management",
      exact: false,
      isParent: true,
      children: [
        {
          icon: <FaUsers className="w-5 h-5 flex-shrink-0" />,
          label: "Users",
          path: "/admin/users",
          exact: false,
        },
      ],
    },
    {
      icon: <FaBuilding className="w-6 h-6 flex-shrink-0" />,
      label: "Clients",
      path: "/admin/clients",
      exact: false,
      isParent: false,
    },
    {
      icon: <FiFolder className="w-6 h-6 flex-shrink-0" />,
      label: "Projects",
      path: "/admin/projects",
      exact: false,
      isParent: false,
    },
    {
      icon: <FiCpu className="w-6 h-6 flex-shrink-0" />,
      label: "Technologies",
      path: "/admin/technologies",
      exact: false,
      isParent: false,
    },
    {
      icon: <FiGlobe className="w-6 h-6 flex-shrink-0" />,
      label: "Websites",
      path: "/admin/websites",
      exact: false,
      isParent: false,
    },
    {
      icon: <FiVideo className="w-6 h-6 flex-shrink-0" />,
      label: "Videos",
      path: "/admin/videos",
      exact: false,
      isParent: false,
    },
    {
      icon: <FiPenTool className="w-6 h-6 flex-shrink-0" />,
      label: "Creatives",
      path: "/admin/creatives",
      exact: false,
      isParent: false,
    },
  ];

  const isActive = (item) => {
    return pathname.startsWith(item.path);
  };

  const isUserManagementActive = () => {
    return pathname.startsWith("/admin/users");
  };

  const showContent =
    (!isMobileView && isOpen) || (isMobileView && isMobileOpen);

  const [anchorEl, setAnchorEl] = useState(null);
  const [hoveredParent, setHoveredParent] = useState(null);

  const handleUserManagementToggle = () => {
    setIsUserManagementOpen(!isUserManagementOpen);
  };

  const handleParentMouseEnter = (event, parentLabel) => {
    if (!showContent) {
      setAnchorEl(event.currentTarget);
      setHoveredParent(parentLabel);
    }
  };

  const handleParentMouseLeave = () => {
    if (!showContent) {
      setAnchorEl(null);
    }
  };

  const handlePopoverMouseEnter = () => {
    if (!showContent) {
      setAnchorEl(anchorEl);
    }
  };

  const handlePopoverMouseLeave = () => {
    if (!showContent) {
      setAnchorEl(null);
      setHoveredParent(null);
    }
  };

  const open = Boolean(anchorEl) && !showContent;

  return (
    <>
      {isMobileView && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`fixed h-[calc(100vh-4rem)] bg-white shadow-sm z-20 transition-all duration-300 ease-in-out ${
          isMobileView
            ? `${isMobileOpen ? "translate-x-0" : "-translate-x-full"} w-64`
            : `${isOpen ? "w-64" : "w-20"}`
        }`}
      >
        <div className="h-full overflow-y-auto py-4">
          <nav className="mt-2">
            <ul>
              {navItems.map((item, index) => (
                <li
                  key={index}
                  className="px-4 py-2"
                  onMouseLeave={
                    item.isParent ? handleParentMouseLeave : undefined
                  }
                >
                  <div className="relative">
                    {item.isParent ? (
                      <div
                        className={`flex items-center p-2 rounded-lg cursor-pointer ${
                          isActive(item) ||
                          (item.label === "User Management" &&
                            isUserManagementActive())
                            ? "bg-[rgba(21,184,157,0.85)] text-white"
                            : "text-gray-600 hover:bg-[rgba(21,184,157,0.08)]"
                        }`}
                        onClick={
                          showContent ? handleUserManagementToggle : undefined
                        }
                        onMouseEnter={(e) =>
                          handleParentMouseEnter(e, item.label)
                        }
                      >
                        {item.icon}
                        {showContent && (
                          <>
                            <span className="ml-3 whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                              {item.label}
                            </span>
                            {isUserManagementOpen ? (
                              <FiChevronDown className="w-4 h-4" />
                            ) : (
                              <FiChevronRight className="w-4 h-4" />
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.path}
                        className={`flex items-center p-2 rounded-lg cursor-pointer ${
                          isActive(item)
                            ? "bg-[rgba(21,184,157,0.85)] text-white"
                            : "text-gray-600 hover:bg-[rgba(21,184,157,0.08)]"
                        }`}
                        onClick={isMobileView ? closeMobileSidebar : undefined}
                      >
                        {item.icon}
                        {showContent && (
                          <span className="ml-3 whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    )}

                    {showContent && item.isParent && isUserManagementOpen && (
                      <ul className="ml-4 mt-2 space-y-1">
                        {item.children?.map((child, childIndex) => (
                          <li key={childIndex}>
                            <Link
                              href={child.path}
                              className={`flex items-center p-2 rounded-lg text-sm ${
                                isActive(child)
                                  ? "bg-[rgba(21,184,157,0.85)] text-white"
                                  : "text-gray-600 hover:bg-[rgba(21,184,157,0.08)]"
                              }`}
                              onClick={
                                isMobileView ? closeMobileSidebar : undefined
                              }
                            >
                              {child.icon}
                              <span className="ml-3 whitespace-nowrap overflow-hidden overflow-ellipsis">
                                {child.label}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        disableRestoreFocus
        sx={{
          pointerEvents: "none",
          "& .MuiPopover-paper": {
            pointerEvents: "auto",
            marginLeft: "8px",
            minWidth: "192px",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
          },
        }}
        slotProps={{
          paper: {
            onMouseEnter: handlePopoverMouseEnter,
            onMouseLeave: handlePopoverMouseLeave,
          },
        }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2">
          <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
            {hoveredParent}
          </div>
          {navItems
            .find((item) => item.label === hoveredParent)
            ?.children?.map((child, childIndex) => (
              <Link
                key={childIndex}
                href={child.path}
                className={`flex items-center px-3 py-2 text-sm ${
                  isActive(child)
                    ? "bg-[rgba(21,184,157,0.85)] text-white"
                    : "text-gray-600"
                }`}
                onClick={isMobileView ? closeMobileSidebar : undefined}
              >
                {child.icon}
                <span className="ml-3">{child.label}</span>
              </Link>
            ))}
        </div>
      </Popover>
    </>
  );
}
