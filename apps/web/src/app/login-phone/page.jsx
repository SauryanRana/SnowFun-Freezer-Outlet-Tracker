'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FiPhone, FiMail, FiLock, FiAlertCircle, FiArrowRight, FiCheck } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPhonePage() {
  const [step, setStep] = useState('phone'); // 'phone', 'otp', or 'register'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const router = useRouter();

  // Handle countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove any non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format with Nepal country code if needed
    if (cleaned.length > 0) {
      if (cleaned.startsWith('977')) {
        return `+${cleaned}`;
      } else if (cleaned.startsWith('0')) {
        return `+977${cleaned.substring(1)}`;
      } else if (cleaned.length <= 10) {
        return cleaned;
      } else {
        return `+977${cleaned.substring(cleaned.length - 10)}`;
      }
    }
    return cleaned;
  };

  // Handle phone number input change
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Validate Nepali phone number
  const validatePhone = (phoneNumber) => {
    // Basic validation for Nepali numbers
    // Accepts formats: +977xxxxxxxxxx, 977xxxxxxxxxx, 9xxxxxxxxx
    const nepaliPhoneRegex = /^(\+977|977|0)?[9][6-9]\d{8}$/;
    return nepaliPhoneRegex.test(phoneNumber);
  };

  // Handle send OTP button click
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Form validation
    const errors = {};
    if (!phone) errors.phone = 'Phone number is required';
    else if (!validatePhone(phone)) errors.phone = 'Please enter a valid Nepali phone number';
    
    // If there are errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear previous errors
    setFormErrors({});
    setIsLoading(true);
    
    try {
      // Call API to send OTP
      const response = await api.post('/auth/send-otp', { phone });
      
      // Move to OTP verification step
      setStep('otp');
      setCountdown(60); // 60 seconds countdown for resend
      
      // Show success message
      toast.success('Verification code sent successfully!');
      
      // If in development, show OTP in console
      if (process.env.NODE_ENV !== 'production' && response.data.otp) {
        console.log('Development OTP:', response.data.otp);
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      setFormErrors({
        phone: error.response?.data?.message || 'Failed to send verification code. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Form validation
    const errors = {};
    if (!otp) errors.otp = 'Verification code is required';
    else if (otp.length !== 6 || !/^\d+$/.test(otp)) errors.otp = 'Please enter a valid 6-digit code';
    
    // If there are errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear previous errors
    setFormErrors({});
    setIsLoading(true);
    
    try {
      // Call API to verify OTP
      const response = await api.post('/auth/verify-otp', { 
        phone, 
        otp,
        ...(step === 'register' && { fullName })
      });
      
      // Handle successful verification
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      toast.success('Login successful!');
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'psr') {
        router.push('/psr/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      
      // Check if registration is required
      if (error.response?.data?.requiresRegistration) {
        setStep('register');
        setFormErrors({});
      } else {
        setFormErrors({
          otp: error.response?.data?.message || 'Invalid verification code. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration with phone and name
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Form validation
    const errors = {};
    if (!fullName) errors.fullName = 'Full name is required';
    else if (fullName.length < 2) errors.fullName = 'Name must be at least 2 characters';
    
    // If there are errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Proceed with OTP verification which will create the account
    handleVerifyOTP(e);
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    
    try {
      // Call API to resend OTP
      const response = await api.post('/auth/send-otp', { phone });
      
      // Reset countdown
      setCountdown(60);
      
      // Show success message
      toast.success('Verification code resent successfully!');
      
      // If in development, show OTP in console
      if (process.env.NODE_ENV !== 'production' && response.data.otp) {
        console.log('Development OTP:', response.data.otp);
      }
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
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
            {/* Phone Number Input Step */}
            {step === 'phone' && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Login with Phone
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Enter your Nepali phone number to receive a verification code
                </p>

                {authError && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-start">
                    <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleSendOTP}>
                  {/* Phone Field */}
                  <div className="mb-6">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="text-gray-400" />
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        className={`block w-full pl-10 pr-3 py-2.5 border ${
                          formErrors.phone ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:ring-snow-green-500 focus:border-snow-green-500`}
                        placeholder="98XXXXXXXX"
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                    )}
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
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Get Verification Code
                        <FiArrowRight className="ml-2" />
                      </>
                    )}
                  </button>
                  
                  {/* Login with Email Link */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Prefer to use email?{' '}
                      <Link href="/login" className="text-snow-red-600 hover:text-snow-red-800 hover:underline">
                        Login with Email
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            )}

            {/* OTP Verification Step */}
            {step === 'otp' && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Verify Your Number
                </h2>
                
                <p className="text-gray-600 mb-6">
                  We've sent a verification code to <span className="font-medium">{phone}</span>
                </p>

                <form onSubmit={handleVerifyOTP}>
                  {/* OTP Field */}
                  <div className="mb-6">
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`block w-full px-4 py-2.5 border text-center text-lg tracking-widest ${
                        formErrors.otp ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:ring-snow-green-500 focus:border-snow-green-500`}
                      placeholder="• • • • • •"
                      maxLength={6}
                    />
                    {formErrors.otp && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.otp}</p>
                    )}
                  </div>

                  {/* Resend Code */}
                  <div className="mb-6 text-center">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={countdown > 0 || isLoading}
                      className={`text-sm ${
                        countdown > 0 ? 'text-gray-400' : 'text-snow-green-600 hover:text-snow-green-800 hover:underline'
                      }`}
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend verification code'}
                    </button>
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
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <FiCheck className="ml-2" />
                      </>
                    )}
                  </button>
                  
                  {/* Change Number Link */}
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-sm text-snow-red-600 hover:text-snow-red-800 hover:underline"
                    >
                      Change phone number
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Registration Step */}
            {step === 'register' && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Complete Registration
                </h2>
                
                <p className="text-gray-600 mb-6">
                  This looks like your first login. Please provide your name to complete registration.
                </p>

                <form onSubmit={handleRegister}>
                  {/* Full Name Field */}
                  <div className="mb-6">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`block w-full px-4 py-2.5 border ${
                        formErrors.fullName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:ring-snow-green-500 focus:border-snow-green-500`}
                      placeholder="Your full name"
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                    )}
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
                        Creating Account...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </button>
                </form>
              </>
            )}
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
