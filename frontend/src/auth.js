const KEY = 'simba_token'

export const getToken  = () => localStorage.getItem(KEY)
export const setToken  = (t) => localStorage.setItem(KEY, t)
export const clearToken = () => localStorage.removeItem(KEY)

export const apiFetch = (url, opts = {}) => {
  const token = getToken()
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'Authorization': token ? `Bearer ${token}` : '',
    }
  }).then(res => {
    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return res
  })
}
