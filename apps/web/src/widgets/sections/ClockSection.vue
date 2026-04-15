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
              <div class="focus-head-side">
                <button
                  class="focus-help-trigger"
                  type="button"
                  :aria-label="t('reward.help_trigger', 'Reward rules')"
                  @click="openRewardHelp"
                >
                  ?
                </button>
                <div class="focus-today-points">
                  <strong>{{ rewards.overview?.todayPoints ?? 0 }}</strong>
                  <span>{{ t('reward.points_today', 'today points') }}</span>
                  <em class="focus-level-chip">{{ levelLabel }}</em>
                </div>
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
              <div class="focus-foot-label">{{ t('reward.next_achievement', 'Next achievement') }}</div>
              <div class="focus-foot-value">{{ nextAchievementLabel }}</div>
              <div v-if="nextAchievement" class="focus-foot-category">{{ nextAchievementCategory }}</div>
              <div class="focus-foot-sub">{{ nextAchievementProgressLabel }}</div>
              <div v-if="nextAchievementCondition" class="focus-foot-sub">{{ nextAchievementCondition }}</div>
            </div>
            <div class="focus-last-event">
              <div class="focus-foot-label">{{ t('reward.recent', 'Recent reward') }}</div>
              <div class="focus-foot-value">{{ recentEventLabel }}</div>
              <div class="focus-foot-sub">{{ recentEventSub }}</div>
            </div>
          </div>

          <div class="focus-achievement-panel">
            <div class="focus-achievement-panel-head">
              <div>
                <div class="focus-foot-label">{{ t('reward.earned_achievements', 'Earned achievements') }}</div>
                <div class="focus-achievement-panel-count">{{ earnedAchievements.length }} / {{ allAchievements.length }}</div>
              </div>
              <a
                href="#s7"
                class="focus-achievement-toggle"
                @click.prevent="scrollToAchievements"
              >
                {{ t('achievements.view_all', 'View all') }} →
              </a>
            </div>

            <div v-if="earnedAchievements.length" class="focus-achievement-list">
              <article
                v-for="achievement in earnedAchievements.slice(0, 3)"
                :key="achievement.id"
                class="focus-achievement-item"
              >
                <div class="focus-achievement-name">{{ achievementName(achievement) }}</div>
                <div class="focus-achievement-meta">
                  {{ achievementCategoryLabel(achievement) }}
                  <span v-if="achievement.achievedAt">· {{ formatAchievementDate(achievement.achievedAt) }}</span>
                </div>
              </article>
            </div>
            <div v-else class="focus-achievement-empty">
              {{ t('reward.achievement.none_earned', 'No achievements earned yet.') }}
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
  <Teleport to="body">
    <Transition name="day-popover-fade">
      <div
        v-if="helpOpen"
        class="day-popover-overlay"
        @click="closeRewardHelp"
      >
        <div
          class="day-popover focus-help-popover"
          :style="helpPopoverStyle"
          @click.stop
        >
          <div class="day-popover-head">
            <div>
              <div class="day-popover-date">{{ t('reward.help.title', 'Reward rules') }}</div>
            </div>
            <button class="focus-help-close" type="button" @click="closeRewardHelp" aria-label="Close">×</button>
          </div>
          <div class="focus-help-body">
            <div class="focus-help-section">
              <div class="focus-help-title">{{ t('reward.help.points_title', 'How points are earned') }}</div>
              <div class="focus-help-copy">{{ t('reward.help.points_body', 'Each completed focus session grants points, and perfect days add a fixed point bonus.') }}</div>
            </div>
            <div class="focus-help-section">
              <div class="focus-help-title">{{ t('reward.help.experience_title', 'How experience is earned') }}</div>
              <div class="focus-help-copy">{{ t('reward.help.experience_body', 'Each completed focus session grants experience, and perfect days add a fixed experience bonus.') }}</div>
            </div>
            <div class="focus-help-section">
              <div class="focus-help-title">{{ t('reward.help.formula_title', 'Focus reward examples') }}</div>
              <div class="focus-help-copy">{{ baseRewardHelp }}</div>
              <div class="focus-help-copy">{{ currentRewardHelp }}</div>
              <div class="focus-help-copy">{{ perfectDayBonusHelp }}</div>
              <div class="focus-help-copy">{{ t('reward.help.formula_hint', 'Longer focus durations and higher cycle counts increase rewards.') }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="day-popover-fade">
      <div
        v-if="helpDialogOpen"
        class="tracker-makeup-overlay"
        @click="closeRewardHelp"
      >
        <div class="tracker-makeup-dialog focus-help-dialog" @click.stop>
          <div class="tracker-makeup-head">
            <div>
              <div class="tracker-makeup-title">{{ t('reward.help.title', 'Reward rules') }}</div>
            </div>
            <button class="focus-help-close" type="button" @click="closeRewardHelp" aria-label="Close">×</button>
          </div>
          <div class="tracker-makeup-copy focus-help-body">
            <p><strong>{{ t('reward.help.points_title', 'How points are earned') }}</strong><br>{{ t('reward.help.points_body', 'Each completed focus session grants points, and perfect days add a fixed point bonus.') }}</p>
            <p><strong>{{ t('reward.help.experience_title', 'How experience is earned') }}</strong><br>{{ t('reward.help.experience_body', 'Each completed focus session grants experience, and perfect days add a fixed experience bonus.') }}</p>
            <p><strong>{{ t('reward.help.formula_title', 'Focus reward examples') }}</strong><br>{{ baseRewardHelp }}<br>{{ currentRewardHelp }}<br>{{ perfectDayBonusHelp }}<br>{{ t('reward.help.formula_hint', 'Longer focus durations and higher cycle counts increase rewards.') }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { FocusTimerSettings, RewardAchievementProgress, RewardEvent } from '@plainlist/shared'
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_CYCLES,
  DEFAULT_FOCUS_MINUTES,
  FOCUS_SESSION_EXPERIENCE,
  FOCUS_SESSION_POINTS,
  PERFECT_DAY_EXPERIENCE,
  PERFECT_DAY_POINTS,
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
const helpOpen = ref(false)
const helpDialogOpen = ref(false)
const helpPopoverStyle = ref<Record<string, string>>({})
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

function achievementName(achievement: RewardAchievementProgress) {
  return t(`reward.achievement.${achievement.id.replace('-', '_')}`, achievement.id)
}

function achievementCategoryLabel(achievement: RewardAchievementProgress) {
  return t(`reward.achievement.category.${achievement.category}`, achievement.category)
}

function achievementConditionLabel(achievement: RewardAchievementProgress) {
  return t(`reward.achievement.condition.${achievement.metric.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)}`, '{progress}/{target}', {
    target: achievement.target,
  })
}

const nextAchievement = computed(() => rewards.overview?.achievements.find((achievement) => !achievement.earned) ?? null)
const nextAchievementLabel = computed(() => nextAchievement.value
  ? achievementName(nextAchievement.value)
  : t('reward.all_achievements', 'All current achievements earned'))
const nextAchievementProgressLabel = computed(() => {
  if (!nextAchievement.value) {
    return t('reward.all_achievements_sub', 'You have cleared the current achievement set.')
  }

  return t('reward.achievement_progress', '{progress}/{target}', {
    progress: Math.min(nextAchievement.value.progress, nextAchievement.value.target),
    target: nextAchievement.value.target,
  })
})
const nextAchievementCondition = computed(() => {
  if (!nextAchievement.value) {
    return ''
  }

  return achievementConditionLabel(nextAchievement.value)
})
const nextAchievementCategory = computed(() => nextAchievement.value ? achievementCategoryLabel(nextAchievement.value) : '')
const allAchievements = computed(() => rewards.overview?.achievements ?? [])
const earnedAchievements = computed(() => allAchievements.value.filter((achievement) => achievement.earned))

function scrollToAchievements() {
  document.getElementById('s7')?.scrollIntoView({ behavior: 'smooth' })
}

function formatAchievementDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10)
  }

  return date.toLocaleDateString(i18n.locale === 'zh-CN' ? 'zh-CN' : 'en-US')
}

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
const baseRewardHelp = computed(() => t('reward.help.formula_base', 'Base reward: {focus} min focus / cycle {cycles} = +{points} points / +{experience} XP', {
  focus: DEFAULT_FOCUS_MINUTES,
  cycles: DEFAULT_CYCLES,
  points: FOCUS_SESSION_POINTS,
  experience: FOCUS_SESSION_EXPERIENCE,
}))
const currentRewardHelp = computed(() => t('reward.help.formula_current', 'Current setting: {focus} min focus / cycle {cycles} = +{points} points / +{experience} XP', {
  focus: focus.settings.focusMinutes ?? DEFAULT_FOCUS_MINUTES,
  cycles: focus.settings.cycles ?? DEFAULT_CYCLES,
  points: rewards.overview?.completedFocusSessions !== undefined
    ? Math.max(6, Math.round(FOCUS_SESSION_POINTS * Math.min(2.2, Math.max(0.6, (focus.settings.focusMinutes ?? DEFAULT_FOCUS_MINUTES) / DEFAULT_FOCUS_MINUTES)) * Math.min(1.3, 1 + Math.max((focus.settings.cycles ?? DEFAULT_CYCLES) - 4, 0) * 0.06)))
    : FOCUS_SESSION_POINTS,
  experience: rewards.overview?.completedFocusSessions !== undefined
    ? Math.max(8, Math.round(FOCUS_SESSION_EXPERIENCE * Math.min(2.2, Math.max(0.6, (focus.settings.focusMinutes ?? DEFAULT_FOCUS_MINUTES) / DEFAULT_FOCUS_MINUTES)) * Math.min(1.3, 1 + Math.max((focus.settings.cycles ?? DEFAULT_CYCLES) - 4, 0) * 0.06)))
    : FOCUS_SESSION_EXPERIENCE,
}))
const perfectDayBonusHelp = computed(() => t('reward.help.formula_bonus', 'Perfect day bonus: +{points} points / +{experience} XP', {
  points: PERFECT_DAY_POINTS,
  experience: PERFECT_DAY_EXPERIENCE,
}))

