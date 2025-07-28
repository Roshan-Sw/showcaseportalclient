"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const TechnologyFormPopup = dynamic(
  () => import("@/components/admin/technology-form/TechnologyFormPopup"),
  { ssr: false }
);

const Technologies = () => {
  const [technologies, setTechnologies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTechnology, setEditTechnology] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [technologyToDelete, setTechnologyToDelete] = useState(null);
  const { data: session } = useSession();

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "name",
      headerName: "Technology Name",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 150,
      renderCell: (params) => (
        <span>{new Date(params.value).toLocaleDateString() || "-"}</span>
      ),
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 150,
      renderCell: (params) => (
        <span>{new Date(params.value).toLocaleDateString() || "-"}</span>
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
          aria-label="Edit technology"
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={(event) => handleOpenDeletePopover(event, params.row)}
          aria-label="Delete technology"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditTechnology(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (technology) => {
    setEditTechnology(technology);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditTechnology(null);
  };

  const handleOpenDeletePopover = (event, technology) => {
    setAnchorEl(event.currentTarget);
    setTechnologyToDelete(technology);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setTechnologyToDelete(null);
  };

  const handleDeleteTechnology = async () => {
    if (!technologyToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/technologies/${technologyToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete technology");
      }

      const data = await response.json();
      toast.success(data.message || "Technology deleted successfully!", {
        position: "top-right",
      });

      await fetchTechnologies();
    } catch (error) {
      console.error("Failed to delete technology:", error);
      setFetchError(
        error.message || "Failed to delete technology. Please try again."
      );
      toast.error(error.message || "Failed to delete technology.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnologies = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(keyword && { keyword }),
      }).toString();

      const response = await fetch(`${BASE_URL}/api/technologies?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch technologies");
      }

      const data = await response.json();
      const records = (data.data?.technologies || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid technology entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          name: record.name || null,
          created_at: record.created_at || null,
          updated_at: record.updated_at || null,
        }));

      setTechnologies(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch technologies:", error);
      setFetchError("Failed to load technologies. Please try again.");
      setTechnologies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnologies();
  }, [page, keyword]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    if (field === "keyword") {
      setKeyword(value);
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditTechnology(null);
    fetchTechnologies();
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No technologies found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Technologies ({total})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenAddDialog}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <span>+ Add Technology</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Technologies"
          value={keyword}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
          className="border border-[rgba(21,184,157,0.85)] bg-white rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-[rgba(21,184,157,0.85)] focus:border-[rgba(21,184,157,0.85)] placeholder-gray-400"
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
            rows={technologies}
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

      <TechnologyFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        technology={editTechnology}
      />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseDeletePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, width: 260 }}>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete{" "}
            <strong>{technologyToDelete?.name || "this technology"}</strong>?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCloseDeletePopover}
              sx={{
                borderColor: "#ef5350",
                color: "#ef5350",
                "&:hover": { borderColor: "#e53935", color: "#e53935" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={handleDeleteTechnology}
              disabled={loading}
            >
              {loading ? <BeatLoader color="#15b89d" size={8} /> : "Delete"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </div>
  );
};

export default Technologies;
