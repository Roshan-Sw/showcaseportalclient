"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { FaUsers, FaShieldAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import { Popover } from "@mui/material";

export default function Sidebar({
  isOpen,
  isMobileOpen,
  isMobileView,
  closeMobileSidebar,
}) {
  const pathname = usePathname();
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const navItems = [
    {
      icon: <FaUsers className="w-6 h-6 flex-shrink-0" />,
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
        {
          icon: <FaShieldAlt className="w-5 h-5 flex-shrink-0" />,
          label: "Access Management",
          path: "/admin/employee-permissions",
          exact: false,
        },
      ],
    },
  ];

  const isActive = (item) => {
    return pathname.startsWith(item.path);
  };

  const isUserManagementActive = () => {
    const userManagementPaths = ["/admin/users", "/admin/employee-permissions"];
    return userManagementPaths.some((path) => pathname.startsWith(path));
  };

  const showContent =
    (!isMobileView && isOpen) || (isMobileView && isMobileOpen);

  const [anchorEl, setAnchorEl] = useState(null);
  const [hoveredParent, setHoveredParent] = useState(null);

  useEffect(() => {
    if (isUserManagementActive()) {
      setIsUserManagementOpen(true);
    } else {
      setIsUserManagementOpen(false);
    }
  }, [pathname]);

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
      setHoveredParent(null);
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
                  onMouseLeave={handleParentMouseLeave}
                >
                  <div className="relative">
                    <div
                      className={`flex items-center p-2 rounded-lg cursor-pointer ${
                        isUserManagementActive()
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

                    {showContent && isUserManagementOpen && (
                      <ul className="ml-4 mt-2 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <li key={childIndex}>
                            <Link
                              href={child.path}
                              className={`flex items-center p-2 rounded-lg text-sm ${
                                isActive(child)
                                  ? "bg-[rgba(21,184,157,0.85)] text-white"
                                  : "text-gray-600 hover:bg-[rgba(21,184,157,0.08)]"
                              }`}
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
            ?.children.map((child, childIndex) => (
              <Link
                key={childIndex}
                href={child.path}
                className={`flex items-center px-3 py-2 text-sm ${
                  isActive(child)
                    ? "bg-[rgba(21,184,157,0.85)] text-white"
                    : "text-gray-600"
                }`}
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
