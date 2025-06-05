'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiPhone } from 'react-icons/fi';
import { RiIceCreamLine } from 'react-icons/ri';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { login, isLoading, error } = useAuth();
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const errors = {};
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email';
    
    if (!password) errors.password = 'Password is required';
    
    // If there are errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear previous errors
    setFormErrors({});
    
    try {
      // Call login from auth context
      await login(email, password);
      // Router redirection is handled in the AuthContext after successful login
    } catch (err) {
      // Error handling is done in AuthContext
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding and Image */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-snow-green-100 to-snow-green-50 flex-col justify-center items-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <Image 
              src="/logo-snowfun.png" 
              alt="Snowfun Nepal Logo" 
              width={180} 
              height={180}
              className="drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-snow-green-900 mb-4 font-poppins">
            Snowfun Nepal
          </h1>
          <p className="text-xl text-snow-green-700 mb-8">
            Freezer & Outlet Tracker
          </p>
          <div className="relative h-64 w-full rounded-xl overflow-hidden shadow-2xl">
            <Image
              src="/nepal-map-illustration.jpg"
              alt="Nepal Map"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-xl"
            />
          </div>
          <p className="mt-8 text-sm text-snow-green-600">
            Track freezer inventory and manage PSR visits across Nepal
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-white md:bg-gradient-to-b md:from-white md:to-snow-green-50">
        {/* Mobile logo - only visible on small screens */}
        <div className="md:hidden mb-8 flex flex-col items-center">
          <Image 
            src="/logo-snowfun.png" 
            alt="Snowfun Nepal Logo" 
            width={120} 
            height={120}
            priority
          />
          <h1 className="text-2xl font-bold text-snow-green-900 mt-4">Snowfun Nepal</h1>
          <p className="text-snow-green-700">Freezer & Outlet Tracker</p>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-snow-green-50">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <RiIceCreamLine className="mr-2 text-snow-red-500" size={24} />
              Welcome Back
            </h2>
            
            <p className="text-gray-600 mb-6">
              Sign in to your account to access the dashboard
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-start">
                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-snow-green-500 focus:border-snow-green-500`}
                    placeholder="you@example.com"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2.5 border ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-snow-green-500 focus:border-snow-green-500`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end mb-6">
                <Link 
                  href="/forgot-password"
                  className="text-sm text-snow-green-600 hover:text-snow-green-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-snow-green-500 to-snow-green-600 hover:from-snow-green-600 hover:to-snow-green-700 text-white py-2.5 px-4 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-snow-green-300 focus:ring-offset-2 transition-colors duration-200 flex justify-center items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Phone Login Option */}
              <div className="mt-6 flex items-center justify-center">
                <div className="border-t border-gray-200 flex-grow"></div>
                <span className="px-4 text-sm text-gray-500">OR</span>
                <div className="border-t border-gray-200 flex-grow"></div>
              </div>

              <Link href="/login-phone">
                <button
                  type="button"
                  className="mt-4 w-full bg-white border border-snow-red-500 text-snow-red-600 py-2.5 px-4 rounded-md font-medium shadow-sm hover:bg-snow-red-50 focus:outline-none focus:ring-2 focus:ring-snow-red-300 focus:ring-offset-2 transition-colors duration-200 flex justify-center items-center"
                >
                  <FiPhone className="mr-2" />
                  Login with Phone Number
                </button>
              </Link>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              &copy; {new Date().getFullYear()} Snowfun Nepal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
