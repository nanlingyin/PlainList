<template>
  <div id="app-root">
    <AuthTerminal v-if="!auth.isLoggedIn" @login="onLogin" />
    <template v-else>
      <nav>
        <div class="nav-logo">PL/</div>
        <div class="nav-links">
          <a v-for="s in sections" :key="s.id" :href="'#' + s.id"
             :class="{ active: activeSection === s.id }"
             @click.prevent="scrollTo(s.id)">{{ s.label }}</a>
        </div>
        <div class="nav-right">
          <span id="nav-user">{{ auth.currentUser }}</span>
          <button id="nav-plugins" title="Plugins" @click="pluginStoreOpen = true">⊞</button>
          <button id="nav-logout" @click="logout">{{ t('nav.lock', 'lock') }}</button>
        </div>
      </nav>

      <ClockSection id="s1" />
      <PlansSection id="s2" />
      <TrackerSection id="s3" />
      <CalendarSection id="s4" />
      <WeekSection id="s5" />

      <PluginStore v-if="pluginStoreOpen" @close="onPluginStoreClose" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlansStore } from '@/stores/plans'
import { useChecksStore } from '@/stores/checks'
import { usePluginsStore } from '@/stores/plugins'
import { useI18nStore } from '@/stores/i18n'
import { useApi } from '@/composables/useApi'
import AuthTerminal from '@/components/auth/AuthTerminal.vue'
import ClockSection from '@/components/sections/ClockSection.vue'
import PlansSection from '@/components/sections/PlansSection.vue'
import TrackerSection from '@/components/sections/TrackerSection.vue'
import CalendarSection from '@/components/sections/CalendarSection.vue'
import WeekSection from '@/components/sections/WeekSection.vue'
import PluginStore from '@/components/plugins/PluginStore.vue'

const auth = useAuthStore()
const plans = usePlansStore()
const checks = useChecksStore()
const pluginsStore = usePluginsStore()
const i18n = useI18nStore()
const { get } = useApi()

const pluginStoreOpen = ref(false)
const activeSection = ref('s1')

const sections = computed(() => [
  { id: 's1', label: i18n.t('nav.now', 'Now') },
  { id: 's2', label: i18n.t('nav.day', 'Day') },
  { id: 's3', label: i18n.t('nav.month', 'Month') },
  { id: 's4', label: i18n.t('nav.year', 'Year') },
  { id: 's5', label: i18n.t('nav.week', 'Week') },
])

function t(key, fallback) { return i18n.t(key, fallback) }

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  activeSection.value = id
}

// Track active section on scroll
let scrollTimer = null
function onScroll() {
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    for (const s of [...sections.value].reverse()) {
      const el = document.getElementById(s.id)
      if (el && el.getBoundingClientRect().top <= 80) {
        activeSection.value = s.id
        return
      }
    }
    activeSection.value = 's1'
  }, 50)
}

async function onLogin() {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth() + 1
  await Promise.all([
    plans.fetch(),
    checks.fetchMonth(y, m),
    checks.fetchMonth(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1),
    pluginsStore.loadInstalled(),
    pluginsStore.loadAvailable().then(() => pluginsStore.loadActiveTheme()),
  ])
}

async function logout() {
  plans.clear()
  checks.clear()
  pluginsStore.clear()
  // Reset theme to default
  pluginsStore.applyVars({
    '--bg': '#F7F7F7', '--surface': '#FFFFFF', '--dark': '#111111',
    '--mid': '#555555', '--muted': '#999999', '--faint': '#E4E4E4', '--faint2': '#EFEFEF',
  })
  auth.logout()
}

function onPluginStoreClose() {
  pluginStoreOpen.value = false
  if (pluginsStore.previewing) pluginsStore.revertTheme()
}

// Auto-login if token exists
onMounted(async () => {
  window.addEventListener('scroll', onScroll)
  if (auth.token) {
    try {
      const me = await get('/auth/me')
      // Load theme before showing UI to avoid flash
      await pluginsStore.loadAvailable()
      await pluginsStore.loadActiveTheme()
      auth.setAuth(auth.token, me.username, me.isAdmin)
      // Load remaining data in parallel
      const now = new Date()
      const y = now.getFullYear(), m = now.getMonth() + 1
      await Promise.all([
        plans.fetch(),
        checks.fetchMonth(y, m),
        checks.fetchMonth(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1),
        pluginsStore.loadInstalled(),
      ])
    } catch {
      auth.logout()
    }
  }
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>
