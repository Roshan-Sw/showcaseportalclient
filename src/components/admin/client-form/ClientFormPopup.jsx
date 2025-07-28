"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from "@mui/material";
import Slide from "@mui/material/Slide";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const createValidationSchema = yup.object().shape({
  id: yup.number().required("ID is required").typeError("ID must be a number"),
  client_name: yup
    .string()
    .required("Client Name is required")
    .trim()
    .min(1, "Client Name cannot be empty"),
  country_id: yup
    .number()
    .required("Country ID is required")
    .typeError("Country ID must be a number"),
  description: yup.string().nullable().trim(),
  thumbnail: yup.string().nullable().trim(),
  priority: yup
    .number()
    .nullable()
    .typeError("Priority must be a number")
    .default(0),
});

const editValidationSchema = yup.object().shape({
  priority: yup
    .number()
    .required("Priority is required")
    .typeError("Priority must be a number"),
  description1: yup.string().nullable().trim(),
});

const ClientFormPopup = ({ open, onClose, onSuccess, client }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id: null,
      client_name: null,
      country_id: null,
      description: null,
      thumbnail: null,
      priority: 0,
      description1: null,
    },
    resolver: yupResolver(
      client ? editValidationSchema : createValidationSchema
    ),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({
        id: null,
        client_name: null,
        country_id: null,
        description: null,
        thumbnail: null,
        priority: 0,
        description1: null,
      });
      setError(null);
      return;
    }

    if (client) {
      reset({
        id: client.id,
        client_name: client.client_name || null,
        country_id: client.country_id || null,
        description: client.description || null,
        thumbnail: client.thumbnail || null,
        priority: client.priority || 0,
        description1: client.description1 || "",
      });
    } else {
      reset({
        id: null,
        client_name: null,
        country_id: null,
        description: null,
        thumbnail: null,
        priority: 0,
        description1: null,
      });
    }
  }, [client, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const isEdit = !!client;

      if (!isEdit) {
        const payload = {
          id: Number(formData.id),
          client_name: formData.client_name?.trim() || null,
          country_id: Number(formData.country_id),
          description: formData.description?.trim() || null,
          thumbnail: formData.thumbnail?.trim() || null,
          priority: formData.priority ? Number(formData.priority) : 0,
        };

        const response = await fetch(`${BASE_URL}/api/clients/create`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create client");
        }

        const data = await response.json();
        toast.success(data.message || "Client created successfully!", {
          position: "top-right",
        });
        onSuccess();
        onClose();
      } else {
        const url = `${BASE_URL}/api/clients/update/${client.id}`;
        const payload = {
          priority: Number(formData.priority),
          description1: formData.description1?.trim() || "",
        };
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update client");
        }
        const data = await response.json();
        toast.success(data.message || "Client updated successfully!", {
          position: "top-right",
        });
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(`Error ${client ? "updating" : "creating"} client:`, err);
      setError(
        err.message || `Failed to ${client ? "update" : "create"} client`
      );
      toast.error(
        err.message || `Failed to ${client ? "update" : "create"} client.`,
        { position: "top-right" }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      transitionDuration={500}
      sx={{
        "& .MuiDialog-paper": {
          margin: 0,
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: { xs: "100%", sm: "min(100%, 500px)" },
          maxWidth: "500px",
          height: "100%",
          borderRadius: 0,
          maxHeight: "100%",
        },
      }}
    >
      <DialogTitle className="text-lg font-semibold">
        {client ? "Edit Client" : "Add Client"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">ID {client ? "" : "*"}</label>
            <Controller
              name="id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  error={!!errors.id}
                  helperText={errors.id?.message}
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
                  }}
                  disabled={!!client}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">
              Client Name {client ? "" : "*"}
            </label>
            <Controller
              name="client_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!!errors.client_name}
                  helperText={errors.client_name?.message}
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
                  }}
                  disabled={!!client}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Country ID {client ? "" : "*"}</label>
            <Controller
              name="country_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  error={!!errors.country_id}
                  helperText={errors.country_id?.message}
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
                  }}
                  disabled={!!client}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
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
                  }}
                  disabled={!!client}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Thumbnail</label>
            <Controller
              name="thumbnail"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!!errors.thumbnail}
                  helperText={errors.thumbnail?.message}
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
                  }}
                  disabled={!!client}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Priority {client ? "*" : ""}</label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  error={!!errors.priority}
                  helperText={errors.priority?.message}
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
                  }}
                />
              )}
            />
          </Box>
          {client && (
            <Box>
              <label className="block mb-1">Description 1</label>
              <Controller
                name="description1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    error={!!errors.description1}
                    helperText={errors.description1?.message}
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
                    }}
                  />
                )}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            backgroundColor: "#ffebee",
            color: "#ef5350",
            "&:hover": { backgroundColor: "#ffcdd2" },
            padding: "8px 16px",
            borderRadius: "8px",
          }}
          disabled={loading}
        >
          Close
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
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
          {loading ? (
            <BeatLoader color="#15b89d" size={8} />
          ) : client ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientFormPopup;
