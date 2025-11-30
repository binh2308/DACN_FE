import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="hidden lg:flex lg:w-2/5 relative bg-[rgba(12,175,96,0.1)] flex-shrink-0">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/9e676a3ffa77d53169dfd8011369a666481b800c?width=1440"
          alt="Team collaboration"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-end justify-center p-4">
          <div className="bg-[rgba(33,37,43,0.5)] rounded-lg px-3 py-4 max-w-sm backdrop-blur-sm">
            <p className="text-[#E9EAEC] text-center text-xs font-semibold leading-[140%] tracking-[0.16px]">
              "Welcome to Human Resource management system."
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-3/5 flex items-center justify-center px-4 py-4 bg-white lg:bg-[rgba(255,255,255,0.1)] overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-grey-900 text-2xl font-semibold leading-[150%] tracking-[0.2px]">
                Login
              </h1>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-start gap-0.5">
                    <span className="text-grey-900 text-xs font-normal leading-[150%] tracking-[0.07px]">
                      Email Address
                    </span>
                    <span className="text-[#E03137] text-xs font-medium leading-[150%] tracking-[0.07px]">
                      *
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Input your registered email"
                    className="h-10 px-3 rounded-lg border border-grey-50 text-xs leading-[150%] tracking-[0.07px] placeholder:text-[#B8BDC5] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-grey-900 text-xs font-normal leading-[150%] tracking-[0.07px]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Input your password account"
                      className="h-10 w-full px-3 pr-10 rounded-lg border border-grey-50 text-xs leading-[150%] tracking-[0.07px] placeholder:text-[#B8BDC5] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#383E47] hover:text-grey-900 transition-colors"
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded-md border-2 border-[#B8BDC5] peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center flex-shrink-0">
                        {rememberMe && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[#657081] font-medium leading-[150%] tracking-[0.07px]">
                      Remember me
                    </span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-[#657081] font-medium leading-[150%] tracking-[0.07px] hover:text-primary transition-colors"
                  >
                    Forgot Password
                  </Link>
                </div>

                <button
                  type="submit"
                  className="h-10 flex items-center justify-center rounded-lg bg-[#0CAF60] hover:bg-[#0a9d56] active:bg-[#098d4d] text-white text-center text-sm font-medium leading-[150%] tracking-[0.08px] transition-colors"
                >
                  Login
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4 lg:hidden">
            <div className="bg-[rgba(33,37,43,0.5)] rounded-lg px-4 py-4 backdrop-blur-sm">
              <p className="text-[#E9EAEC] text-center text-xs font-semibold leading-[140%] tracking-[0.16px]">
                "Welcome to Human Resource management system."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
