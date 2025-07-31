"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Popover,
  Typography,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";
import Select from "react-select";

const WebsiteFormPopup = dynamic(
  () => import("@/components/admin/website-form/WebsiteFormPopup"),
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

const Websites = () => {
  const [websites, setWebsites] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editWebsite, setEditWebsite] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);
  const [openTechModal, setOpenTechModal] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState(null);
  const [technologies, setTechnologies] = useState([]);
  const [selectedTechIds, setSelectedTechIds] = useState([]);
  const [currentTechs, setCurrentTechs] = useState([]);
  const [openTagModal, setOpenTagModal] = useState(false);
  const [selectedTagWebsiteId, setSelectedTagWebsiteId] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [websiteTags, setWebsiteTags] = useState([]);
  const [editTagId, setEditTagId] = useState(null);
  const [editTagInput, setEditTagInput] = useState("");
  const { data: session } = useSession();

  const technologyOptions = technologies.map((tech) => ({
    value: tech.id,
    label: tech.name,
  }));

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "title",
      headerName: "Title",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "url",
      headerName: "URL",
      width: 200,
      renderCell: (params) => (
        <a
          href={params.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-900"
        >
          {params.value || "-"}
        </a>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "thumbnail_presigned_url",
      headerName: "Thumbnail",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <img
            src={`${params.value}`}
            alt="Thumbnail"
            className="h-10 w-10 mt-2 object-contain"
            onError={(e) => (e.target.src = "/fallback-image.png")}
          />
        ) : (
          <span>-</span>
        ),
    },
    {
      field: "technologies",
      headerName: "Technologies",
      width: 200,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenTechModal(params.row)}
          className="text-gray-900 underline"
        >
          Assign Technologies
        </button>
      ),
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 200,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenTagModal(params.row)}
          className="text-gray-900 underline"
        >
          Add Tags
        </button>
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
          aria-label="Edit website"
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
          aria-label="Delete website"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(keyword && { keyword }),
      }).toString();

      const response = await fetch(`${BASE_URL}/api/websites/list?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch websites");
      }

      const data = await response.json();
      const records = (data.data?.websites || [])
        .filter((record) => record && typeof record === "object" && record.id)
        .map((record) => ({
          ...record,
          title: record.title || null,
          url: record.url || null,
          type: record.type || null,
          technologies: record.technologies || [],
          tags: record.tags || [],
          created_at: record.created_at || null,
          updated_at: record.updated_at || null,
        }));

      setWebsites(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch websites:", error);
      setFetchError("Failed to load websites. Please try again.");
      setWebsites([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnologies = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/technologies?page=1&limit=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch technologies");
      }

      const data = await response.json();
      setTechnologies(data.data?.technologies || []);
    } catch (error) {
      console.error("Failed to fetch technologies:", error);
      toast.error("Failed to load technologies.", { position: "top-right" });
    }
  };

  const fetchTags = async (websiteId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/tag-mappings/website/${websiteId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

      const data = await response.json();
      setWebsiteTags(data.data?.tags || []);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      toast.error("Failed to load tags.", { position: "top-right" });
    }
  };

  useEffect(() => {
    fetchWebsites();
    fetchTechnologies();
  }, [page, keyword]);

  const handleOpenAddDialog = () => {
    setEditWebsite(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (website) => {
    setEditWebsite(website);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditWebsite(null);
  };

  const handleOpenDeletePopover = (event, website) => {
    setAnchorEl(event.currentTarget);
    setWebsiteToDelete(website);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setWebsiteToDelete(null);
  };

  const handleDeleteWebsite = async () => {
    if (!websiteToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/websites/${websiteToDelete.id}`,
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
        throw new Error(errorData.message || "Failed to delete website");
      }

      const data = await response.json();
      toast.success(data.message || "Website deleted successfully!", {
        position: "top-right",
      });

      await fetchWebsites();
    } catch (error) {
      console.error("Failed to delete website:", error);
      setFetchError(
        error.message || "Failed to delete website. Please try again."
      );
      toast.error(error.message || "Failed to delete website.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTechModal = (website) => {
    setSelectedWebsiteId(website.id);

    setCurrentTechs(
      Array.isArray(website.technologies)
        ? website.technologies.map((t) => t.technology)
        : []
    );
    setSelectedTechIds(
      Array.isArray(website.technologies)
        ? website.technologies.map((t) => t.technology.id)
        : []
    );
    setOpenTechModal(true);
  };

  const handleCloseTechModal = () => {
    setOpenTechModal(false);
    setSelectedWebsiteId(null);
    setSelectedTechIds([]);
    setCurrentTechs([]);
  };

  const handleUpdateTechnologies = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id ? Number(session.user.id) : null;
      if (!userId) throw new Error("User ID not found in session");

      const payload = {
        technology_ids: selectedTechIds,
        created_by: userId,
        updated_by: userId,
      };

      const response = await fetch(
        `${BASE_URL}/api/websites/${selectedWebsiteId}/technology-mappings`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update technologies");
      }

      const data = await response.json();
      toast.success(data.message || "Technologies updated successfully!", {
        position: "top-right",
      });
      handleCloseTechModal();
      await fetchWebsites();
    } catch (error) {
      console.error("Failed to update technologies:", error);
      toast.error(error.message || "Failed to update technologies.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTagModal = (website) => {
    setSelectedTagWebsiteId(website.id);
    setTagInput("");
    setWebsiteTags([]);
    setEditTagId(null);
    setEditTagInput("");
    fetchTags(website.id);
    setOpenTagModal(true);
  };

  const handleCloseTagModal = () => {
    setOpenTagModal(false);
    setSelectedTagWebsiteId(null);
    setTagInput("");
    setWebsiteTags([]);
    setEditTagId(null);
    setEditTagInput("");
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) {
      toast.error("Tag name cannot be empty.", { position: "top-right" });
      return;
    }

    try {
      setLoading(true);
      const userId = session?.user?.id ? Number(session.user.id) : null;
      if (!userId) throw new Error("User ID not found in session");

      const payload = {
        entity_type: "WEBSITE",
        website_id: selectedTagWebsiteId,
        tag_name: tagInput.trim(),
        created_by: userId,
        updated_by: userId,
      };

      const response = await fetch(`${BASE_URL}/api/tag-mappings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add tag");
      }

      toast.success("Tag added successfully!", { position: "top-right" });
      setTagInput("");
      await fetchTags(selectedTagWebsiteId);
      await fetchWebsites();
    } catch (error) {
      console.error("Failed to add tag:", error);
      toast.error(error.message || "Failed to add tag.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTag = (tag) => {
    setEditTagId(tag.id);
    setEditTagInput(tag.tag_name);
  };

  const handleCancelEditTag = () => {
    setEditTagId(null);
    setEditTagInput("");
  };

  const handleUpdateTag = async () => {
    if (!editTagInput.trim()) {
      toast.error("Tag name cannot be empty.", { position: "top-right" });
      return;
    }
    try {
      setLoading(true);
      const userId = session?.user?.id ? Number(session.user.id) : null;
      if (!userId) throw new Error("User ID not found in session");

      const payload = {
        tag_name: editTagInput.trim(),
        updated_by: userId,
      };

      const response = await fetch(
        `${BASE_URL}/api/tag-mappings/${editTagId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update tag");
      }

      toast.success("Tag updated successfully!", { position: "top-right" });
      setEditTagId(null);
      setEditTagInput("");
      await fetchTags(selectedTagWebsiteId);
      await fetchWebsites();
    } catch (error) {
      console.error("Failed to update tag:", error);
      toast.error(error.message || "Failed to update tag.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/tag-mappings/${tagId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete tag");
      }

      toast.success("Tag deleted successfully!", { position: "top-right" });
      await fetchTags(selectedTagWebsiteId);
      await fetchWebsites();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error(error.message || "Failed to delete tag.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setPage(0);
    if (field === "keyword") {
      setKeyword(value);
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditWebsite(null);
    fetchWebsites();
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No websites found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Websites ({total})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenAddDialog}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <span>+ Add Website</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Websites"
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
            rows={websites}
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

      <WebsiteFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        website={editWebsite}
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
            <strong>{websiteToDelete?.title || "this website"}</strong>?
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
              onClick={handleDeleteWebsite}
              disabled={loading}
            >
              {loading ? <BeatLoader color="#15b89d" size={8} /> : "Delete"}
            </Button>
          </Box>
        </Box>
      </Popover>

      <Dialog
        open={openTechModal}
        onClose={handleCloseTechModal}
        sx={{
          "& .MuiDialog-paper": {
            width: "min(100%, 500px)",
            maxWidth: "500px",
            padding: "16px",
            borderRadius: "8px",
            minHeight: "400px",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">
          Manage Technologies
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Existing Technologies
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {currentTechs && currentTechs.length > 0 ? (
              currentTechs.map((tech) => (
                <Chip
                  key={tech.id}
                  label={tech.name}
                  sx={{
                    backgroundColor: "rgba(21,184,157,0.12)",
                    color: "text.primary",
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No technologies assigned
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            Assign Technologies
          </Typography>
          <Select
            isMulti
            options={technologyOptions}
            value={technologyOptions.filter((opt) =>
              selectedTechIds.includes(opt.value)
            )}
            onChange={(selected) =>
              setSelectedTechIds(selected.map((opt) => opt.value))
            }
            placeholder="Select Technologies"
            styles={customSelectStyles}
            className="mt-2"
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseTechModal}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTechnologies}
            sx={{
              backgroundColor: "rgba(21,184,157,0.85)",
              color: "white",
              border: "1px solid rgba(21,184,157,0.85)",
              "&:hover": { backgroundColor: "rgba(17,150,128)" },
              padding: "8px 16px",
              borderRadius: "8px",
              boxShadow: "none",
            }}
            disabled={loading}
          >
            {loading ? <BeatLoader color="#15b89d" size={8} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openTagModal}
        onClose={handleCloseTagModal}
        sx={{
          "& .MuiDialog-paper": {
            width: "min(100%, 450px)",
            maxWidth: "450px",
            padding: "16px",
            borderRadius: "8px",
            minHeight: "300px",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">Manage Tags</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Existing Tags
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {websiteTags.length > 0 ? (
              websiteTags.map((tag) =>
                editTagId === tag.id ? (
                  <Box
                    key={tag.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      backgroundColor: "rgba(21,184,157,0.12)",
                      borderRadius: "16px",
                      px: 1,
                    }}
                  >
                    <TextField
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "rgba(21,184,157,0.85)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(21,184,157,0.85)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "rgba(21,184,157,0.85)",
                            borderWidth: 2,
                          },
                        },
                        minWidth: 120,
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={handleUpdateTag}
                      size="small"
                      sx={{
                        color: "white",
                        backgroundColor: "rgba(21,184,157,0.85)",
                        minWidth: 0,
                        px: 1.5,
                        "&:hover": { backgroundColor: "rgba(17,150,128)" },
                      }}
                      disabled={loading}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEditTag}
                      size="small"
                      sx={{
                        color: "#ef5350",
                        backgroundColor: "#ffebee",
                        minWidth: 0,
                        px: 1.5,
                        "&:hover": { backgroundColor: "#ffcdd2" },
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Chip
                    key={tag.id}
                    label={tag.tag_name}
                    onDelete={() => handleDeleteTag(tag.id)}
                    deleteIcon={<MdDelete />}
                    sx={{
                      backgroundColor: "rgba(21,184,157,0.12)",
                      color: "text.primary",
                      "& .MuiChip-deleteIcon": {
                        color: "#ef5350",
                        "&:hover": { color: "#e53935" },
                      },
                    }}
                    onClick={() => handleEditTag(tag)}
                  />
                )
              )
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No tags assigned
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            Add New Tag
          </Typography>
          <TextField
            fullWidth
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter tag name"
            variant="outlined"
            size="small"
            sx={{
              mt: 2,
              backgroundColor: "white",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(21,184,157,0.85)" },
                "&:hover fieldset": {
                  borderColor: "rgba(21,184,157,0.85)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(21,184,157,0.85)",
                  borderWidth: 2,
                },
              },
            }}
            disabled={!!editTagId}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseTagModal}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddTag}
            sx={{
              backgroundColor: "rgba(21,184,157,0.85)",
              color: "white",
              border: "1px solid rgba(21,184,157,0.85)",
              "&:hover": { backgroundColor: "rgba(17,150,128)" },
              padding: "8px 16px",
              borderRadius: "8px",
              boxShadow: "none",
            }}
            disabled={loading || !!editTagId}
          >
            {loading && !editTagId ? (
              <BeatLoader color="#15b89d" size={8} />
            ) : (
              "Submit"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Websites;
