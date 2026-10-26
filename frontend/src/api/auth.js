import client from "./client.js";

export const register = (data) => client.post("/auth/register", data);
export const requestRegistrationOTP = (email) =>
  client.post("/auth/register/request-otp", { email });
export const verifyRegistrationOTP = (data) =>
  client.post("/auth/register/verify-otp", data);
export const login = (data) => client.post("/auth/login", data);
export const getMe = () => client.get("/auth/me");
export const updateProfile = (data) => client.patch("/auth/profile", data);