function buildPopoverStyle(event: Event) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return {}
  const rect = target.getBoundingClientRect()
  const width = Math.min(360, window.innerWidth - 24)
  const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12)
  const top = Math.min(rect.bottom + 14, window.innerHeight - 260)
  return {
    left: `${left}px`,
    top: `${Math.max(16, top)}px`,
    width: `${width}px`,
  }
}

function openRewardHelp(event: Event) {
  if (window.innerWidth <= 768) {
    helpDialogOpen.value = true
    helpOpen.value = false
    return
  }

  helpPopoverStyle.value = buildPopoverStyle(event)
  helpOpen.value = true
  helpDialogOpen.value = false
}

function closeRewardHelp() {
  helpOpen.value = false
  helpDialogOpen.value = false
}

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

<style scoped>
.focus-head-side {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.focus-help-trigger {
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, var(--bg) 18%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg) 8%, transparent);
  color: var(--bg);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 14px;
}

.focus-help-trigger:hover {
  background: color-mix(in srgb, var(--bg) 16%, transparent);
}

.focus-help-close {
  width: 32px;
  height: 32px;
  border: 1px solid color-mix(in srgb, var(--faint) 88%, var(--surface));
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface) 90%, var(--bg));
  color: var(--mid);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  transition: background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease;
}

