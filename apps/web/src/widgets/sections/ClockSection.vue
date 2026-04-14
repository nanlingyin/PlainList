<template>
  <section id="s1">
    <div class="s1-grid">
      <div class="clock-panel">
        <div class="sec-tag"><span>01</span> &nbsp;/&nbsp; {{ t('section.now', 'Now') }}</div>
        <div id="clock-time">
          <span id="ct-hm">{{ hm }}</span><span id="ct-sec" style="font-size:.45em;color:var(--mid);vertical-align:baseline">{{ sec }}</span>
        </div>
        <div id="clock-date">{{ dateStr }}</div>
        <div id="clock-week">{{ weekDayLabel }}</div>
        <div class="clock-motto">{{ t('clock.motto', 'Every second is irreversible.') }}</div>
      </div>

      <div class="progress-panel">
        <div class="focus-panel">
          <div class="sec-tag"><span>{{ t('focus.tag', 'Focus') }}</span></div>

          <div class="focus-card">
            <div class="focus-head">
              <div>
                <div class="focus-phase">{{ focusPhaseLabel }}</div>
                <div class="focus-phase-sub">{{ focusPhaseSub }}</div>
              </div>
              <div class="focus-today-points">
                <strong>{{ rewards.overview?.todayPoints ?? 0 }}</strong>
                <span>{{ t('reward.points_today', 'today points') }}</span>
                <em class="focus-level-chip">{{ levelLabel }}</em>
              </div>
            </div>

            <div class="focus-display">{{ timerDisplay }}</div>

            <div v-if="focus.phase === 'focus'" class="focus-plan-row">
              <label class="focus-plan-label" for="focus-plan-select">{{ t('focus.link_label', 'Linked plan') }}</label>
              <select
                id="focus-plan-select"
                v-model="selectedPlan"
                class="focus-plan-select"
                :disabled="Boolean(focus.activeSession)"
              >
                <option value="">{{ t('focus.link_none', 'No linked plan') }}</option>
                <option v-for="plan in plans.plans" :key="plan.id" :value="String(plan.id)">
                  {{ plan.name }}
                </option>
              </select>
            </div>
            <div v-else class="focus-break-copy">
              {{ t('focus.break_copy', 'Short pause. Start the next round when you are ready.') }}
            </div>

            <div class="focus-actions">
              <button class="focus-btn primary" :disabled="focus.loading" @click="onPrimaryAction">
                {{ primaryActionLabel }}
              </button>
              <button
                v-if="secondaryActionLabel"
                class="focus-btn"
                :disabled="focus.loading"
                @click="onSecondaryAction"
              >
                {{ secondaryActionLabel }}
              </button>
              <button
                v-if="!focus.activeSession && focus.mode !== 'break'"
                class="focus-btn"
                :disabled="focus.loading"
                @click="openSettings"
              >
                {{ t('focus.action.settings', 'Settings') }}
              </button>
            </div>

            <div v-if="settingsOpen && !focus.activeSession && focus.mode !== 'break'" class="focus-settings">
              <label class="focus-settings-field">
                <span>{{ t('focus.settings.focus', 'Focus minutes') }}</span>
                <input v-model.number="pendingSettings.focusMinutes" type="number" min="5" max="60" class="focus-settings-input">
              </label>
              <label class="focus-settings-field">
                <span>{{ t('focus.settings.break', 'Break minutes') }}</span>
                <input v-model.number="pendingSettings.breakMinutes" type="number" min="1" max="30" class="focus-settings-input">
              </label>
              <label class="focus-settings-field">
                <span>{{ t('focus.settings.cycles', 'Cycles') }}</span>
                <input v-model.number="pendingSettings.cycles" type="number" min="2" max="8" class="focus-settings-input">
              </label>
              <div class="focus-settings-actions">
                <button class="focus-btn primary" :disabled="focus.loading" @click="saveSettings">
                  {{ t('focus.action.save_settings', 'Save') }}
                </button>
                <button class="focus-btn" :disabled="focus.loading" @click="settingsOpen = false">
                  {{ t('focus.action.close_settings', 'Close') }}
                </button>
              </div>
            </div>

            <div class="focus-meta">
              <span>{{ focusMetaLabel }}</span>
              <span>{{ t('focus.sessions_today', '{count} sessions today', { count: rewards.overview?.completedFocusSessionsToday ?? 0 }) }}</span>
            </div>

            <div v-if="focus.error" class="focus-error">{{ focus.error }}</div>
          </div>

          <div class="focus-reward-grid">
            <div class="focus-reward-card">
              <div class="focus-reward-kicker">{{ t('reward.total_points', 'Total points') }}</div>
              <div class="focus-reward-value">{{ rewards.overview?.totalPoints ?? 0 }}</div>
            </div>
            <div class="focus-reward-card">
              <div class="focus-reward-kicker">{{ t('reward.total_focus', 'Focus sessions') }}</div>
              <div class="focus-reward-value">{{ rewards.overview?.completedFocusSessions ?? 0 }}</div>
            </div>
            <div class="focus-reward-card">
              <div class="focus-reward-kicker">{{ t('reward.streak', 'Perfect streak') }}</div>
              <div class="focus-reward-value">{{ rewards.overview?.currentPerfectStreak ?? 0 }}</div>
            </div>
          </div>

          <div class="focus-foot">
            <div class="focus-next-badge">
              <div class="focus-foot-label">{{ t('reward.next_badge', 'Next badge') }}</div>
              <div class="focus-foot-value">{{ nextBadgeLabel }}</div>
              <div class="focus-foot-sub">{{ nextBadgeProgressLabel }}</div>
            </div>
            <div class="focus-last-event">
              <div class="focus-foot-label">{{ t('reward.recent', 'Recent reward') }}</div>
              <div class="focus-foot-value">{{ recentEventLabel }}</div>
              <div class="focus-foot-sub">{{ recentEventSub }}</div>
            </div>
          </div>
        </div>

        <div class="progress-shell">
          <div class="sec-tag"><span>{{ t('section.progress', 'Progress') }}</span></div>
          <div class="prog-item">
            <div class="prog-header">
              <span class="prog-label">{{ t('prog.year', 'Year') }}</span>
              <div><div class="prog-pct">{{ yearPct }}%</div><div class="prog-sub">{{ yearProgressLabel }}</div></div>
            </div>
            <div class="prog-track"><div class="prog-fill" :style="{ width: yearPct + '%' }"></div></div>
            <div class="prog-dots">
              <div v-for="i in 10" :key="i" :class="['prog-dot', i <= Math.round(yearPct/10) ? 'on' : '']"></div>
            </div>
          </div>
          <div class="prog-item">
            <div class="prog-header">
              <span class="prog-label">{{ t('prog.month', 'Month') }}</span>
              <div><div class="prog-pct">{{ monthPct }}%</div><div class="prog-sub">{{ monthProgressLabel }}</div></div>
            </div>
            <div class="prog-track"><div class="prog-fill" :style="{ width: monthPct + '%' }"></div></div>
            <div class="prog-dots">
              <div v-for="i in daysInMonth" :key="i" :class="['prog-dot', i <= dayOfMonth ? 'on' : '']"></div>
            </div>
          </div>
          <div class="prog-item">
            <div class="prog-header">
              <span class="prog-label">{{ t('prog.today', 'Today') }}</span>
              <div><div class="prog-pct">{{ dayPct }}%</div><div class="prog-sub">{{ dayProgressLabel }}</div></div>
            </div>
            <div class="prog-track"><div class="prog-fill" :style="{ width: dayPct + '%' }"></div></div>
            <div class="prog-dots">
              <div v-for="i in 24" :key="i" :class="['prog-dot', i <= Math.round(dayPct / 100 * 24) ? 'on' : '']"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FocusTimerSettings, RewardBadgeProgress, RewardEvent } from '@plainlist/shared'
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_CYCLES,
  DEFAULT_FOCUS_MINUTES,
} from '@plainlist/shared'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useFocusStore } from '@/features/focus/model/useFocusStore'
import { usePlansStore } from '@/features/plans/model/usePlansStore'
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore'
import { useI18nStore } from '@/shared/i18n/useI18nStore'

