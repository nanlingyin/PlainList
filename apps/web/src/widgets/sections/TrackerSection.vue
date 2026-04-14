<template>
  <section class="tracker-section">
    <div class="s3-nav">
      <button class="s3-btn" @click="prevMonth">&#8249;</button>
      <span class="s3-month-label">{{ monthLabel }}</span>
      <button class="s3-btn" @click="nextMonth">&#8250;</button>
      <button class="s3-btn s3-today-btn" @click="goToday">{{ t('tracker.today', 'Today') }}</button>
    </div>

    <div v-if="rewardSummary" class="tracker-reward-summary">
      <div class="tracker-reward-item">
        <span class="tracker-reward-label">{{ t('reward.points', 'Points') }}</span>
        <strong class="tracker-reward-value">{{ rewardSummary.points }}</strong>
      </div>
      <div class="tracker-reward-item">
        <span class="tracker-reward-label">{{ t('reward.focus_sessions', 'Focus sessions') }}</span>
        <strong class="tracker-reward-value">{{ rewardSummary.completedFocusSessions }}</strong>
      </div>
      <div class="tracker-reward-item">
        <span class="tracker-reward-label">{{ t('reward.perfect_days', 'Perfect days') }}</span>
        <strong class="tracker-reward-value">{{ rewardSummary.perfectDays }}</strong>
      </div>
      <div class="tracker-reward-item">
        <span class="tracker-reward-label">{{ t('reward.badges', 'Badges') }}</span>
        <strong class="tracker-reward-value">{{ rewardSummary.earnedBadges }}</strong>
      </div>
    </div>

    <div v-if="!plans.plans.length" class="empty-state">
      <div class="empty-state-text">{{ t('tracker.empty', 'Add plans in the Day section to start tracking') }}</div>
    </div>

    <template v-else>
      <div class="tracker-table-wrap tracker-desktop">
        <table class="tracker-table">
          <thead>
            <tr class="tr-week">
              <th class="th-name col-name">{{ t('tracker.task_habit', 'Task / Habit') }}</th>
              <th
                v-for="(wk, wi) in weeks"
                :key="'wk' + wi"
                :colspan="7"
                :class="weekHasToday(wk) ? 'th-week-today' : ''"
              >{{ t('tracker.week_prefix', 'Week') }} {{ wi + 1 }}</th>
              <th class="th-pct col-pct">%</th>
            </tr>
            <tr class="tr-day">
              <th class="th-name col-name">{{ shortMonthLabel }}</th>
              <template v-for="(wk, wi) in weeks" :key="'wkd' + wi">
                <th
                  v-for="(cell, wd) in wk"
                  :key="'d' + wi + '-' + wd"
                  class="col-day"
                  :class="cell && dateKey(cell.year, cell.month, cell.day) === tKey ? 'th-today-day' : ''"
                >
                  <span class="col-day-wd">{{ weekDayHeaders[wd] }}</span>
                  <template v-if="cell">
                    <br />
                    <span
                      class="col-day-num"
                      :style="{ color: dateKey(cell.year, cell.month, cell.day) === tKey ? 'var(--dark)' : 'var(--muted)', fontSize: '8px' }"
                    >{{ cell.day }}</span>
                  </template>
                </th>
              </template>
              <th class="th-pct col-pct">{{ t('tracker.done_col', 'Done') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in groups" :key="group.label">
              <template v-if="group.items.length">
                <tr class="tr-group-sep">
                  <td class="td-name-group" :colspan="1 + weeks.length * 7 + 1">{{ group.label }}</td>
                </tr>
                <tr v-for="plan in group.items" :key="plan.id" class="tr-habit-row">
                  <td class="td-name col-name">
                    <div class="td-name-inner">
                      <div :class="['td-type-dot', plan.type]"></div>
                      <div class="td-plan-name" :title="plan.name">{{ plan.name }}</div>
                    </div>
                  </td>
                  <template v-for="(wk, wi) in weeks" :key="'row' + plan.id + 'wk' + wi">
                    <td
                      v-for="(cell, wd) in wk"
                      :key="'row' + plan.id + 'd' + wi + '-' + wd"
                      class="td-check col-day"
                      :class="[
                        wd === 6 && wi !== weeks.length - 1 ? 'tc-week-sep' : '',
                        !cell ? 'tc-empty' : '',
                        cell && isFuture(cell) ? 'tc-future-col' : '',
                        cell && dateKey(cell.year, cell.month, cell.day) === tKey ? 'tc-today-col' : '',
                      ]"
                    >
                      <span v-if="!cell" class="chk-box chk-empty"></span>
                      <span v-else-if="isFuture(cell)" class="chk-box chk-future"></span>
                      <span
                        v-else
                        class="chk-box"
                        :class="checks.isChecked(plan.id, dateKey(cell.year, cell.month, cell.day)) ? 'chk-done' : ''"
                        @click.stop="handleCellClick(plan, cell)"
                      ></span>
                    </td>
                  </template>
                  <td class="td-pct col-pct">{{ planPct(plan) }}</td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <div class="tracker-mobile">
        <div class="tracker-mobile-weekdays">
          <span v-for="weekday in weekDayHeaders" :key="weekday" class="tracker-mobile-weekday">{{ weekday }}</span>
        </div>

        <template v-for="group in groups" :key="`mobile-${group.label}`">
          <div v-if="group.items.length" class="tracker-mobile-group">
            <div class="tracker-mobile-group-label">{{ group.label }}</div>

            <div class="tracker-mobile-card-list">
              <div v-for="plan in group.items" :key="`mobile-${plan.id}`" class="tracker-mobile-card">
                <div class="tracker-mobile-card-head">
                  <div class="tracker-mobile-card-copy">
                    <span :class="['td-type-dot', plan.type]"></span>
                    <span class="tracker-mobile-card-name" :title="plan.name">{{ plan.name }}</span>
                  </div>
                  <span class="tracker-mobile-card-pct">{{ planPct(plan) }}</span>
                </div>

                <div class="tracker-mobile-grid">
                  <template v-for="(wk, wi) in weeks" :key="`mobile-grid-${plan.id}-${wi}`">
                    <button
                      v-for="(cell, wd) in wk"
                      :key="`mobile-cell-${plan.id}-${wi}-${wd}`"
                      class="tracker-mobile-cell"
                      :class="mobileCellClasses(plan, cell)"
                      :disabled="!cell || isFuture(cell)"
                      @click.stop="onMobileCellClick(plan, cell)"
                    ></button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div v-if="trackerMessage" class="tracker-inline-message">{{ trackerMessage }}</div>

      <div class="tracker-summary">
        <div v-for="item in summary" :key="item.lbl" class="tsumm-item">
          <div class="tsumm-val">{{ item.val }}</div>
          <div class="tsumm-lbl">{{ item.lbl }}</div>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <Transition name="day-popover-fade">
        <div
          v-if="makeupDialogOpen && pendingMakeup"
          class="tracker-makeup-overlay"
          @click="closeMakeupDialog"
        >
          <div class="tracker-makeup-dialog" @click.stop>
            <div class="tracker-makeup-head">
              <div>
                <div class="tracker-makeup-title">{{ t('tracker.makeup.confirm_title', 'Use makeup card?') }}</div>
                <div class="tracker-makeup-meta">{{ pendingMakeup.planName }} · {{ pendingMakeup.date }}</div>
              </div>
              <button class="tracker-makeup-close" type="button" @click="closeMakeupDialog">x</button>
            </div>

            <div class="tracker-makeup-copy">
              <p>{{ t('tracker.makeup.confirm_body', 'Past missed dates must use a makeup card from here.') }}</p>
              <p>{{ t('tracker.makeup.available_cards', 'Available makeup cards: {count}', { count: makeupCardCount }) }}</p>
              <p>{{ t('tracker.makeup.consume_one', 'This action will consume 1 makeup card.') }}</p>
            </div>

            <div v-if="rewards.actionError" class="tracker-makeup-error">{{ rewards.actionError }}</div>
            <div v-else-if="makeupCardCount <= 0" class="tracker-makeup-error">
              {{ t('tracker.makeup.none', 'You do not have any makeup cards right now.') }}
            </div>

            <div class="tracker-makeup-actions">
              <button class="tracker-makeup-btn tracker-makeup-btn-secondary" type="button" @click="closeMakeupDialog">
                {{ t('tracker.makeup.cancel_action', 'Cancel') }}
              </button>
              <button
                class="tracker-makeup-btn"
                type="button"
                :disabled="rewards.actionLoading || makeupCardCount <= 0"
                @click="confirmMakeupCard"
              >
                {{ t('tracker.makeup.confirm_action', 'Use 1 card') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { usePlansStore } from '@/features/plans/model/usePlansStore'
import { useChecksStore } from '@/features/checks/model/useChecksStore'
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore'
import { useI18nStore } from '@/shared/i18n/useI18nStore'

const plans = usePlansStore()
const checks = useChecksStore()
const rewards = useRewardsStore()
const i18n = useI18nStore()
function t(key, fallback, params) { return i18n.t(key, fallback, params) }

const now = new Date()
const trackerYear = ref(now.getFullYear())
const trackerMonth = ref(now.getMonth())
const makeupDialogOpen = ref(false)
const pendingMakeup = ref(null)
const trackerMessage = ref('')

const MONTHS_DEFAULT = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT_DEFAULT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WDAYS_M_DEFAULT = ['Mo','Tu','We','Th','Fr','Sa','Su']

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isFuture(cell) {
  const cellDate = new Date(cell.year, cell.month, cell.day)
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  return cellDate > todayDate
}

function isPastDateKey(key) {
  return key < todayKey()
}

function getMonthWeeks(year, month) {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const result = []
  let day = 1 - firstDow

  while (day <= daysInMon) {
    const week = []
    for (let wd = 0; wd < 7; wd += 1) {
      week.push((day >= 1 && day <= daysInMon) ? { year, month, day } : null)
      day += 1
    }
    result.push(week)
  }

  return result
}

const monthNames = computed(() => i18n.L('MONTHS', MONTHS_DEFAULT))
const monthNamesShort = computed(() => i18n.L('MONTHS_S', MONTHS_SHORT_DEFAULT))
const weekDayHeaders = computed(() => i18n.L('WDAYS_M', WDAYS_M_DEFAULT))

const tKey = computed(() => todayKey())
const weeks = computed(() => getMonthWeeks(trackerYear.value, trackerMonth.value))
const rewardReferenceDate = computed(() => `${trackerYear.value}-${String(trackerMonth.value + 1).padStart(2, '0')}-01`)
const rewardSummary = computed(() => rewards.periods[`month:${rewardReferenceDate.value}`] || null)
const makeupCardCount = computed(() => rewards.overview?.inventory?.find((item) => item.itemId === 'makeup-card')?.quantity ?? 0)

const monthLabel = computed(() => (
  i18n.locale === 'zh-CN'
    ? `${trackerYear.value}年${trackerMonth.value + 1}月`
    : `${monthNames.value[trackerMonth.value]} ${trackerYear.value}`
))

const shortMonthLabel = computed(() => (
  i18n.locale === 'zh-CN'
    ? `${trackerYear.value}年${trackerMonth.value + 1}月`
    : `${monthNamesShort.value[trackerMonth.value]} ${trackerYear.value}`
))

const groups = computed(() => [
  { label: t('tracker.group.habits', 'Habits · daily recurring'), items: plans.plans.filter((plan) => plan.type === 'habit') },
  { label: t('tracker.group.tasks', 'Tasks · one-time items'), items: plans.plans.filter((plan) => plan.type === 'todo') },
])

function weekHasToday(wk) {
  const key = tKey.value
  return wk.some((cell) => cell && dateKey(cell.year, cell.month, cell.day) === key)
}

function daysElapsed() {
  const todayDate = new Date()
  const year = trackerYear.value
  const month = trackerMonth.value
  if (todayDate.getFullYear() === year && todayDate.getMonth() === month) return todayDate.getDate()
  return new Date(year, month + 1, 0).getDate()
}

function planPct(plan) {
  const elapsed = daysElapsed()
  let done = 0
  for (let day = 1; day <= elapsed; day += 1) {
    if (checks.isChecked(plan.id, dateKey(trackerYear.value, trackerMonth.value, day))) done += 1
  }
  return elapsed ? `${Math.round(done / elapsed * 100)}%` : '—'
}

function mobileCellClasses(plan, cell) {
  if (!cell) {
    return ['empty']
  }

  const key = dateKey(cell.year, cell.month, cell.day)
  return [
    isFuture(cell) ? 'future' : '',
    checks.isChecked(plan.id, key) ? 'done' : 'missed',
    key === tKey.value ? 'today' : '',
  ]
}

function showTrackerMessage(message) {
  trackerMessage.value = message
  window.clearTimeout(showTrackerMessage.timer)
  showTrackerMessage.timer = window.setTimeout(() => {
    trackerMessage.value = ''
  }, 2400)
}
showTrackerMessage.timer = 0

function openMakeupDialog(plan, key) {
  pendingMakeup.value = {
    planId: plan.id,
    planName: plan.name,
    date: key,
  }
  rewards.actionError = ''
  makeupDialogOpen.value = true
}

function closeMakeupDialog() {
  makeupDialogOpen.value = false
  pendingMakeup.value = null
  rewards.actionError = ''
}

async function handleCellClick(plan, cell) {
  if (!cell || isFuture(cell)) {
    return
  }

  const key = dateKey(cell.year, cell.month, cell.day)
  const checked = checks.isChecked(plan.id, key)

  if (isPastDateKey(key)) {
    if (checked) {
      showTrackerMessage(t('tracker.makeup.past_locked', 'Past completed dates cannot be unchecked here.'))
      return
    }

    openMakeupDialog(plan, key)
    return
  }

  try {
    await checks.toggle(plan.id, key)
  } catch (error) {
    showTrackerMessage(error instanceof Error ? error.message : t('tracker.makeup.toggle_failed', 'Unable to update this check right now.'))
  }
}

function onMobileCellClick(plan, cell) {
  handleCellClick(plan, cell)
}

async function confirmMakeupCard() {
  if (!pendingMakeup.value) {
    return
  }

  try {
    await rewards.useMakeupCard(pendingMakeup.value.planId, pendingMakeup.value.date)
    await checks.fetchRange(pendingMakeup.value.date, pendingMakeup.value.date)
    showTrackerMessage(t('tracker.makeup.used', 'Makeup card used successfully.'))
    closeMakeupDialog()
  } catch (error) {
    showTrackerMessage(error instanceof Error ? error.message : t('tracker.makeup.use_failed', 'Unable to use a makeup card right now.'))
  }
}

const summary = computed(() => {
  const year = trackerYear.value
  const month = trackerMonth.value
  const elapsed = daysElapsed()
  const allPlans = plans.plans

  let totalChecks = 0
  let doneChecks = 0
  let perfectDays = 0

  for (let day = 1; day <= elapsed; day += 1) {
    const key = dateKey(year, month, day)
    let allDone = allPlans.length > 0
    allPlans.forEach((plan) => {
      if (checks.isChecked(plan.id, key)) doneChecks += 1
      else allDone = false
      totalChecks += 1
    })
    if (allDone) perfectDays += 1
  }

  let bestPlan = allPlans[0] || null
  let bestPct = 0
  allPlans.forEach((plan) => {
    let count = 0
    for (let day = 1; day <= elapsed; day += 1) {
      if (checks.isChecked(plan.id, dateKey(year, month, day))) count += 1
    }
    const pct = elapsed ? Math.round(count / elapsed * 100) : 0
    if (pct > bestPct) {
      bestPct = pct
      bestPlan = plan
    }
  })

  return [
    { val: totalChecks ? `${Math.round(doneChecks / totalChecks * 100)}%` : '—', lbl: t('year.summary.completion', 'Month Completion') },
    { val: `${doneChecks}/${totalChecks}`, lbl: t('year.summary.total', 'Checks Done') },
    { val: perfectDays, lbl: t('year.summary.perfect', 'Perfect Days') },
    {
      val: bestPlan ? `${bestPct}%` : '—',
      lbl: bestPlan
        ? t('tracker.best_suffix', '{name} · best', { name: bestPlan.name.split(' ').slice(0, 2).join(' ') })
        : t('year.summary.best', 'Best Habit'),
    },
  ]
})

function prevMonth() {
  trackerMonth.value -= 1
  if (trackerMonth.value < 0) {
    trackerMonth.value = 11
    trackerYear.value -= 1
  }
}

function nextMonth() {
  trackerMonth.value += 1
  if (trackerMonth.value > 11) {
    trackerMonth.value = 0
    trackerYear.value += 1
  }
}

function goToday() {
  const date = new Date()
  trackerYear.value = date.getFullYear()
  trackerMonth.value = date.getMonth()
}

async function loadMonth() {
  await checks.fetchMonth(trackerYear.value, trackerMonth.value + 1)
}

watch([trackerYear, trackerMonth], loadMonth)
watch(rewardReferenceDate, (referenceDate) => {
  rewards.fetchPeriod('month', referenceDate).catch(() => {})
}, { immediate: true })

onMounted(async () => {
  if (!plans.plans.length) await plans.fetch()
  await loadMonth()
})
</script>

<style scoped>
.tracker-inline-message {
  margin-top: 14px;
  font-size: 12px;
  color: var(--mid);
  line-height: 1.6;
}

.tracker-makeup-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(10, 10, 10, .22);
}

.tracker-makeup-dialog {
  position: fixed;
  left: 50%;
  top: 50%;
  width: min(420px, calc(100vw - 24px));
  transform: translate(-50%, -50%);
  border: 1px solid var(--faint);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 28px 60px rgba(17, 17, 17, .16);
  padding: 18px;
}

.tracker-makeup-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tracker-makeup-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dark);
}

.tracker-makeup-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
}

.tracker-makeup-close {
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
}

.tracker-makeup-copy {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--mid);
  line-height: 1.7;
}

.tracker-makeup-error {
  margin-top: 12px;
  font-size: 12px;
  color: #8b3232;
  line-height: 1.6;
}

.tracker-makeup-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.tracker-makeup-btn {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--faint);
  border-radius: 999px;
  background: var(--dark);
  color: var(--surface);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.tracker-makeup-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.tracker-makeup-btn-secondary {
  background: transparent;
  color: var(--dark);
}
</style>
