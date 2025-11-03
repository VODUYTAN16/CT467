// src/utils/validations.js
export const memberValidation = {
  firstName: (value) => (!value ? "First name is required" : ""),
  email: (value) => {
    if (!value) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email format";
    return "";
  },
  phone: (value) => {
    if (!value) return "Phone number is required";
    if (!/^[0-9]{10}$/.test(value)) return "Invalid phone format";
    return "";
  },
};
