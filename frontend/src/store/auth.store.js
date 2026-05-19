import { create } from 'zustand'
import { authAPI } from '../api'

const useAuthStore = create((set) => ({
  user:  null,
  token: localStorage.getItem('token') || null,
  loading: false,

  login: async (username, password) => {
    set({ loading: true })
    try {
      const { data } = await authAPI.login({ username, password })
      localStorage.setItem('token', data.data.token)
      set({ user: data.data.user, token: data.data.token, loading: false })
      return data.data
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: async () => {
    try { await authAPI.logout() } catch (_) {}
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const { data } = await authAPI.me()
      set({ user: data.data })
    } catch (_) {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },
}))

export default useAuthStore
