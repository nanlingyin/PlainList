<template>
  <section class="forest-section">
    <div class="forest-header">
      <div>
        <div class="forest-kicker">{{ t('forest.kicker', 'Focus Forest') }}</div>
        <h2 class="forest-title">{{ t('forest.title', 'Focus Forest') }}</h2>
        <p class="forest-subtitle">{{ t('forest.subtitle', 'Each completed focus session grows one tree. Click a tree to inspect that session.') }}</p>
      </div>
      <div class="forest-level-card">
        <div class="forest-level-label">{{ t('forest.level', 'Level') }}</div>
        <div class="forest-level-value">Lv. {{ rewards.overview?.level ?? 1 }}</div>
        <div class="forest-level-bar">
          <div class="forest-level-fill" :style="{ width: `${levelProgressPct}%` }"></div>
        </div>
        <div class="forest-level-sub">{{ levelProgressLabel }}</div>
      </div>
    </div>

    <div class="forest-summary-grid">
      <div class="forest-summary-card">
        <span class="forest-summary-label">{{ t('reward.total_points', 'Total points') }}</span>
        <strong class="forest-summary-value">{{ rewards.overview?.totalPoints ?? 0 }}</strong>
      </div>
      <div class="forest-summary-card">
        <span class="forest-summary-label">{{ t('forest.balance', 'Points balance') }}</span>
        <strong class="forest-summary-value">{{ rewards.overview?.spendablePoints ?? 0 }}</strong>
      </div>
      <div class="forest-summary-card">
        <span class="forest-summary-label">{{ t('forest.xp', 'Experience') }}</span>
        <strong class="forest-summary-value">{{ rewards.overview?.totalExperience ?? 0 }}</strong>
      </div>
      <div class="forest-summary-card">
        <span class="forest-summary-label">{{ t('reward.focus_sessions', 'Focus sessions') }}</span>
        <strong class="forest-summary-value">{{ focus.forestSessions.length }}</strong>
      </div>
    </div>

    <div class="forest-main-grid">
      <div class="forest-panel">
        <div class="forest-panel-head">
          <div class="forest-panel-title">{{ t('forest.panel.forest', 'Forest') }}</div>
          <div class="forest-panel-sub">{{ t('forest.count', '{count} trees', { count: focus.forestSessions.length }) }}</div>
        </div>

        <div v-if="!focus.forestSessions.length" class="forest-empty">
          {{ t('forest.empty', 'Finish a focus session to plant your first tree.') }}
        </div>
        <div v-else class="forest-grid">
          <button
            v-for="tree in forestTrees"
            :key="tree.sessionId"
            class="forest-tree"
            :class="{ active: selectedTree?.id === tree.sessionId }"
            @click="selectedTree = focus.forestSessions.find((session) => session.id === tree.sessionId) || null"
          >
            <span class="forest-tree-icon">{{ treeEmoji(tree.focusMinutes) }}</span>
            <span class="forest-tree-date">{{ formatDate(tree.plantedAt) }}</span>
          </button>
        </div>
      </div>

      <div class="forest-panel">
        <div class="forest-panel-head">
          <div class="forest-panel-title">{{ t('forest.panel.detail', 'Tree detail') }}</div>
          <div class="forest-panel-sub">{{ selectedTree ? t('forest.detail.ready', 'Session record') : t('forest.detail.empty', 'Select a tree') }}</div>
        </div>

        <div v-if="selectedTree" class="forest-detail">
          <div class="forest-detail-row">
            <span>{{ t('forest.detail.time', 'Completed at') }}</span>
            <strong>{{ formatDateTime(selectedTree.endedAt || selectedTree.startedAt) }}</strong>
          </div>
          <div class="forest-detail-row">
            <span>{{ t('forest.detail.duration', 'Focus duration') }}</span>
            <strong>{{ selectedTree.focusMinutes }} {{ t('focus.minutes', 'min') }}</strong>
          </div>
          <div class="forest-detail-row">
            <span>{{ t('forest.detail.break', 'Break duration') }}</span>
            <strong>{{ selectedTree.breakMinutes }} {{ t('focus.minutes', 'min') }}</strong>
          </div>
          <div class="forest-detail-row">
            <span>{{ t('forest.detail.cycle', 'Cycles') }}</span>
            <strong>{{ selectedTree.cycleInterval }}</strong>
          </div>
          <div class="forest-detail-row">
            <span>{{ t('forest.detail.plan', 'Linked plan') }}</span>
            <strong>{{ selectedTree.planName || t('focus.link_none', 'No linked plan') }}</strong>
          </div>
          <div class="forest-detail-row">
            <span>{{ t('reward.points', 'Points') }}</span>
            <strong>+{{ selectedTree.pointsAwarded }}</strong>
          </div>
          <div class="forest-detail-row">
            <span>{{ t('forest.xp', 'Experience') }}</span>
            <strong>+{{ selectedTree.experienceAwarded }}</strong>
          </div>
        </div>
        <div v-else class="forest-empty">
          {{ t('forest.detail.prompt', 'Click any tree in the forest to see the linked focus session.') }}
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import type { FocusSessionRecord } from '@plainlist/shared'
import { computed, onMounted, ref } from 'vue'
import { useFocusStore } from '@/features/focus/model/useFocusStore'
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore'
import { useI18nStore } from '@/shared/i18n/useI18nStore'

