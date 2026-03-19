import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { useApi } from '@/composables/useApi'
import { useI18nStore } from './i18n'

export const usePluginsStore = defineStore('plugins', () => {
  const { get, post, del } = useApi()
  const i18n = useI18nStore()

  const installedIds = ref(new Set())
  const available = ref([])
  // CSS vars currently applied
  const themeVars = reactive({
    '--bg': '#F7F7F7', '--surface': '#FFFFFF', '--dark': '#111111',
    '--mid': '#555555', '--muted': '#999999', '--faint': '#E4E4E4', '--faint2': '#EFEFEF',
  })
  // saved vars before preview
  let savedVars = null
  const previewing = ref(false)

  function applyVars(vars) {
    Object.assign(themeVars, vars)
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
    requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('theme:changed')))
  }

  function previewTheme(vars) {
    if (!previewing.value) savedVars = { ...themeVars }
    previewing.value = true
    applyVars(vars)
  }

  function revertTheme() {
    if (savedVars) applyVars(savedVars)
    savedVars = null
    previewing.value = false
  }

  async function loadActiveTheme() {
    try {
      const { themeId } = await get('/plugins/active-theme')
      if (!themeId || themeId === 'default') return
      const tp = available.value.find(p => p.id === 'theme-pack')
      const theme = tp?.themes?.find(t => t.id === themeId)
      if (theme) applyVars(theme.vars)
    } catch {}
  }

  async function getActiveThemeId() {
    return get('/plugins/active-theme')
  }

  async function saveTheme(themeId) {
    await post('/plugins/active-theme', { themeId })
    savedVars = null
    previewing.value = false
  }

  async function loadAvailable() {
    available.value = await get('/plugins/available')
  }

  async function loadInstalled() {
    const list = await get('/plugins/installed')
    installedIds.value = new Set(list.filter(p => p.enabled).map(p => p.id))
    // Execute plugin scripts so i18n hooks register
    for (const p of list) {
      if (p.enabled) await loadPluginScript(p.id)
    }
  }

  /** Fetch and execute a plugin JS file via the PluginRuntime shim */
  async function loadPluginScript(pluginId) {
    try {
      const token = sessionStorage.getItem('pl_token')
      const res = await fetch(`/api/plugins/file/${pluginId}`, {
        headers: { Authorization: 'Bearer ' + token }
      })
      if (!res.ok) return
      const code = res.text ? await res.text() : ''
      if (!code) return
      // Build a PluginRuntime shim that writes to the i18n store
      const PluginRuntime = {
        register(manifest) {
          const api = {
            on(hookName, fn) { i18n.register(hookName, fn) },
            theme(vars) { applyVars(vars) },
          }
          if (typeof manifest.setup === 'function') manifest.setup(api)
        }
      }
      try {
        new Function('PluginRuntime', code)(PluginRuntime)
      } catch (e) {
        console.warn('Plugin error:', pluginId, e)
      }
    } catch (e) {
      console.warn('Could not load plugin:', pluginId, e)
    }
  }

  async function install(pluginId) {
    await post('/plugins/install', { pluginId })
    installedIds.value.add(pluginId)
  }

  async function uninstall(pluginId) {
    await del('/plugins/uninstall/' + pluginId)
    installedIds.value.delete(pluginId)
    revertTheme()
  }

  function clear() {
    installedIds.value = new Set()
    previewing.value = false
    savedVars = null
    i18n.clear()
  }

  return {
    installedIds, available, themeVars, previewing,
    applyVars, previewTheme, revertTheme, loadActiveTheme, getActiveThemeId, saveTheme,
    loadAvailable, loadInstalled, install, uninstall, clear,
  }
})
