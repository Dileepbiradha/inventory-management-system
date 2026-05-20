import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, type = 'text', ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
          error
            ? 'border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
        }`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input