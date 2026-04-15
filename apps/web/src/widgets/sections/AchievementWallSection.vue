<template>
  <section class="aw-section">
    <div class="aw-hero">
      <div class="aw-hero-copy">
        <div class="aw-kicker">{{ t('achievements.kicker', 'Achievement System') }}</div>
        <h2 class="aw-title">{{ t('achievements.title', 'Achievement Wall') }}</h2>
        <p class="aw-subtitle">{{ t('achievements.subtitle', 'Collect all badges and witness your growth journey.') }}</p>

        <div class="aw-hero-metrics">
          <div class="aw-hero-metric">
            <span>{{ t('achievements.summary.earned', 'Earned') }}</span>
            <strong>{{ earnedCount }}</strong>
          </div>
          <div class="aw-hero-metric">
            <span>{{ t('achievements.summary.total', 'Total') }}</span>
            <strong>{{ totalCount }}</strong>
          </div>
          <div class="aw-hero-metric">
            <span>{{ t('achievements.summary.progress', 'Progress') }}</span>
            <strong>{{ progressPct }}%</strong>
          </div>
        </div>
      </div>

      <div class="aw-latest-card">
        <div class="aw-latest-label">{{ t('achievements.summary.latest', 'Latest') }}</div>
        <template v-if="latestAchievement">
          <div class="aw-latest-icon">
            <img :src="latestAchievement.icon" :alt="achievementName(latestAchievement)" class="aw-badge-img" />
          </div>
          <div class="aw-latest-name">{{ achievementName(latestAchievement) }}</div>
          <div class="aw-latest-date">{{ formatBadgeDate(latestAchievement.achievedAt!) }}</div>
        </template>
        <template v-else>
          <div class="aw-latest-empty">{{ t('reward.achievement.none_earned', 'No achievements earned yet.') }}</div>
        </template>
      </div>
    </div>

    <div v-for="cat in categories" :key="cat.key" class="aw-category-panel">
      <div class="aw-category-head">
        <div class="aw-category-title">{{ t(cat.labelKey, cat.key) }}</div>
        <div class="aw-category-count">{{ categoryEarnedCount(cat.key) }} / {{ categoryBadges(cat.key).length }}</div>
      </div>

      <div class="aw-badge-grid">
        <div
          v-for="badge in categoryBadges(cat.key)"
          :key="badge.id"
          class="aw-badge-card"
          :class="{ earned: badge.earned, locked: !badge.earned }"
        >
          <div class="aw-badge-icon-wrap">
            <img :src="badge.icon" :alt="achievementName(badge)" class="aw-badge-img" :class="{ dimmed: !badge.earned }" />
          </div>
          <div class="aw-badge-name">{{ achievementName(badge) }}</div>
          <div class="aw-badge-desc">{{ achievementDesc(badge) }}</div>

          <template v-if="badge.earned">
            <div class="aw-badge-date">{{ t('achievements.earned_at', 'Earned on {date}', { date: formatBadgeDate(badge.achievedAt!) }) }}</div>
          </template>
          <template v-else>
            <div class="aw-badge-progress-wrap">
              <div class="aw-badge-progress-bar">
                <div class="aw-badge-progress-fill" :style="{ width: `${badgeProgressPct(badge)}%` }"></div>
              </div>
              <div class="aw-badge-progress-text">
                {{ t('achievements.progress_label', '{progress}/{target}', { progress: badge.progress, target: badge.target }) }}
              </div>
            </div>
            <div class="aw-badge-locked-label">{{ t('achievements.locked', 'Locked') }}</div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RewardAchievementProgress } from '@plainlist/shared'
import { ACHIEVEMENT_CATEGORIES } from '@plainlist/shared'
import { computed } from 'vue'
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore'
import { useI18nStore } from '@/shared/i18n/useI18nStore'

const rewards = useRewardsStore()
const i18n = useI18nStore()

function t(key: string, fallback: string, params?: Record<string, string | number>) {
  return i18n.t(key, fallback, params)
}

const categories = ACHIEVEMENT_CATEGORIES

const allAchievements = computed(() => rewards.overview?.achievements ?? [])
const earnedCount = computed(() => allAchievements.value.filter((a) => a.earned).length)
const totalCount = computed(() => allAchievements.value.length)
const progressPct = computed(() => (totalCount.value > 0 ? Math.round((earnedCount.value / totalCount.value) * 100) : 0))

const latestAchievement = computed(() => {
  const earned = allAchievements.value.filter((a) => a.earned && a.achievedAt)
  if (earned.length === 0) {
    return null
  }
  return [...earned].sort((a, b) => (b.achievedAt ?? '').localeCompare(a.achievedAt ?? ''))[0]
})

