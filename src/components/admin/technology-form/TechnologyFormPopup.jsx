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

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required("Technology Name is required")
    .trim()
    .min(1, "Technology Name cannot be empty"),
});

const TechnologyFormPopup = ({ open, onClose, onSuccess, technology }) => {
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
      name: null,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({ name: null });
      setError(null);
      return;
    }

    if (technology) {
      reset({ name: technology.name || null });
    } else {
      reset({ name: null });
    }
  }, [technology, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const isEdit = !!technology;
      const userId = session?.user?.id ? Number(session.user.id) : null;

      if (!userId) {
        throw new Error("User ID not found in session");
      }

      const payload = {
        name: formData.name?.trim() || null,
        ...(isEdit
          ? { updated_by: userId }
          : { created_by: userId, updated_by: userId }),
      };

      const url = isEdit
        ? `${BASE_URL}/api/technologies/${technology.id}`
        : `${BASE_URL}/api/technologies`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${isEdit ? "update" : "create"} technology`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Technology ${isEdit ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${technology ? "updating" : "creating"} technology:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${technology ? "update" : "create"} technology`
      );
      toast.error(
        err.message ||
          `Failed to ${technology ? "update" : "create"} technology.`,
        {
          position: "top-right",
        }
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
        {technology ? "Edit Technology" : "Add Technology"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">Technology Name *</label>
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
          ) : technology ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TechnologyFormPopup;
