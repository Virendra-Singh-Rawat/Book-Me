import client from "./client.js";

export const listAvailability = () => client.get("/availability");
export const saveAvailability = (data) => client.post("/availability", data);