const focus = useFocusStore()
const rewards = useRewardsStore()
const i18n = useI18nStore()

const selectedTree = ref<FocusSessionRecord | null>(null)

function t(key: string, fallback: string, params?: Record<string, string | number>) {
  return i18n.t(key, fallback, params)
}

const forestTrees = computed(() => focus.forestSessions.map((session) => ({
  sessionId: session.id,
  plantedAt: session.endedAt || session.startedAt,
  focusMinutes: session.focusMinutes,
})))
const levelProgressPct = computed(() => {
  const overview = rewards.overview
  if (!overview || !overview.nextLevelExperience) {
    return 100
  }

  const span = overview.nextLevelExperience - overview.currentLevelExperience
  if (span <= 0) {
    return 100
  }

  return Math.max(0, Math.min(100, Math.round(((overview.totalExperience - overview.currentLevelExperience) / span) * 100)))
})
const levelProgressLabel = computed(() => {
  const overview = rewards.overview
  if (!overview) {
    return t('forest.level_progress.empty', 'Level data unavailable')
  }

  if (!overview.nextLevelExperience) {
    return t('forest.level_progress.max', 'Max level reached')
  }

  return t('forest.level_progress', '{current}/{next} XP', {
    current: overview.totalExperience,
    next: overview.nextLevelExperience,
  })
})

function treeEmoji(focusMinutes: number) {
  if (focusMinutes >= 50) return '🌳'
  if (focusMinutes >= 35) return '🌲'
  return '🌱'
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString(i18n.locale === 'zh-CN' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString(i18n.locale === 'zh-CN' ? 'zh-CN' : 'en-US')
}

onMounted(async () => {
  await focus.loadForest()
  if (!selectedTree.value && focus.forestSessions.length > 0) {
    selectedTree.value = focus.forestSessions[0]
  }
})
</script>

<style scoped>
.forest-section {
  width: min(1240px, 100%);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.forest-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 18px;
  align-items: start;
}

.forest-kicker {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
}

.forest-title {
  margin-top: 6px;
  font-size: clamp(34px, 5vw, 48px);
  line-height: 1;
  letter-spacing: -.05em;
}

.forest-subtitle {
  margin-top: 12px;
  max-width: 58ch;
  color: var(--mid);
  line-height: 1.7;
}

.forest-level-card,
.forest-panel,
.forest-summary-card {
  border: 1px solid var(--faint);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
  box-shadow: 0 14px 34px rgba(17,17,17,.03);
}

.forest-level-card {
  padding: 18px;
}

.forest-level-label,
.forest-summary-label,
.forest-panel-sub {
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
}

.forest-level-value,
.forest-summary-value {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 32px;
  line-height: 1;
  color: var(--dark);
}

.forest-level-bar {
  margin-top: 16px;
  height: 8px;
  border-radius: 999px;
  background: var(--faint2);
  overflow: hidden;
}

.forest-level-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--dark), var(--mid));
}

.forest-level-sub {
  margin-top: 10px;
  font-size: 12px;
  color: var(--mid);
}

.forest-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.forest-summary-card {
  padding: 18px;
}

.forest-main-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.forest-panel {
  padding: 18px;
}

.forest-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.forest-panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
}

.forest-empty {
  color: var(--muted);
  line-height: 1.7;
}

.forest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
  gap: 12px;
}

.forest-tree {
  min-height: 92px;
  border: 1px solid var(--faint);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface) 88%, var(--bg));
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform .15s, border-color .15s, box-shadow .15s;
}

.forest-tree:hover,
.forest-tree.active {
  border-color: color-mix(in srgb, var(--dark) 18%, var(--surface));
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(17,17,17,.06);
}

.forest-tree-icon {
  font-size: 28px;
  line-height: 1;
}

.forest-tree-date {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.forest-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.forest-detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--faint2);
  font-size: 13px;
  color: var(--mid);
}

.forest-detail-row strong {
  color: var(--dark);
  text-align: right;
}

@media (max-width: 1024px) {
  .forest-header,
  .forest-main-grid {
    grid-template-columns: 1fr;
  }

  .forest-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .forest-summary-grid {
    grid-template-columns: 1fr;
  }

  .forest-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .forest-detail-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
