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
  client_id: yup
    .number()
    .required("Client ID is required")
    .typeError("Client ID must be a number"),
  project_name: yup
    .string()
    .required("Project Name is required")
    .trim()
    .min(1, "Project Name cannot be empty"),
  description: yup.string().nullable().trim(),
  description1: yup.string().nullable().trim(),
  priority: yup
    .number()
    .nullable()
    .typeError("Priority must be a number")
    .default(0),
});

const editValidationSchema = yup.object().shape({
  description1: yup.string().nullable().trim(),
  priority: yup
    .number()
    .required("Priority is required")
    .typeError("Priority must be a number"),
});

const ProjectFormPopup = ({ open, onClose, onSuccess, project }) => {
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
      client_id: null,
      project_name: null,
      description: null,
      description1: null,
      priority: 0,
    },
    resolver: yupResolver(
      project ? editValidationSchema : createValidationSchema
    ),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({
        id: null,
        client_id: null,
        project_name: null,
        description: null,
        description1: null,
        priority: 0,
      });
      setError(null);
      return;
    }

    if (project) {
      reset({
        id: project.id,
        client_id: project.client_id || null,
        project_name: project.project_name || null,
        description: project.description || null,
        description1: project.description1 || null,
        priority: project.priority || 0,
      });
    } else {
      reset({
        id: null,
        client_id: null,
        project_name: null,
        description: null,
        description1: null,
        priority: 0,
      });
    }
  }, [project, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const isEdit = !!project;

      if (!isEdit) {
        const payload = {
          id: Number(formData.id),
          client_id: Number(formData.client_id),
          project_name: formData.project_name?.trim() || null,
          description: formData.description?.trim() || null,
          description1: formData.description1?.trim() || null,
          priority: formData.priority ? Number(formData.priority) : 0,
        };

        const response = await fetch(`${BASE_URL}/api/projects/create`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create project");
        }

        const data = await response.json();
        toast.success(data.message || "Project created successfully!", {
          position: "top-right",
        });
        onSuccess();
        onClose();
      } else {
        const url = `${BASE_URL}/api/projects/update/${project.id}`;
        const payload = {
          description1: formData.description1?.trim() || null,
          priority: Number(formData.priority),
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
          throw new Error(errorData.message || "Failed to update project");
        }
        const data = await response.json();
        toast.success(data.message || "Project updated successfully!", {
          position: "top-right",
        });
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(`Error ${project ? "updating" : "creating"} project:`, err);
      setError(
        err.message || `Failed to ${project ? "update" : "create"} project`
      );
      toast.error(
        err.message || `Failed to ${project ? "update" : "create"} project.`,
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
        {project ? "Edit Project" : "Add Project"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">ID {project ? "" : "*"}</label>
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
                  disabled={!!project}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Client ID {project ? "" : "*"}</label>
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  error={!!errors.client_id}
                  helperText={errors.client_id?.message}
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
                  disabled={!!project}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">
              Project Name {project ? "" : "*"}
            </label>
            <Controller
              name="project_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!!errors.project_name}
                  helperText={errors.project_name?.message}
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
                  disabled={!!project}
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
                  disabled={!!project}
                />
              )}
            />
          </Box>
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
                  rows={3}
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
          <Box>
            <label className="block mb-1">Priority {project ? "*" : ""}</label>
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
          ) : project ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectFormPopup;
