import  { useState } from "react";
import AuthInput from "../components/AuthInput";
import { useAuth } from "../context/UseAuth";

const Register = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
        await register(form);
        setMessage(" Registration successful! Please login.");
        setForm({ firstName: "", lastName: "", email: "", password: "" });
      } catch (error) {
      setMessage(error.response?.data?.message || " Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        <form onSubmit={handleSubmit}>
          <AuthInput
            label="First Name"
            name="firstName"
            type="text"
            value={form.firstName}
            onChange={handleChange}
            placeholder="John"
          />
          <AuthInput
            label="Last Name"
            name="lastName"
            type="text"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Doe"
          />
          <AuthInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="john@example.com"
          />
          <AuthInput
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 mt-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
