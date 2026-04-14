<template>
  <section class="forest-section">
    <div class="forest-hero">
      <div class="forest-hero-copy">
        <div class="forest-kicker">{{ t('forest.kicker', 'Focus Forest') }}</div>
        <h2 class="forest-title">{{ t('forest.title', 'Focus Forest') }}</h2>
        <p class="forest-subtitle">{{ t('forest.subtitle', 'Each completed focus session grows one tree. Click a tree to inspect that session.') }}</p>

        <div class="forest-hero-metrics">
          <div class="forest-hero-metric">
            <span>{{ t('reward.focus_sessions', 'Focus sessions') }}</span>
            <strong>{{ focus.forestSessions.length }}</strong>
          </div>
          <div class="forest-hero-metric">
            <span>{{ t('forest.balance', 'Points balance') }}</span>
            <strong>{{ rewards.overview?.spendablePoints ?? 0 }}</strong>
          </div>
          <div class="forest-hero-metric">
            <span>{{ t('forest.xp', 'Experience') }}</span>
            <strong>{{ rewards.overview?.totalExperience ?? 0 }}</strong>
          </div>
        </div>
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
      <div class="forest-summary-card accent">
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
      <div class="forest-panel forest-canopy-panel">
        <div class="forest-panel-head">
          <div class="forest-panel-title">{{ t('forest.panel.forest', 'Forest') }}</div>
          <div class="forest-panel-sub">{{ t('forest.count', '{count} trees', { count: focus.forestSessions.length }) }}</div>
        </div>

        <div v-if="!focus.forestSessions.length" class="forest-empty forest-empty-rich">
          <div class="forest-empty-icon">🌱</div>
          <div>{{ t('forest.empty', 'Finish a focus session to plant your first tree.') }}</div>
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
            <strong class="forest-tree-minutes">{{ tree.focusMinutes }} {{ t('focus.minutes', 'min') }}</strong>
            <span class="forest-tree-date">{{ formatDate(tree.plantedAt) }}</span>
          </button>
        </div>
      </div>

      <div class="forest-panel forest-detail-panel">
        <div class="forest-panel-head">
          <div class="forest-panel-title">{{ t('forest.panel.detail', 'Tree detail') }}</div>
          <div class="forest-panel-sub">{{ selectedTree ? t('forest.detail.ready', 'Session record') : t('forest.detail.empty', 'Select a tree') }}</div>
        </div>

        <div v-if="selectedTree" class="forest-detail-card">
          <div class="forest-detail-top">
            <div>
              <div class="forest-detail-kicker">{{ t('forest.detail.ready', 'Session record') }}</div>
              <div class="forest-detail-title">{{ selectedTree.planName || t('focus.link_none', 'No linked plan') }}</div>
            </div>
            <div class="forest-detail-badge">+{{ selectedTree.pointsAwarded }} {{ t('reward.points', 'Points') }}</div>
          </div>

          <div class="forest-detail-meta">
            <div class="forest-detail-meta-item">
              <span>{{ t('forest.detail.time', 'Completed at') }}</span>
              <strong>{{ formatDateTime(selectedTree.endedAt || selectedTree.startedAt) }}</strong>
            </div>
            <div class="forest-detail-meta-item">
              <span>{{ t('forest.xp', 'Experience') }}</span>
              <strong>+{{ selectedTree.experienceAwarded }}</strong>
            </div>
          </div>

          <div class="forest-detail-grid">
            <div class="forest-detail-stat">
              <span>{{ t('forest.detail.duration', 'Focus duration') }}</span>
              <strong>{{ selectedTree.focusMinutes }} {{ t('focus.minutes', 'min') }}</strong>
            </div>
            <div class="forest-detail-stat">
              <span>{{ t('forest.detail.break', 'Break duration') }}</span>
              <strong>{{ selectedTree.breakMinutes }} {{ t('focus.minutes', 'min') }}</strong>
            </div>
            <div class="forest-detail-stat">
              <span>{{ t('forest.detail.cycle', 'Cycles') }}</span>
              <strong>{{ selectedTree.cycleInterval }}</strong>
            </div>
            <div class="forest-detail-stat wide">
              <span>{{ t('forest.detail.plan', 'Linked plan') }}</span>
              <strong>{{ selectedTree.planName || t('focus.link_none', 'No linked plan') }}</strong>
            </div>
          </div>
        </div>
        <div v-else class="forest-empty forest-empty-detail">
          <div class="forest-empty-icon">🌲</div>
          <div>{{ t('forest.detail.prompt', 'Click any tree in the forest to see the linked focus session.') }}</div>
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

.forest-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 280px;
  gap: 18px;
  align-items: stretch;
}

.forest-hero-copy,
.forest-level-card,
.forest-panel,
.forest-summary-card {
  border: 1px solid var(--faint);
  border-radius: 20px;
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
  box-shadow: 0 18px 42px color-mix(in srgb, var(--shadow-color) 68%, transparent);
}