const i18n = useI18nStore()
const plans = usePlansStore()
const focus = useFocusStore()
const rewards = useRewardsStore()

function t(key: string, fallback: string, params?: Record<string, string | number>) {
  return i18n.t(key, fallback, params)
}

const DAYS_DEFAULT = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS_DEFAULT = ['January','February','March','April','May','June','July','August','September','October','November','December']

function pad(n: number) { return String(n).padStart(2, '0') }
function ordinal(n: number) {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const now = ref(new Date())
const selectedPlan = ref('')
const settingsOpen = ref(false)
const pendingSettings = ref<FocusTimerSettings>({ ...focus.settings })
let timer: number | null = null

const hm = computed(() => pad(now.value.getHours()) + ':' + pad(now.value.getMinutes()))
const sec = computed(() => ':' + pad(now.value.getSeconds()))

const dayOfYear = computed(() => Math.floor((now.value.getTime() - new Date(now.value.getFullYear(), 0, 0).getTime()) / 86400000))
const daysInYear = computed(() => {
  const y = now.value.getFullYear()
  return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 366 : 365
})
const weekNum = computed(() => pad(Math.ceil(dayOfYear.value / 7)))
const yearPct = computed(() => Math.round(dayOfYear.value / daysInYear.value * 100))

const dayOfMonth = computed(() => now.value.getDate())
const daysInMonth = computed(() => new Date(now.value.getFullYear(), now.value.getMonth() + 1, 0).getDate())
const monthPct = computed(() => Math.round(dayOfMonth.value / daysInMonth.value * 100))

const dayPct = computed(() => {
  const seconds = now.value.getHours() * 3600 + now.value.getMinutes() * 60 + now.value.getSeconds()
  return Math.round(seconds / 86400 * 100)
})

const days = computed(() => i18n.L('DAYS', DAYS_DEFAULT))
const months = computed(() => i18n.L('MONTHS', MONTHS_DEFAULT))

const dateStr = computed(() => {
  if (i18n.locale === 'zh-CN') {
    return `${now.value.getFullYear()}年${now.value.getMonth() + 1}月${now.value.getDate()}日 ${days.value[now.value.getDay()]}`
  }

  return `${days.value[now.value.getDay()]}, ${months.value[now.value.getMonth()]} ${ordinal(now.value.getDate())}, ${now.value.getFullYear()}`
})

const weekDayLabel = computed(() => t('clock.week_day', 'Week {week} · Day {day}', {
  week: weekNum.value,
  day: dayOfYear.value,
}))

const yearProgressLabel = computed(() => t('prog.days_elapsed', '{current} / {total} days', {
  current: dayOfYear.value,
  total: daysInYear.value,
}))

const monthProgressLabel = computed(() => t('prog.days_elapsed', '{current} / {total} days', {
  current: dayOfMonth.value,
  total: daysInMonth.value,
}))

const dayProgressLabel = computed(() => t('prog.time_elapsed', '{time} / 24:00', {
  time: `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}`,
}))

const timerDisplay = computed(() => `${pad(Math.floor(focus.remainingSeconds / 60))}:${pad(focus.remainingSeconds % 60)}`)
const focusPhaseLabel = computed(() => {
  if (focus.mode === 'break') {
    return t('focus.phase.break', 'Break')
  }

  if (focus.activeSession) {
    return t('focus.phase.focus', 'Focus')
  }

  return t('focus.phase.ready', 'Ready')
})
const focusPhaseSub = computed(() => {
  if (focus.mode === 'break') {
    return t('focus.phase.break_sub', 'Pause briefly before the next round.')
  }

  if (focus.activeSession?.planName) {
    return t('focus.phase.linked', 'Linked to {name}', { name: focus.activeSession.planName })
  }

  return t('focus.phase.ready_sub', 'Start a focus round when you are ready.')
})
const levelLabel = computed(() => `Lv. ${rewards.overview?.level ?? 1}`)
const primaryActionLabel = computed(() => {
  if (focus.mode === 'break') {
    return focus.running ? t('focus.action.pause', 'Pause') : t('focus.action.resume', 'Resume')
  }

  if (!focus.activeSession) {
    return t('focus.action.start', 'Start focus')
  }

  return focus.running ? t('focus.action.pause', 'Pause') : t('focus.action.resume', 'Resume')
})
const secondaryActionLabel = computed(() => {
  if (focus.mode === 'break') {
    return t('focus.action.skip_break', 'Skip break')
  }

  if (focus.activeSession) {
    return t('focus.action.cancel', 'Cancel')
  }

  return ''
})
const focusMetaLabel = computed(() => {
  if (focus.mode === 'break') {
    return t('focus.break_meta', '{minutes} min break', {
      minutes: focus.breakMinutes || focus.settings.breakMinutes || DEFAULT_BREAK_MINUTES,
    })
  }

  return t('focus.default_cycle', '{focus} min focus · {breakTime} min break · cycle {cycles}', {
    focus: focus.activeSession?.focusMinutes ?? focus.settings.focusMinutes ?? DEFAULT_FOCUS_MINUTES,
    breakTime: focus.activeSession?.breakMinutes ?? focus.settings.breakMinutes ?? DEFAULT_BREAK_MINUTES,
    cycles: focus.activeSession?.cycleInterval ?? focus.settings.cycles ?? DEFAULT_CYCLES,
  })
})

function badgeName(badge: RewardBadgeProgress) {
  const map: Record<string, string> = {
    'first-focus': t('reward.badge.first_focus', 'First focus session'),
    'focus-8': t('reward.badge.focus_8', '8 focus sessions'),
    'focus-25': t('reward.badge.focus_25', '25 focus sessions'),
    'perfect-day-1': t('reward.badge.perfect_day', 'First perfect day'),
    'streak-3': t('reward.badge.streak_3', '3-day perfect streak'),
    'streak-7': t('reward.badge.streak_7', '7-day perfect streak'),
  }

  return map[badge.id] || badge.id
}

const nextBadge = computed(() => rewards.overview?.badges.find((badge) => !badge.earned) ?? null)
const nextBadgeLabel = computed(() => nextBadge.value ? badgeName(nextBadge.value) : t('reward.all_badges', 'All current badges earned'))
const nextBadgeProgressLabel = computed(() => {
  if (!nextBadge.value) {
    return t('reward.all_badges_sub', 'You have cleared the current reward set.')
  }

  return t('reward.badge_progress', '{progress}/{target}', {
    progress: Math.min(nextBadge.value.progress, nextBadge.value.target),
    target: nextBadge.value.target,
  })
})

function describeEvent(event: RewardEvent | null) {
  if (!event) {
    return {
      label: t('reward.none', 'No recent reward yet'),
      sub: t('reward.none_sub', 'Complete a focus session or a perfect day to see updates here.'),
    }
  }

  if (event.kind === 'perfect-day') {
    return {
      label: t('reward.event.perfect_day', 'Perfect day'),
      sub: t('reward.event.perfect_day_sub', '{date} · +{points} points', {
        date: event.date,
        points: event.points,
      }),
    }
  }

  return {
    label: event.planName
      ? t('reward.event.focus_linked', 'Focus session · {name}', { name: event.planName })
      : t('reward.event.focus', 'Focus session'),
    sub: t('reward.event.focus_sub', '{date} · +{points} points', {
      date: event.date,
      points: event.points,
    }),
  }
}

const recentEvent = computed(() => rewards.overview?.recentEvents[0] ?? null)
const recentEventLabel = computed(() => describeEvent(recentEvent.value).label)
const recentEventSub = computed(() => describeEvent(recentEvent.value).sub)

async function onPrimaryAction() {
  if (focus.mode === 'break') {
    if (focus.running) {
      await focus.pause()
    } else {
      await focus.resume()
    }
    return
  }

  if (!focus.activeSession) {
    await focus.start(selectedPlan.value ? Number(selectedPlan.value) : null)
    return
  }

  if (focus.running) {
    await focus.pause()
  } else {
    await focus.resume()
  }
}

async function onSecondaryAction() {
  if (focus.mode === 'break') {
    focus.skipBreak()
    return
  }

  await focus.cancel()
}

function openSettings() {
  pendingSettings.value = { ...focus.settings }
  settingsOpen.value = !settingsOpen.value
}

async function saveSettings() {
  await focus.saveSettings({ ...pendingSettings.value })
  settingsOpen.value = false
}

onMounted(() => {
  timer = window.setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  if (timer !== null) {
    window.clearInterval(timer)
  }
})
</script>
