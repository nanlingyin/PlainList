import { defineStore } from 'pinia'
import { reactive } from 'vue'

/**
 * i18n store — holds translation overrides registered by plugins.
 * PluginRuntime hooks write here; Vue components read reactively.
 */
export const useI18nStore = defineStore('i18n', () => {
  // key → fn  (e.g. 'i18n:ui.nav.now' → () => '当下')
  const hooks = reactive({})

  function register(hookName, fn) {
    hooks[hookName] = fn
  }

  function unregisterByPrefix(prefix) {
    Object.keys(hooks).forEach(k => {
      if (k.startsWith(prefix)) delete hooks[k]
    })
  }

  function emit(hookName, fallback) {
    const fn = hooks[hookName]
    if (fn) {
      try { return fn(fallback) ?? fallback } catch { return fallback }
    }
    return fallback
  }

  /** Shorthand: t('nav.now', 'Now') → emit('i18n:ui.nav.now', 'Now') */
  function t(key, fallback) {
    return emit('i18n:ui.' + key, fallback !== undefined ? fallback : key)
  }

  /** Array hooks: L('DAYS', defaultArray) */
  function L(key, fallback) {
    return emit('i18n:' + key, fallback)
  }

  function clear() {
    Object.keys(hooks).forEach(k => delete hooks[k])
  }

  return { hooks, register, unregisterByPrefix, emit, t, L, clear }
})
