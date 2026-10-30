import API from "./api";

export const registerUser = async (userData) => {
    const response = await API.post("/auth/register", userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await API.post("/auth/login", credentials);

    const { access_token, user } = response.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(user));

    return response.data;
};

export const getUserProfile = async () => {
    const response = await API.get("/auth/profile");
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
};