.forest-hero-copy {
  padding: 28px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--accent-soft) 92%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, var(--bg)), color-mix(in srgb, var(--surface) 90%, var(--bg)));
}

.forest-kicker {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
}

.forest-title {
  margin-top: 8px;
  font-size: clamp(34px, 5vw, 50px);
  line-height: 1;
  letter-spacing: -.05em;
  color: var(--dark);
}

.forest-subtitle {
  margin-top: 14px;
  max-width: 60ch;
  color: var(--mid);
  line-height: 1.75;
}

.forest-hero-metrics {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.forest-hero-metric,
.forest-detail-stat,
.forest-detail-meta-item {
  border: 1px solid color-mix(in srgb, var(--accent) 10%, var(--faint));
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
}

.forest-hero-metric {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forest-hero-metric span,
.forest-summary-label,
.forest-level-label,
.forest-panel-sub,
.forest-detail-kicker,
.forest-detail-stat span,
.forest-detail-meta-item span {
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
}

.forest-hero-metric strong,
.forest-summary-value,
.forest-level-value {
  font-family: var(--mono);
  font-size: 30px;
  line-height: 1;
  color: var(--dark);
}

.forest-level-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 84%, var(--surface)), color-mix(in srgb, var(--surface) 92%, var(--bg)));
}

.forest-level-bar {
  margin-top: 18px;
  height: 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  overflow: hidden;
}

.forest-level-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--success));
}

.forest-level-sub {
  margin-top: 12px;
  font-size: 12px;
  color: var(--mid);
  line-height: 1.6;
}

.forest-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.forest-summary-card {
  padding: 18px;
}

.forest-summary-card.accent {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 92%, var(--surface)), color-mix(in srgb, var(--surface) 88%, var(--bg)));
  border-color: color-mix(in srgb, var(--accent) 24%, var(--surface));
}

.forest-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, .9fr);
  gap: 18px;
}

.forest-panel {
  padding: 20px;
}

.forest-canopy-panel {
  background:
    radial-gradient(circle at top center, color-mix(in srgb, var(--accent-soft) 74%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, var(--bg)), color-mix(in srgb, var(--surface) 90%, var(--bg)));
}

.forest-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.forest-panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
}

.forest-empty {
  color: var(--mid);
  line-height: 1.7;
}

.forest-empty-rich,
.forest-empty-detail {
  min-height: 260px;
  border-radius: 18px;
  border: 1px dashed color-mix(in srgb, var(--accent) 20%, var(--faint));
  background: color-mix(in srgb, var(--surface) 82%, var(--accent-soft));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 24px;
}

.forest-empty-icon {
  font-size: 40px;
  line-height: 1;
}

.forest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 14px;
}

.forest-tree {
  min-height: 128px;
  border: 1px solid color-mix(in srgb, var(--accent) 12%, var(--faint));
  border-radius: 18px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 86%, var(--accent-soft)), color-mix(in srgb, var(--surface) 92%, var(--bg)));
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform .15s, border-color .15s, box-shadow .15s, background .15s;
  padding: 12px;
}

.forest-tree:hover,
.forest-tree.active {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--surface));
  transform: translateY(-2px);
  box-shadow: 0 18px 34px color-mix(in srgb, var(--shadow-color) 72%, transparent);
}

.forest-tree.active {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 94%, var(--surface)), color-mix(in srgb, var(--surface) 82%, var(--bg)));
}

.forest-tree-icon {
  font-size: 34px;
  line-height: 1;
}

.forest-tree-minutes {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dark);
}

.forest-tree-date {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.forest-detail-panel {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, var(--bg)), color-mix(in srgb, var(--surface) 88%, var(--bg)));
}

.forest-detail-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forest-detail-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.forest-detail-title {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -.03em;
  color: var(--dark);
}

.forest-detail-badge {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-soft) 90%, var(--surface));
  color: var(--accent-strong);
  display: inline-flex;
  align-items: center;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.forest-detail-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.forest-detail-meta-item,
.forest-detail-stat {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forest-detail-meta-item strong,
.forest-detail-stat strong {
  color: var(--dark);
  font-size: 14px;
  line-height: 1.6;
}

.forest-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.forest-detail-stat strong {
  font-family: var(--mono);
  font-size: 20px;
  line-height: 1.3;
}

.forest-detail-stat.wide {
  grid-column: 1 / -1;
}

@media (max-width: 1024px) {
  .forest-hero,
  .forest-main-grid {
    grid-template-columns: 1fr;
  }

  .forest-summary-grid,
  .forest-hero-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .forest-hero-copy,
  .forest-level-card,
  .forest-panel,
  .forest-summary-card {
    padding-left: 18px;
    padding-right: 18px;
  }

  .forest-summary-grid,
  .forest-hero-metrics,
  .forest-detail-meta,
  .forest-detail-grid {
    grid-template-columns: 1fr;
  }

  .forest-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .forest-detail-top {
    flex-direction: column;
  }
}
</style>
