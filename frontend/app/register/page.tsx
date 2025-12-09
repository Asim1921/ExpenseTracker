'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      Cookies.set('token', response.data.token);
      Cookies.set('user', JSON.stringify(response.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50/50 to-indigo-50/30"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMWY1ZjkiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="max-w-md w-full glass-effect rounded-3xl shadow-2xl p-10 relative z-10 border border-white/50">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white mb-6 shadow-lg shadow-primary-500/25 p-2">
            <div className="relative w-full h-full">
              <Image
                src="/logo.jpg"
                alt="Logo"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-3">
            Earnings Management
          </h1>
          <p className="text-slate-600 font-medium">Create your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

