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
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
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
  client_id: yup
    .number()
    .required("Client is required")
    .typeError("Client ID must be a number"),
  title: yup
    .string()
    .required("Title is required")
    .trim()
    .min(1, "Title cannot be empty"),
  url: yup
    .string()
    .required("URL is required")
    .url("Must be a valid URL")
    .trim()
    .min(1, "URL cannot be empty"),
  type: yup
    .string()
    .required("Type is required")
    .oneOf(["WEBSITE", "LANDING_PAGE"], "Invalid type"),
  description: yup
    .string()
    .nullable()
    .transform((v) => v?.trim() || null),
  thumbnail: yup
    .mixed()
    .nullable()
    .test("fileSize", "File size must be less than 5MB", (value) => {
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
  launch_date: yup
    .date()
    .nullable()
    .typeError("Launch date must be a valid date"),
});

const formatDateSimple = (date) => {
  if (!date) return null;
  const momentDate = moment.isMoment(date) ? date : moment(date);
  return momentDate.isValid() ? momentDate.format("YYYY-MM-DD") : null;
};

const WebsiteFormPopup = ({ open, onClose, onSuccess, website }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const { data: session } = useSession();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      client_id: null,
      title: null,
      url: null,
      type: null,
      description: null,
      thumbnail: null,
      launch_date: null,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.client_name,
  }));

  const typeOptions = [
    { value: "WEBSITE", label: "Website" },
    { value: "LANDING_PAGE", label: "Landing Page" },
  ];

  useEffect(() => {
    if (!open) {
      reset({
        client_id: null,
        title: null,
        url: null,
        type: null,
        description: null,
        thumbnail: null,
        launch_date: null,
      });
      setError(null);
      return;
    }

    if (website) {
      reset({
        client_id: website.client_id || null,
        title: website.title || null,
        url: website.url || null,
        type: website.type || null,
        description: website.description || null,
        thumbnail: null,
        launch_date: website.launch_date
          ? new Date(website.launch_date).toISOString().split("T")[0]
          : null,
      });
    } else {
      reset({
        client_id: null,
        title: null,
        url: null,
        type: null,
        description: null,
        thumbnail: null,
        launch_date: null,
      });
    }
  }, [website, open, reset]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/clients/list?page=1&limit=1000`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch clients");
        const data = await response.json();
        setClients(data.data?.clients || []);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        toast.error("Failed to load clients.", { position: "top-right" });
      }
    };

    if (session?.accessToken && open) {
      fetchClients();
    }
  }, [session, open]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const isEdit = !!website;
      const userId = session?.user?.id ? Number(session.user.id) : null;
      if (!userId) throw new Error("User ID not found in session");

      const formDataToSend = new FormData();
      formDataToSend.append("client_id", formData.client_id);
      formDataToSend.append("title", formData.title?.trim() || "");
      formDataToSend.append("url", formData.url?.trim() || "");
      formDataToSend.append("type", formData.type);
      if (formData.description)
        formDataToSend.append("description", formData.description?.trim());
      if (formData.thumbnail)
        formDataToSend.append("thumbnail", formData.thumbnail);
      if (formData.launch_date)
        formDataToSend.append(
          "launch_date",
          formatDateSimple(formData.launch_date)
        );
      if (isEdit) {
        formDataToSend.append("updated_by", userId);
      } else {
        formDataToSend.append("created_by", userId);
        formDataToSend.append("updated_by", userId);
      }

      const url = isEdit
        ? `${BASE_URL}/api/websites/${website.id}`
        : `${BASE_URL}/api/websites`;

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
            `Failed to ${isEdit ? "update" : "create"} website`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Website ${isEdit ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(`Error ${website ? "updating" : "creating"} website:`, err);
      setError(
        err.message || `Failed to ${website ? "update" : "create"} website`
      );
      toast.error(
        err.message || `Failed to ${website ? "update" : "create"} website.`,
        {
          position: "top-right",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
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
          {website ? "Edit Website" : "Add Website"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Box>
              <label className="block mb-1">Client *</label>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      options={clientOptions}
                      value={
                        clientOptions.find(
                          (opt) => opt.value === field.value
                        ) || null
                      }
                      onChange={(selected) =>
                        field.onChange(selected ? selected.value : null)
                      }
                      placeholder="Select Client"
                      styles={customSelectStyles}
                      isClearable
                    />
                    {errors.client_id && (
                      <div className="text-red-600 text-sm mt-1">
                        {errors.client_id.message}
                      </div>
                    )}
                  </>
                )}
              />
            </Box>
            <Box>
              <label className="block mb-1">Title *</label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.title}
                    helperText={errors.title?.message}
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
              <label className="block mb-1">URL *</label>
              <Controller
                name="url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.url}
                    helperText={errors.url?.message}
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
              <label className="block mb-1">Thumbnail</label>
              <Controller
                name="thumbnail"
                control={control}
                render={({ field }) => (
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => field.onChange(e.target.files[0])}
                    className="border border-[rgba(21,184,157,0.85)] rounded-md px-3 py-2 w-full"
                  />
                )}
              />
              {errors.thumbnail && (
                <div className="text-red-600 text-sm mt-1">
                  {errors.thumbnail.message}
                </div>
              )}
            </Box>
            <Box>
              <label className="block mb-1">Launch Date</label>
              <Controller
                name="launch_date"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    format="DD-MM-YYYY"
                    value={field.value ? moment(field.value) : null}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                      trigger("launch_date");
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        error: !!errors.launch_date,
                        helperText: errors.launch_date?.message,
                        className: "bg-white",
                        InputProps: { className: "h-10" },
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
            ) : website ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default WebsiteFormPopup;
