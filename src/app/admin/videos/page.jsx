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
  Chip,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";
import Select from "react-select";

const VideoFormPopup = dynamic(
  () => import("@/components/admin/video-form/VideoFormPopup"),
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

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [openTagModal, setOpenTagModal] = useState(false);
  const [selectedTagVideoId, setSelectedTagVideoId] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [videoTags, setVideoTags] = useState([]);
  const { data: session } = useSession();

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
      field: "video_url",
      headerName: "Video URL",
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
      field: "format",
      headerName: "Format",
      width: 150,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "thumbnail",
      headerName: "Thumbnail",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <img
            src={`${BASE_URL}/${params.value}`}
            alt="Thumbnail"
            className="h-10 w-10 mt-2 object-contain"
            onError={(e) => (e.target.src = "/fallback-image.png")}
          />
        ) : (
          <span>-</span>
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
          aria-label="Edit video"
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
          aria-label="Delete video"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(keyword && { keyword }),
      }).toString();

      const response = await fetch(`${BASE_URL}/api/videos/list?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }

      const data = await response.json();
      const records = (data.data?.videos || [])
        .filter((record) => record && typeof record === "object" && record.id)
        .map((record) => ({
          ...record,
          title: record.title || null,
          video_url: record.video_url || null,
          format: record.format || null,
          type: record.type || null,
          thumbnail: record.thumbnail || null,
          tags: record.tags || [],
          created_at: record.created_at || null,
          updated_at: record.updated_at || null,
        }));

      setVideos(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      setFetchError("Failed to load videos. Please try again.");
      setVideos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async (videoId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/tag-mappings/video/${videoId}`,
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

      setVideoTags(data.data?.tags || []);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      toast.error("Failed to load tags.", { position: "top-right" });
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [page, keyword]);

  const handleOpenAddDialog = () => {
    setEditVideo(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (video) => {
    setEditVideo(video);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditVideo(null);
  };

  const handleOpenDeletePopover = (event, video) => {
    setAnchorEl(event.currentTarget);
    setVideoToDelete(video);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setVideoToDelete(null);
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/videos/${videoToDelete.id}`,
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
        throw new Error(errorData.message || "Failed to delete video");
      }

      const data = await response.json();
      toast.success(data.message || "Video deleted successfully!", {
        position: "top-right",
      });

      await fetchVideos();
    } catch (error) {
      console.error("Failed to delete video:", error);
      setFetchError(
        error.message || "Failed to delete video. Please try again."
      );
      toast.error(error.message || "Failed to delete video.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTagModal = (video) => {
    setSelectedTagVideoId(video.id);
    setTagInput("");
    setVideoTags([]);
    fetchTags(video.id);
    setOpenTagModal(true);
  };

  const handleCloseTagModal = () => {
    setOpenTagModal(false);
    setSelectedTagVideoId(null);
    setTagInput("");
    setVideoTags([]);
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
        entity_type: "VIDEO",
        tag_name: tagInput.trim(),
        video_id: selectedTagVideoId,
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add tag");
      }

      toast.success(data.message || "Tag added successfully!", {
        position: "top-right",
      });
      setTagInput("");
      await fetchTags(selectedTagVideoId);
      await fetchVideos();
    } catch (error) {
      console.error("Failed to add tag:", error);
      toast.error(error.message || "Failed to add tag.", {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete tag");
      }

      toast.success(data.message || "Tag deleted successfully!", {
        position: "top-right",
      });
      await fetchTags(selectedTagVideoId);
      await fetchVideos();
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
    setEditVideo(null);
    fetchVideos();
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>No videos found</Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Videos ({total})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenAddDialog}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <span>+ Add Video</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Videos"
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
            rows={videos}
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

      <VideoFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        video={editVideo}
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
            <strong>{videoToDelete?.title || "this video"}</strong>?
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
              onClick={handleDeleteVideo}
              disabled={loading}
            >
              {loading ? <BeatLoader color="#15b89d" size={8} /> : "Delete"}
            </Button>
          </Box>
        </Box>
      </Popover>

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
            {videoTags.length > 0 ? (
              videoTags.map((tag) => (
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
                />
              ))
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
            disabled={loading}
          >
            {loading ? <BeatLoader color="#15b89d" size={8} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Videos;
