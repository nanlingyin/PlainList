import { useAuthStore } from '@/stores/auth'

export function useApi() {
  async function request(method, path, body) {
    const auth = useAuthStore()
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (auth.token) opts.headers['Authorization'] = 'Bearer ' + auth.token
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch('/api' + path, opts)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || res.statusText)
    }
    return res.json()
  }

  return {
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    put:    (path, body)  => request('PUT',    path, body),
    del:    (path)        => request('DELETE', path),
  }
}
