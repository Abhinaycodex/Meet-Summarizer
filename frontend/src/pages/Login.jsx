import React, { useState } from "react";
import { useAuth } from "../context/UseAuth";
import AuthInput from "../components/AuthInput";

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault("");
    setLoading(true);
    setMessage("");

    try {
      const res =  await login(form);
      setMessage("✅ Login successful!");
      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
      console.log(res);
    } catch (error) {
      setMessage(error.response?.data?.message || "❌ Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit}>
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
            className=" cursor-pointer w-full bg-indigo-600 text-white py-2 mt-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
        <p className="text-center text-sm mt-4">
          Don’t have an account?{" "}
          <a href="/register" className="text-indigo-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
