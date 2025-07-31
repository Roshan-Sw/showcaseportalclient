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
import Select from "react-select";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .trim()
    .min(1, "Name cannot be empty"),
  description: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  priority: yup
    .number()
    .nullable()
    .transform((v) => (isNaN(v) ? null : v))
    .typeError("Priority must be a number"),
  type: yup
    .string()
    .required("Type is required")
    .oneOf(["LOGO", "BROCHURE"], "Invalid type"),
  file: yup
    .mixed()
    .nullable()
    .test("fileSize", "File size must be less than 10MB", (value) => {
      if (!value) return true;
      return value.size <= 10 * 1024 * 1024;
    })
    .test("fileType", "Only PDF, DOC, DOCX files are allowed", (value) => {
      if (!value) return true;
      return [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(value.type);
    }),
  thumbnail: yup
    .mixed()
    .nullable()
    .test("fileSize", "Thumbnail size must be less than 5MB", (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test(
      "fileType",
      "Only JPG, JPEG, PNG, WebP files are allowed",
      (value) => {
        if (!value) return true;
        return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          value.type
        );
      }
    ),
});

const CreativeFormPopup = ({ open, onClose, onSuccess, creative }) => {
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
      name: "",
      description: "",
      priority: "",
      type: "",
      file: null,
      thumbnail: null,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const typeOptions = [
    { value: "LOGO", label: "Logo" },
    { value: "BROCHURE", label: "Brochure" },
  ];

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        description: "",
        priority: "",
        type: "",
        file: null,
        thumbnail: null,
      });
      setError(null);
      return;
    }

    if (creative) {
      reset({
        name: creative.name || "",
        description: creative.description || "",
        priority: creative.priority?.toString() || "",
        type: creative.type || "",
        file: null,
        thumbnail: null,
      });
    } else {
      reset({
        name: "",
        description: "",
        priority: "",
        type: "",
        file: null,
        thumbnail: null,
      });
    }
  }, [creative, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const isEdit = !!creative;
      const userId = session?.user?.id ? Number(session.user.id) : null;
      if (!userId) throw new Error("User ID not found in session");

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      if (formData.description) {
        formDataToSend.append("description", formData.description.trim());
      }
      if (formData.priority) {
        formDataToSend.append("priority", formData.priority);
      }
      formDataToSend.append("type", formData.type);
      if (formData.file) {
        formDataToSend.append("files", formData.file);
      }
      if (formData.thumbnail) {
        formDataToSend.append("files", formData.thumbnail);
      }
      if (isEdit) {
        formDataToSend.append("updated_by", userId.toString());
      } else {
        formDataToSend.append("created_by", userId.toString());
        formDataToSend.append("updated_by", userId.toString());
      }

      const url = isEdit
        ? `${BASE_URL}/api/creatives/${creative.id}`
        : `${BASE_URL}/api/creatives`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${isEdit ? "update" : "create"} creative`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Creative ${isEdit ? "updated" : "created"} successfully!`,
        { position: "top-right" }
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${creative ? "updating" : "creating"} creative:`,
        err
      );
      const errorMessage =
        err.message || `Failed to ${creative ? "update" : "create"} creative`;
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right" });
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
        {creative ? "Edit Creative" : "Add Creative"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">Name *</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={{
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
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Priority</label>
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
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Type *</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    options={typeOptions}
                    value={
                      typeOptions.find((opt) => opt.value === field.value) ||
                      null
                    }
                    onChange={(selected) =>
                      field.onChange(selected ? selected.value : null)
                    }
                    placeholder="Select Type"
                    styles={customSelectStyles}
                    isClearable
                  />
                  {errors.type && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.type.message}
                    </div>
                  )}
                </>
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">File</label>
            <Controller
              name="file"
              control={control}
              render={({ field }) => (
                <>
                  <input
                    type="file"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => field.onChange(e.target.files[0])}
                    className="border border-[rgba(21,184,157,0.85)] rounded-md px-3 py-2 w-full"
                  />
                  {errors.file && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.file.message}
                    </div>
                  )}
                </>
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Thumbnail</label>
            <Controller
              name="thumbnail"
              control={control}
              render={({ field }) => (
                <>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => field.onChange(e.target.files[0])}
                    className="border border-[rgba(21,184,157,0.85)] rounded-md px-3 py-2 w-full"
                  />
                  {errors.thumbnail && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.thumbnail.message}
                    </div>
                  )}
                </>
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
          ) : creative ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreativeFormPopup;
