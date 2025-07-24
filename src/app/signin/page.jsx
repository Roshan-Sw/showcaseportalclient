"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  FiMail,
  FiLock,
  FiAlertCircle,
  FiCheckCircle,
  FiKey,
} from "react-icons/fi";
import { BASE_AUTH_URL, BASE_URL } from "@/services/baseUrl";
import { useRef } from "react";

const CustomOtpInput = ({
  value,
  onChange,
  numInputs = 6,
  shouldAutoFocus = true,
  disabled = false,
}) => {
  const inputRefs = useRef([]);

  const handleChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;
    const newValue = value.split("");
    newValue[index] = val;
    onChange(newValue.join(""));
    if (val && index < numInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < numInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedData.length <= numInputs) {
      onChange(pastedData.padEnd(numInputs, ""));
      if (pastedData.length > 0) {
        inputRefs.current[Math.min(pastedData.length, numInputs - 1)]?.focus();
      }
    }
    e.preventDefault();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      {Array.from({ length: numInputs }).map((_, index) => (
        <input
          key={index}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          ref={(el) => (inputRefs.current[index] = el)}
          autoFocus={shouldAutoFocus && index === 0}
          maxLength={1}
          type="tel"
          disabled={disabled}
          style={{
            width: "2.5rem",
            height: "2.5rem",
            fontSize: "1.5rem",
            textAlign: "center",
            borderRadius: 4,
            border: "1px solid #ccc",
            background: disabled ? "#f3f3f3" : "#fff",
            marginTop: "10px",
          }}
        />
      ))}
    </div>
  );
};

const SignIn = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [signinEmail, setSigninEmail] = useState(null);
  const [token, setToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/admin");
    }
  }, [status, router]);

  useEffect(() => {
    if (message.text && !qrCodeImage) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, qrCodeImage]);

  const onSubmit = async (data) => {
    try {
      const res = await fetch(`${BASE_AUTH_URL}/api/user-auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          type: "HR",
        }),
      });

      let result;
      const text = await res.text();
      try {
        result = text && text.trim() ? JSON.parse(text) : {};
      } catch (err) {
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(
          result.message || `Signin failed with status ${res.status}`
        );
      }

      if (result.status === "success") {
        setQrCodeImage(result.data.qrcode);
        setSigninEmail(result.data.email);
        setMessage({
          text:
            result.data.message ||
            "QR code generated. Please scan to verify and enter the token below.",
          type: "success",
        });
      } else {
        throw new Error("Signin successful, but no QR code received");
      }
    } catch (err) {
      setMessage({ text: err.message || "Signin failed", type: "error" });
    }
  };

  const handleVerifyToken = async () => {
    if (!token || !signinEmail) {
      setMessage({
        text: "Token and email are required for verification.",
        type: "error",
      });
      return;
    }

    try {
      setIsVerifying(true);

      const res = await fetch(`${BASE_AUTH_URL}/api/user-auth/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: signinEmail }),
      });

      let result;
      const text = await res.text();
      try {
        result = text && text.trim() ? JSON.parse(text) : null;
      } catch (err) {
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(
          result.message || `Verification failed with status ${res.status}`
        );
      }

      if (result?.status === "success" && result.data?.token) {
        const nameParts = result.data.name
          ? result.data.name.split(" ")
          : ["", ""];
        const createUserRes = await fetch(`${BASE_URL}/api/users/create`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: result.data.id,
            first_name: nameParts[0] || null,
            last_name: nameParts[1] || null,
            email: result.data.email,
            phone: result.data.phone || null,
          }),
        });

        let createUserResult;
        const createUserText = await createUserRes.text();
        try {
          createUserResult =
            createUserText && createUserText.trim()
              ? JSON.parse(createUserText)
              : null;
        } catch (err) {
          throw new Error("Invalid response from user creation");
        }

        if (!createUserRes.ok) {
          throw new Error(
            createUserResult?.message ||
              `User creation failed with status ${createUserRes.status}`
          );
        }

        const signInResponse = await signIn("credentials", {
          token: result.data.token,
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          redirect: false,
        });

        if (signInResponse?.error) {
          throw new Error(`NextAuth sign-in failed: ${signInResponse.error}`);
        }

        setMessage({
          text: result.message || "Verification successful. Redirecting...",
          type: "success",
        });

        router.push("/admin");
        setQrCodeImage(null);
        setToken("");
      } else {
        throw new Error(
          result.message || "Verification failed: No token returned"
        );
      }
    } catch (err) {
      setMessage({ text: err.message || "Verification failed", type: "error" });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to Showcase Portal
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-center">
                {message.type === "success" ? (
                  <FiCheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <FiAlertCircle className="h-5 w-5 mr-2" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          )}

          {!signinEmail ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                        message: "Invalid email address",
                      },
                    })}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.password ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {qrCodeImage && (
                <div className="mb-6 flex flex-col items-center">
                  <img
                    src={qrCodeImage}
                    alt="QR Code for Verification"
                    className="w-32 h-32 mb-4"
                  />
                  <p className="text-sm text-gray-600 text-center">
                    Scan the QR code with your authenticator app
                  </p>
                </div>
              )}
              <div>
                <label
                  htmlFor="token"
                  className="block text-sm font-medium text-gray-700"
                >
                  Verification Token
                </label>
                <CustomOtpInput
                  value={token}
                  onChange={setToken}
                  numInputs={6}
                  shouldAutoFocus={true}
                  disabled={isVerifying}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleVerifyToken}
                  disabled={isVerifying || !token}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isVerifying || !token ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Verify Token"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
