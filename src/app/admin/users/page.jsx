"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdSync } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Paper } from "@mui/material";
import Select from "react-select";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { BASE_URL, BASE_AUTH_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const UserFormPopup = dynamic(
  () => import("@/components/admin/user-form/UserFormPopup"),
  { ssr: false }
);

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: `1px solid rgba(21,184,157,0.85)`,
    boxShadow: state.isFocused ? "0 0 0 1.5px rgba(21,184,157,0.85)" : "none",
    backgroundColor: "white",
    borderRadius: "4px",
    minHeight: "40px",
    "&:hover": {
      border: `1px solid rgba(21,184,157,0.85)`,
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "rgba(21,184,157,0.85)"
      : state.isFocused
      ? "rgba(21,184,157,0.12)"
      : "white",
    color: state.isSelected ? "white" : "black",
    "&:hover": {
      backgroundColor: state.isSelected
        ? "rgba(21,184,157,0.85)"
        : "rgba(21,184,157,0.12)",
    },
  }),
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const { data: session } = useSession();

  const roleOptions = [
    { value: "STANDARD_USER", label: "Standard User" },
    { value: "HR_ASSISTANT", label: "HR Assistant" },
    { value: "HR_HEAD", label: "HR Head" },
    { value: "NO_ACCESS", label: "No Access" },
  ];

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
        <span>
          {params.row.first_name || params.row.last_name
            ? `${params.row.first_name || ""} ${
                params.row.last_name || ""
              }`.trim()
            : "-"}
        </span>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      renderCell: (params) => (
        <span>
          {params.value
            ? params.value
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "-"}
        </span>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit user"
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
  ];

  const handleOpenEditDialog = (user) => {
    setEditUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditUser(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditUser(null);
    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(keyword && { keyword }),
        ...(role && { role }),
      }).toString();

      const response = await fetch(`${BASE_URL}/api/users/list?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const records = (data.data?.users || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid user entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          first_name: record.first_name || null,
          last_name: record.last_name || null,
          email: record.email || null,
          phone: record.phone || null,
          role: record.role || null,
        }));

      setUsers(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setFetchError("Failed to load users. Please try again.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, keyword, role]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    switch (field) {
      case "keyword":
        setKeyword(value);
        break;
      case "role":
        setRole(value);
        break;
    }
  };

  const handleSyncUsers = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const authResponse = await fetch(
        `${BASE_AUTH_URL}/api/user-auth/fetch-all`
      );

      if (!authResponse.ok) {
        throw new Error("Failed to fetch users from auth service");
      }
      const authUsers = await authResponse.json();

      const transformedUsers = (authUsers.data || authUsers).map((user) => {
        let first_name = null;
        let last_name = null;
        if (user.name) {
          const nameParts = user.name.trim().split(" ");
          first_name = nameParts[0] || null;
          last_name =
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
        }

        return {
          id: parseInt(user.id, 10),
          first_name,
          last_name,
          email: user.email || null,
          phone: user.phone || null,
        };
      });

      const syncResponse = await fetch(`${BASE_URL}/api/users/syncing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: transformedUsers }),
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.message || "Failed to sync users");
      }

      const syncData = await syncResponse.json();
      toast.success(syncData.message || "Users synced successfully!", {
        position: "top-right",
      });

      await fetchUsers();
    } catch (error) {
      console.error("Failed to sync users:", error);
      setFetchError("Failed to sync users. Please try again.");
      toast.error(error.message || "Failed to sync users.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>No users found</Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Users ({total})</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSyncUsers}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
            disabled={loading}
          >
            <MdSync className="w-5 h-5" />
            <span>Sync Users</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Users"
          value={keyword}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
          className="border border-[rgba(21,184,157,0.85)] bg-white rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-[rgba(21,184,157,0.85)] focus:border-[rgba(21,184,157,0.85)] placeholder-gray-400"
        />
        <Select
          options={roleOptions}
          value={roleOptions.find((opt) => opt.value === role) || null}
          onChange={(selected) =>
            handleFilterChange("role", selected ? selected.value : null)
          }
          placeholder="Role"
          styles={customSelectStyles}
          className="w-full md:w-1/5"
          isClearable
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#15b89d" height={50} width={5} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <Paper sx={{ width: "100%", boxShadow: "none" }}>
          <DataGrid
            rows={users}
            getRowId={(row) => row.id}
            columns={columns}
            autoHeight
            initialState={{
              pagination: { paginationModel: { page, pageSize: limit } },
            }}
            pagination
            paginationMode="server"
            rowCount={total}
            onPaginationModelChange={(newModel) => setPage(newModel.page)}
            pageSizeOptions={[]}
            sx={{
              border: 0,
              boxShadow: "none",
              "& .MuiDataGrid-row.Mui-selected": {
                backgroundColor: "rgba(21,184,157,0.12)",
                color: "inherit",
                "&:hover": {
                  backgroundColor: "rgba(21,184,157,0.12)",
                },
              },
              "& .MuiDataGrid-cell": {
                border: "none",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "none",
                borderBottom: "none",
              },
              "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader--sorted":
                {
                  outline: "none",
                },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell--sorted":
                {
                  outline: "none",
                },
            }}
            slots={{
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            slotProps={{
              pagination: {
                showrowsperpage: "false",
              },
            }}
          />
        </Paper>
      )}

      <UserFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        user={editUser}
      />
    </div>
  );
};

export default Users;
