import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useChecksStore = defineStore('checks', () => {
  const { get, put } = useApi()
  // { planId: { 'YYYY-MM-DD': true/false } }
  const checks = ref({})

  async function fetchRange(from, to) {
    const rows = await get(`/checks?from=${from}&to=${to}`)
    // rows is { planId: { dateKey: bool } }
    Object.keys(rows).forEach(pid => {
      if (!checks.value[pid]) checks.value[pid] = {}
      Object.assign(checks.value[pid], rows[pid])
    })
  }

  async function fetchMonth(year, month) {
    const pad = n => String(n).padStart(2, '0')
    const from = `${year}-${pad(month)}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${pad(month)}-${pad(lastDay)}`
    await fetchRange(from, to)
  }

  function isChecked(planId, dateKey) {
    return !!(checks.value[planId]?.[dateKey])
  }

  async function toggle(planId, dateKey) {
    const current = isChecked(planId, dateKey)
    const next = !current
    // Optimistic update
    if (!checks.value[planId]) checks.value[planId] = {}
    checks.value[planId][dateKey] = next
    try {
      await put('/checks', { planId, date: dateKey, done: next })
    } catch(e) {
      // Revert on failure
      checks.value[planId][dateKey] = current
      throw e
    }
  }

  function clear() { checks.value = {} }

  return { checks, fetchRange, fetchMonth, isChecked, toggle, clear }
})
