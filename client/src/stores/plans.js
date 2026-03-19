import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const usePlansStore = defineStore('plans', () => {
  const { get, post, put, del } = useApi()
  const plans = ref([])

  async function fetch() {
    plans.value = await get('/plans')
  }

  async function add(name, type, time) {
    const p = await post('/plans', { name, type, time })
    plans.value.push(p)
    return p
  }

  async function remove(id) {
    await del('/plans/' + id)
    plans.value = plans.value.filter(p => p.id !== id)
  }

  function clear() { plans.value = [] }

  return { plans, fetch, add, remove, clear }
})
