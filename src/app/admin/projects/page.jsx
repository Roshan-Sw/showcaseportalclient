"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdSync } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";
import Select from "react-select";

const ProjectFormPopup = dynamic(
  () => import("@/components/admin/project-form/ProjectFormPopup"),
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

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [keyword, setKeyword] = useState("");
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const { data: session } = useSession();

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "client_id",
      headerName: "Client Name",
      width: 200,
      renderCell: (params) => {
        const client = clients.find((c) => c.id === params.value);
        return <span>{client ? client.client_name : params.value || "-"}</span>;
      },
    },
    {
      field: "project_name",
      headerName: "Project Name",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      renderCell: (params) => <span>{params.value || 0}</span>,
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit project"
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
  ];

  const handleOpenEditDialog = (project) => {
    setEditProject(project);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditProject(null);
  };

  const fetchClients = async () => {
    try {
      const query = new URLSearchParams({
        page: "1",
        limit: "10000",
      }).toString();

      const response = await fetch(`${BASE_URL}/api/clients/list?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      const data = await response.json();
      const records = (data.data?.clients || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid client entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          client_name: record.client_name || null,
        }));

      setClients(records);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(keyword && { keyword }),
        ...(clientId && { client_id: clientId }),
      }).toString();

      const response = await fetch(`${BASE_URL}/api/projects/list?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      const records = (data.data?.projects || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid project entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          client_id: record.client_id || null,
          project_name: record.project_name || null,
          description: record.description || null,
          priority: record.priority || 0,
        }));

      setProjects(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setFetchError("Failed to load projects. Please try again.");
      setProjects([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchClients();
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchProjects();
    }
  }, [page, keyword, clientId, session?.accessToken]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    switch (field) {
      case "keyword":
        setKeyword(value);
        break;
      case "clientId":
        setClientId(value);
        break;
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditProject(null);
    fetchProjects();
  };

  const handleSyncProjects = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const apiResponse = await fetch(
        "https://api.work.spiderworks.org/api/projects",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!apiResponse.ok) {
        throw new Error("Failed to fetch projects from external API");
      }

      const apiData = await apiResponse.json();
      const externalProjects = apiData.data || [];

      const projectsToSync = externalProjects
        .filter((project) => {
          if (!project.id || !project.projectName) {
            console.warn("Invalid project entry:", project);
            return false;
          }
          return true;
        })
        .map((project) => {
          let startdate = null;
          if (project.startDate) {
            const [day, month, year] = project.startDate.split("-");
            if (day && month && year) {
              startdate = `${year}-${month.padStart(2, "0")}-${day.padStart(
                2,
                "0"
              )}`;
            }
          }

          return {
            id: Number(project.id),
            clientId:
              project.clientId !== null ? Number(project.clientId) : null,
            projectName: project.projectName,
            description: project.description || null,
            priority: project.priority || 0,
            startdate: startdate,
            scopes: project.scopes || [],
          };
        });

      if (projectsToSync.length === 0) {
        throw new Error("No valid projects to sync");
      }

      const syncResponse = await fetch(`${BASE_URL}/api/projects/syncing`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projects: projectsToSync }),
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.message || "Failed to sync projects");
      }

      const syncData = await syncResponse.json();
      toast.success(syncData.message || "Projects synced successfully!", {
        position: "top-right",
      });

      await fetchProjects();
    } catch (error) {
      console.error("Failed to sync projects:", error);
      setFetchError(
        error.message || "Failed to sync projects. Please try again."
      );
      toast.error(error.message || "Failed to sync projects.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No projects found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Projects ({total})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSyncProjects}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
            disabled={loading}
          >
            <MdSync className="w-5 h-5" />
            <span>Sync Projects</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Projects"
          value={keyword}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
          className="border border-[rgba(21,184,157,0.85)] bg-white rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-[rgba(21,184,157,0.85)] focus:border-[rgba(21,184,157,0.85)] placeholder-gray-400"
        />
        <Select
          options={clients.map((client) => ({
            value: client.id,
            label: client.client_name,
          }))}
          value={
            clients.find((client) => client.id === Number(clientId))
              ? {
                  value: Number(clientId),
                  label: clients.find(
                    (client) => client.id === Number(clientId)
                  ).client_name,
                }
              : null
          }
          onChange={(selected) =>
            handleFilterChange("clientId", selected ? selected.value : "")
          }
          placeholder="Select Client"
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
            rows={projects}
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

      <ProjectFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        project={editProject}
      />
    </div>
  );
};

export default Projects;