.focus-help-close:hover {
  background: var(--dark);
  border-color: var(--dark);
  color: var(--bg);
  transform: translateY(-1px);
}

.focus-foot-category {
  margin-top: 6px;
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--bg) 48%, transparent);
}

.focus-achievement-panel {
  margin-top: 1px;
  padding: 18px;
  background: color-mix(in srgb, var(--dark) 82%, var(--bg) 16%);
  border-top: 1px solid color-mix(in srgb, var(--bg) 8%, transparent);
}

.focus-achievement-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.focus-achievement-panel-count {
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 24px;
  line-height: 1;
  color: var(--bg);
}

.focus-achievement-toggle {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--bg) 18%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg) 8%, transparent);
  color: var(--bg);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.focus-achievement-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.focus-achievement-item {
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--bg) 12%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg) 7%, transparent);
}

.focus-achievement-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--bg);
}

.focus-achievement-meta,
.focus-achievement-empty {
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.6;
  color: color-mix(in srgb, var(--bg) 58%, transparent);
}

.focus-help-popover,
.focus-help-dialog {
  border: 1px solid var(--faint);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
  box-shadow: 0 20px 54px rgba(17, 17, 17, .14);
}

.focus-help-popover {
  position: fixed;
  max-height: min(360px, calc(100vh - 32px));
  padding: 16px;
  overflow: auto;
}

.focus-help-dialog {
  position: fixed;
  left: 50%;
  top: 50%;
  width: min(420px, calc(100vw - 24px));
  transform: translate(-50%, -50%);
  padding: 18px;
}

.focus-help-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.focus-help-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.focus-help-title {
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
}

.focus-help-copy {
  font-size: 12px;
  line-height: 1.7;
  color: var(--mid);
}

.day-popover-fade-enter-active,
.day-popover-fade-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}

.day-popover-fade-enter-from,
.day-popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .focus-head-side {
    width: 100%;
    justify-content: space-between;
  }

  .focus-achievement-list {
    grid-template-columns: 1fr;
  }
}
</style>