function categoryBadges(categoryKey: string) {
  return allAchievements.value.filter((a) => a.category === categoryKey)
}

function categoryEarnedCount(categoryKey: string) {
  return categoryBadges(categoryKey).filter((a) => a.earned).length
}

function achievementName(achievement: RewardAchievementProgress) {
  return t(`reward.achievement.${achievement.id.replace('-', '_')}`, achievement.id)
}

function achievementDesc(achievement: RewardAchievementProgress) {
  return t(`reward.achievement.desc.${achievement.id.replace('-', '_')}`, '')
}

function badgeProgressPct(badge: RewardAchievementProgress) {
  if (badge.target <= 0) {
    return 0
  }
  return Math.min(100, Math.round((badge.progress / badge.target) * 100))
}

function formatBadgeDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString(i18n.locale === 'zh-CN' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.aw-section {
  width: min(1240px, 100%);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ─── Hero ─── */

.aw-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 280px;
  gap: 18px;
  align-items: stretch;
}

.aw-hero-copy,
.aw-latest-card,
.aw-category-panel {
  border: 1px solid var(--faint);
  border-radius: 20px;
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
  box-shadow: 0 18px 42px color-mix(in srgb, var(--shadow-color) 68%, transparent);
}

.aw-hero-copy {
  padding: 28px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--accent-soft) 92%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, var(--bg)), color-mix(in srgb, var(--surface) 90%, var(--bg)));
}

.aw-kicker {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
}

.aw-title {
  margin-top: 8px;
  font-size: clamp(34px, 5vw, 50px);
  line-height: 1;
  letter-spacing: -.05em;
  color: var(--dark);
}

.aw-subtitle {
  margin-top: 14px;
  max-width: 60ch;
  color: var(--mid);
  line-height: 1.75;
}

.aw-hero-metrics {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.aw-hero-metric {
  border: 1px solid color-mix(in srgb, var(--accent) 10%, var(--faint));
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.aw-hero-metric span,
.aw-latest-label,
.aw-category-count {
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
}

.aw-hero-metric strong {
  font-family: var(--mono);
  font-size: 30px;
  line-height: 1;
  color: var(--dark);
}

/* ─── Latest Card ─── */

.aw-latest-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 84%, var(--surface)), color-mix(in srgb, var(--surface) 92%, var(--bg)));
}

.aw-latest-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aw-latest-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
}

.aw-latest-date {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: .06em;
}

.aw-latest-empty {
  font-size: 13px;
  color: var(--mid);
  line-height: 1.6;
}

/* ─── Category Panel ─── */

.aw-category-panel {
  padding: 20px;
}

.aw-category-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.aw-category-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
}

/* ─── Badge Grid ─── */

.aw-badge-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.aw-badge-card {
  border: 1px solid color-mix(in srgb, var(--accent) 12%, var(--faint));
  border-radius: 18px;
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  transition: transform .15s, border-color .15s, box-shadow .15s, background .15s;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 86%, var(--accent-soft)), color-mix(in srgb, var(--surface) 92%, var(--bg)));
}

.aw-badge-card.earned {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 94%, var(--surface)), color-mix(in srgb, var(--surface) 82%, var(--bg)));
}

.aw-badge-card.earned:hover {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--surface));
  transform: translateY(-2px);
  box-shadow: 0 18px 34px color-mix(in srgb, var(--shadow-color) 72%, transparent);
}

.aw-badge-card.locked {
  opacity: .72;
}

/* ─── Badge Icon ─── */

.aw-badge-icon-wrap {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aw-badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.aw-badge-img.dimmed {
  filter: grayscale(100%) opacity(0.45);
}

/* ─── Badge Text ─── */

.aw-badge-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
  line-height: 1.3;
}

.aw-badge-desc {
  font-size: 11px;
  color: var(--mid);
  line-height: 1.5;
  min-height: 2.2em;
}

.aw-badge-date {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: .06em;
  margin-top: auto;
}

.aw-badge-locked-label {
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: auto;
}

/* ─── Progress Bar ─── */

.aw-badge-progress-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.aw-badge-progress-bar {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  overflow: hidden;
}

.aw-badge-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--success));
  transition: width .3s ease;
}

.aw-badge-progress-text {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
  text-align: right;
}

/* ─── Responsive ─── */

@media (max-width: 1024px) {
  .aw-hero {
    grid-template-columns: 1fr;
  }

  .aw-badge-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .aw-hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .aw-hero-copy,
  .aw-latest-card,
  .aw-category-panel {
    padding-left: 18px;
    padding-right: 18px;
  }

  .aw-badge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .aw-hero-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
