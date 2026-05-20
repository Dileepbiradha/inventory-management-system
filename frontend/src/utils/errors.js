/**
 * Extracts a human-readable error message from an Axios/FastAPI error.
 * Handles FastAPI's various error response shapes:
 *   - { detail: "string" }
 *   - { detail: [{ msg: "...", loc: [...] }] }  (validation errors)
 *   - Network errors / unknown errors
 */
export function extractErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback

  // Axios error with response from server
  const data = err?.response?.data

  if (data) {
    // FastAPI validation errors: detail is an array of error objects
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((d) => {
          if (typeof d === 'string') return d
          if (d?.msg) {
            const field = Array.isArray(d.loc) ? d.loc.slice(-1)[0] : ''
            return field ? `${field}: ${d.msg}` : d.msg
          }
          return ''
        })
        .filter(Boolean)
        .join(', ') || fallback
    }

    // FastAPI standard error: { detail: "message" }
    if (typeof data.detail === 'string') return data.detail

    // Some APIs return { message: "..." }
    if (typeof data.message === 'string') return data.message

    // If data itself is a string
    if (typeof data === 'string') return data
  }

  // Network/Axios error message
  if (err.message) return err.message

  return fallback
}