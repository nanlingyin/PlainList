<template>
  <section id="s4" class="section">
    <div class="section-header">
      <h2 class="section-title">{{ year }}</h2>
      <div class="year-nav">
        <button class="nav-btn" @click="year--">&#8592;</button>
        <button class="nav-btn" @click="year++">&#8594;</button>
      </div>
    </div>

    <!-- 12-month grid -->
    <div class="cal-grid">
      <div v-for="m in 12" :key="m" class="cal-month">
        <div class="cal-month-name">{{ MONTHS_S[m - 1] }}</div>
        <div class="cal-weekdays">
          <div v-for="wd in WDAYS_S" :key="wd" class="cal-wd">{{ wd }}</div>
        </div>
        <div class="cal-days-grid">
          <div
            v-for="_ in firstDay(m - 1)"
            :key="'e' + _"
            class="cal-day empty"
          />
          <div
            v-for="d in daysInMonth(m - 1)"
            :key="d"
            class="cal-day"
            :class="dayClass(m - 1, d)"
            :title="dayTitle(m - 1, d)"
          />
        </div>
      </div>
    </div>

    <!-- Heatmap per habit -->
    <div class="heatmap-section">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="heatmap-row"
      >
        <div class="heatmap-row-label">
          {{ habit.name.length > 14 ? habit.name.slice(0, 13) + '…' : habit.name }}
        </div>
        <div class="heatmap-cells">
          <div
            v-for="w in 52"
            :key="w"
            class="hm-cell"
            :class="heatmapLevel(habit.id, w - 1)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlansStore } from '@/stores/plans'
import { useChecksStore } from '@/stores/checks'
import { useI18nStore } from '@/stores/i18n'

const plansStore = usePlansStore()
const checksStore = useChecksStore()
const i18n = useI18nStore()

const year = ref(new Date().getFullYear())
const today = new Date()

const MONTHS_S_DEFAULT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WDAYS_S_DEFAULT  = ['Su','Mo','Tu','We','Th','Fr','Sa']

const MONTHS_S = computed(() => i18n.L('MONTHS_S', MONTHS_S_DEFAULT))
const WDAYS_S  = computed(() => i18n.L('WDAYS_S', WDAYS_S_DEFAULT))

const habits = computed(() => plansStore.plans.filter(p => p.type === 'habit'))

function firstDay(m) {
  return new Date(year.value, m, 1).getDay()
}

function daysInMonth(m) {
  return new Date(year.value, m + 1, 0).getDate()
}

function dateKey(m, d) {
  const mm = String(m + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${year.value}-${mm}-${dd}`
}

function pctForDay(m, d) {
  const key = dateKey(m, d)
  const all = plansStore.plans
  if (!all.length) return null
  const done = all.filter(p => checksStore.isChecked(p.id, key)).length
  return Math.round((done / all.length) * 100)
}

function pctClass(pct) {
  if (pct === null) return 'pct-0'
  if (pct >= 100) return 'pct-100'
  if (pct >= 75)  return 'pct-75'
  if (pct >= 50)  return 'pct-50'
  if (pct >= 25)  return 'pct-25'
  return 'pct-0'
}

function dayClass(m, d) {
  const date = new Date(year.value, m, d)
  const isToday =
    today.getFullYear() === year.value &&
    today.getMonth() === m &&
    today.getDate() === d
  const isFuture = date > today
  const pct = isFuture ? null : pctForDay(m, d)
  return [
    pctClass(pct),
    isToday  ? 'today'  : '',
    isFuture ? 'future' : '',
  ]
}

function dayTitle(m, d) {
  const date = new Date(year.value, m, d)
  const isFuture = date > today
  const pct = isFuture ? null : pctForDay(m, d)
  return `${MONTHS_S[m]} ${d}: ${pct === null ? 'upcoming' : pct + '%'}`
}

// Heatmap: map week index → Mon date of that week in `year`
function weekMonday(w) {
  const jan1 = new Date(year.value, 0, 1)
  const d = new Date(jan1)
  d.setDate(jan1.getDate() + w * 7)
  return d
}

function heatmapLevel(habitId, w) {
  const mon = weekMonday(w)
  let done = 0, total = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    if (d > today) continue
    if (d.getFullYear() !== year.value) continue
    total++
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    if (checksStore.isChecked(habitId, `${year.value}-${mm}-${dd}`)) done++
  }
  if (!total) return ''
  const ratio = done / total
  if (ratio >= 0.8) return 'lvl4'
  if (ratio >= 0.6) return 'lvl3'
  if (ratio >= 0.4) return 'lvl2'
  if (ratio >  0)   return 'lvl1'
  return ''
}
</script>

<style scoped>
.section { padding: 2rem 1.5rem; }
.section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.section-title { font-size: 1.4rem; font-weight: 700; margin: 0; }
.year-nav { display: flex; gap: .4rem; }
.nav-btn { background: none; border: 1px solid var(--faint); border-radius: 4px; padding: .2rem .6rem; cursor: pointer; font-size: .9rem; color: var(--mid); }
.nav-btn:hover { background: var(--faint); }

.cal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem; }
.cal-month { }
.cal-month-name { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .4rem; color: var(--muted); }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 2px; }
.cal-wd { font-size: .6rem; text-align: center; color: var(--faint); }
.cal-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-day { aspect-ratio: 1; border-radius: 2px; background: var(--faint); }
.cal-day.empty { background: transparent; }
.cal-day.future { background: var(--faint2); border: 1px dashed var(--faint); }
.cal-day.today { outline: 2px solid var(--dark); outline-offset: 1px; }
.cal-day.pct-0   { background: var(--faint2); }
.cal-day.pct-25  { background: var(--faint); }
.cal-day.pct-50  { background: var(--muted); }
.cal-day.pct-75  { background: var(--mid); }
.cal-day.pct-100 { background: var(--dark); }

.heatmap-section { margin-top: 2rem; display: flex; flex-direction: column; gap: .6rem; }
.heatmap-row { display: flex; align-items: center; gap: .8rem; }
.heatmap-row-label { font-size: .7rem; color: var(--muted); width: 90px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.heatmap-cells { display: flex; gap: 2px; flex-wrap: nowrap; }
.hm-cell { width: 10px; height: 10px; border-radius: 2px; background: var(--faint2); flex-shrink: 0; }
.hm-cell.lvl1 { background: var(--faint); }
.hm-cell.lvl2 { background: var(--muted); }
.hm-cell.lvl3 { background: var(--mid); }
.hm-cell.lvl4 { background: var(--dark); }
</style>
