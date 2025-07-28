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

const ClientFormPopup = dynamic(
  () => import("@/components/admin/client-form/ClientFormPopup"),
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

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [countries, setCountries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [keyword, setKeyword] = useState("");
  const [countryId, setCountryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const { data: session } = useSession();

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "client_name",
      headerName: "Client Name",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "country_id",
      headerName: "Country ID",
      width: 120,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "thumbnail",
      headerName: "Thumbnail",
      width: 150,
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
          aria-label="Edit client"
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
  ];

  const handleOpenEditDialog = (client) => {
    setEditClient(client);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditClient(null);
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch(
        "https://api.accounts.spiderworks.org/api/countries",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch countries");
      }

      const data = await response.json();

      if (data.status === "success" && data.data) {
        setCountries(data.data?.data);
      } else {
        console.error("Failed to fetch countries:", data.message);
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(keyword && { keyword }),
        ...(countryId && { country_id: countryId }),
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
          country_id: record.country_id || null,
          description: record.description || null,
          thumbnail: record.thumbnail || null,
          priority: record.priority || 0,
        }));

      setClients(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setFetchError("Failed to load clients. Please try again.");
      setClients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchCountries();
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchClients();
  }, [page, keyword, countryId]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    switch (field) {
      case "keyword":
        setKeyword(value);
        break;
      case "countryId":
        setCountryId(value);
        break;
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditClient(null);
    fetchClients();
  };

  const handleSyncClients = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const externalResponse = await fetch(
        "https://api.work.spiderworks.org/api/client",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!externalResponse.ok) {
        throw new Error("Failed to fetch clients from external API");
      }

      const externalData = await externalResponse.json();

      if (!externalData.success) {
        throw new Error(
          externalData.message || "Failed to fetch clients from external API"
        );
      }

      const clientsToSync = externalData.data.map((client) => ({
        id: parseInt(client.id, 10),
        client_name: client.clientName,
        country_id:
          client.countryId !== undefined &&
          client.countryId !== null &&
          client.countryId !== ""
            ? Number(client.countryId)
            : client.countryId,
        description: client.description,
        thumbnail: client.thumbnail,
        priority: 0,
        project_name:
          Array.isArray(client.projects) && client.projects.length > 0
            ? client.projects[0].projectName
            : null,
      }));

      const syncResponse = await fetch(`${BASE_URL}/api/clients/syncing`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clients: clientsToSync }),
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.message || "Failed to sync clients");
      }

      const syncData = await syncResponse.json();
      toast.success(syncData.message || "Clients synced successfully!", {
        position: "top-right",
      });

      await fetchClients();
    } catch (error) {
      console.error("Failed to sync clients:", error);
      setFetchError("Failed to sync clients. Please try again.");
      toast.error(error.message || "Failed to sync clients.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No clients found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Clients ({total})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSyncClients}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
            disabled={loading}
          >
            <MdSync className="w-5 h-5" />
            <span>Sync Clients</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Clients"
          value={keyword}
          onChange={(e) => handleFilterChange("keyword", e.target.value)}
          className="border border-[rgba(21,184,157,0.85)] bg-white rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-[rgba(21,184,157,0.85)] focus:border-[rgba(21,184,157,0.85)] placeholder-gray-400"
        />
        <Select
          options={countries.map((country) => ({
            value: country.id,
            label: country.name,
          }))}
          value={
            countries.find((country) => country.id === countryId)
              ? {
                  value: countryId,
                  label: countries.find((country) => country.id === countryId)
                    .name,
                }
              : null
          }
          onChange={(selected) =>
            handleFilterChange("countryId", selected ? selected.value : "")
          }
          placeholder="Select Country"
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
            rows={clients}
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

      <ClientFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        client={editClient}
      />
    </div>
  );
};

export default Clients;
