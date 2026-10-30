
import React, { useState } from "react";
import { Wallet, Eye, EyeOff } from "lucide-react";
import { loginUser, registerUser } from "../services/authService";
import "./Auth.css";
function Auth({ onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                const result = await loginUser({
                    email: formData.email,
                    password: formData.password,
                });

                onAuthSuccess(result.user);
            } else {
                await registerUser({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                });

                const result = await loginUser({
                    email: formData.email,
                    password: formData.password,
                });

                onAuthSuccess(result.user);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-logo">
                        <Wallet size={26} />
                    </div>
                    <h2>SmartSpend AI</h2>
                    <p>Take control of your money.</p>
                </div>

                <div className="auth-heading">
                    <h3>{isLogin ? "Welcome Back!" : "Create Your Account"}</h3>
                    <p>
                        {isLogin
                            ? "Sign in to continue to your dashboard."
                            : "Start managing your finances smarter."}
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="auth-field">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <div className="auth-password">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : isLogin
                                ? "Sign In"
                                : "Create Account"}
                    </button>
                </form>

                <div className="auth-switch">
                    {isLogin
                        ? "Don't have an account?"
                        : "Already have an account?"}

                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                        }}
                    >
                        {isLogin ? "Create Account" : "Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;
