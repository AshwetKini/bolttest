import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/LoadingSpinner'

const schema = yup.object({
  phone: yup.string().required('Phone number is required'),
  mpin: yup.string().required('MPIN is required').min(4, 'MPIN must be at least 4 digits'),
})

interface LoginForm {
  phone: string
  mpin: string
}

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')

    try {
      await login(data.phone, data.mpin)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Shopee Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="input mt-1"
              placeholder="+1234567890"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="mpin" className="block text-sm font-medium text-gray-700">
              MPIN
            </label>
            <input
              {...register('mpin')}
              type="password"
              className="input mt-1"
              placeholder="Enter your MPIN"
            />
            {errors.mpin && (
              <p className="mt-1 text-sm text-red-600">{errors.mpin.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Demo credentials:</p>
            <p>Admin: +1234567890 / 1234</p>
            <p>Store Owner: +1987654321 / 1234</p>
          </div>
        </form>
      </div>
    </div>
  )
}