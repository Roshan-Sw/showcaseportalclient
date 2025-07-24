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
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import Select from "react-select";
import Slide from "@mui/material/Slide";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL, BASE_AUTH_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

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

const createValidationSchema = yup.object().shape({
  id: yup.number().nullable().typeError("ID must be a number"),
  first_name: yup
    .string()
    .required("First Name is required")
    .trim()
    .min(1, "First Name cannot be empty"),
  last_name: yup
    .string()
    .required("Last Name is required")
    .trim()
    .min(1, "Last Name cannot be empty"),
  email: yup
    .string()
    .email("Must be a valid email")
    .required("Email is required")
    .trim()
    .min(1, "Email cannot be empty"),
  phone: yup
    .string()
    .required("Phone is required")
    .trim()
    .min(1, "Phone cannot be empty"),
  role: yup
    .string()
    .oneOf(
      ["STANDARD_USER", "HR_ASSISTANT", "HR_HEAD", "NO_ACCESS"],
      "Invalid role"
    )
    .nullable(),
});

const editValidationSchema = yup.object().shape({
  id: yup.number().nullable().typeError("ID must be a number"),
  first_name: yup.string().nullable().trim(),
  last_name: yup.string().nullable().trim(),
  email: yup.string().email("Must be a valid email").nullable().trim(),
  phone: yup.string().nullable().trim(),
  role: yup
    .string()
    .oneOf(
      ["STANDARD_USER", "HR_ASSISTANT", "HR_HEAD", "NO_ACCESS"],
      "Invalid role"
    )
    .required("Role is required"),
});

const UserFormPopup = ({ open, onClose, onSuccess, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      id: null,
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      role: null,
    },
    resolver: yupResolver(user ? editValidationSchema : createValidationSchema),
    mode: "onChange",
  });

  const roleOptions = [
    { value: "STANDARD_USER", label: "Standard User" },
    { value: "HR_ASSISTANT", label: "HR Assistant" },
    { value: "HR_HEAD", label: "HR Head" },
    { value: "NO_ACCESS", label: "No Access" },
  ];

  useEffect(() => {
    if (!open) {
      reset({
        id: null,
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        role: null,
      });
      setError(null);
      return;
    }

    if (user) {
      reset({
        id: user.id,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        email: user.email || null,
        phone: user.phone || null,
        role: user.role || null,
      });
    } else {
      reset({
        id: null,
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        role: null,
      });
    }
  }, [user, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const isEdit = !!user;

      if (!isEdit) {
        const authUserData = {
          name: `${formData.first_name?.trim() || ""} ${
            formData.last_name?.trim() || ""
          }`.trim(),
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          type: "HR",
          password: "123@Spiderworks",
        };

        const authResponse = await fetch(
          `${BASE_AUTH_URL}/api/user-auth/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(authUserData),
            credentials: "include",
          }
        );

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          throw new Error(
            errorData.message || "Failed to create user in auth service"
          );
        }

        const authUser = await authResponse.json();
        const userId = formData.id
          ? Number(formData.id)
          : Number(authUser.data?.data?.id);
        if (!userId) {
          throw new Error("No user ID provided or returned from auth service");
        }

        const payload = {
          id: userId,
          first_name: formData.first_name?.trim() || null,
          last_name: formData.last_name?.trim() || null,
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          role: formData.role || null,
          created_by: session?.user?.id ? Number(session.user.id) : undefined,
          updated_by: session?.user?.id ? Number(session.user.id) : undefined,
        };

        const response = await fetch(`${BASE_URL}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create user");
        }

        const data = await response.json();
        toast.success(data.message || "User created successfully!", {
          position: "top-right",
        });
        onSuccess();
        onClose();
      } else {
        const url = `${BASE_URL}/api/users/update-role/${user.id}`;
        const payload = {
          role: formData.role,
          updated_by: session?.user?.id ? Number(session.user.id) : undefined,
        };
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update user`);
        }
        const data = await response.json();
        toast.success(data.message || `User updated successfully!`, {
          position: "top-right",
        });
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(`Error ${user ? "updating" : "creating"} user:`, err);
      setError(err.message || `Failed to ${user ? "update" : "create"} user`);
      toast.error(
        err.message || `Failed to ${user ? "update" : "create"} user.`,
        { position: "top-right" }
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
          {user ? "Edit User" : "Add User"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Box>
              <label className="block mb-1">ID</label>
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
                    disabled
                  />
                )}
              />
            </Box>
            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              gap={2}
            >
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">
                  First Name {user ? "" : "*"}
                </label>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      variant="outlined"
                      size="small"
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
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
                      disabled={user}
                    />
                  )}
                />
              </Box>
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">
                  Last Name {user ? "" : "*"}
                </label>
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      variant="outlined"
                      size="small"
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
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
                      disabled={user}
                    />
                  )}
                />
              </Box>
            </Box>
            <Box>
              <label className="block mb-1">Email {user ? "" : "*"}</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
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
                    disabled={user}
                  />
                )}
              />
            </Box>
            <Box>
              <label className="block mb-1">Phone {user ? "" : "*"}</label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
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
                    disabled={user}
                  />
                )}
              />
            </Box>
            <Box>
              <label className="block mb-1">Role {user ? "*" : ""}</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      options={roleOptions}
                      value={
                        roleOptions.find((opt) => opt.value === field.value) ||
                        null
                      }
                      onChange={(selected) =>
                        field.onChange(selected ? selected.value : null)
                      }
                      styles={customSelectStyles}
                      placeholder="Role..."
                      isClearable
                      isDisabled={false}
                    />
                    {errors.role && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.role?.message}
                      </span>
                    )}
                  </div>
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
            ) : user ? (
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

export default UserFormPopup;
