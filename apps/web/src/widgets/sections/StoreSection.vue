<template>
  <section class="store-section">
    <div class="store-hero">
      <div class="store-hero-copy">
        <div class="store-kicker">{{ t('store.kicker', 'Progression') }}</div>
        <h2 class="store-title">{{ t('store.title', 'Store & Backpack') }}</h2>
        <p class="store-subtitle">{{ t('store.subtitle', 'Use points to buy support items and manage them from one place.') }}</p>

        <div class="store-hero-metrics">
          <div class="store-hero-metric">
            <span>{{ t('reward.total_points', 'Total points') }}</span>
            <strong>{{ rewards.overview?.totalPoints ?? 0 }}</strong>
          </div>
          <div class="store-hero-metric">
            <span>{{ t('forest.balance', 'Points balance') }}</span>
            <strong>{{ rewards.overview?.spendablePoints ?? 0 }}</strong>
          </div>
          <div class="store-hero-metric">
            <span>{{ t('forest.panel.backpack', 'Backpack') }}</span>
            <strong>{{ inventoryQuantity }}</strong>
          </div>
        </div>
      </div>

      <div class="store-balance-card">
        <div class="store-balance-label">{{ t('store.level', 'Level') }}</div>
        <div class="store-balance-value">Lv. {{ rewards.overview?.level ?? 1 }}</div>
        <div class="store-balance-meta">
          <div class="store-balance-meta-item">
            <span>{{ t('forest.panel.store', 'Store') }}</span>
            <strong>{{ rewards.overview?.storeItems?.length ?? 0 }}</strong>
          </div>
          <div class="store-balance-meta-item">
            <span>{{ t('forest.panel.backpack', 'Backpack') }}</span>
            <strong>{{ inventoryKinds }}</strong>
          </div>
        </div>
        <div class="store-balance-sub">{{ t('store.subtitle', 'Use points to buy support items and manage them from one place.') }}</div>
      </div>
    </div>

    <div class="store-main-grid">
      <div class="store-panel store-catalog-panel">
        <div class="store-panel-head">
          <div>
            <div class="store-panel-title">{{ t('forest.panel.store', 'Store') }}</div>
            <div class="store-panel-sub">{{ t('forest.store.sub', 'Use points to buy support items.') }}</div>
          </div>
        </div>

        <div v-if="rewards.overview?.storeItems?.length" class="store-list">
          <div v-for="item in rewards.overview?.storeItems ?? []" :key="item.itemId" class="store-item">
            <div class="store-item-copy">
              <div class="store-item-top">
                <div class="store-item-name">{{ itemName(item.itemId) }}</div>
                <span class="store-item-cost">{{ item.pointsCost }} {{ t('reward.points', 'Points') }}</span>
              </div>
              <div class="store-item-desc">{{ itemDescription(item.itemId) }}</div>
            </div>
            <div class="store-item-actions">
              <button class="store-btn primary" :disabled="rewards.actionLoading" @click="buyItem(item.itemId)">
                {{ t('forest.store.buy', 'Buy') }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="store-empty">
          <div class="store-empty-copy">{{ t('plugins.empty', 'No plugins found') }}</div>
        </div>
      </div>

      <div class="store-panel store-backpack-panel">
        <div class="store-panel-head">
          <div>
            <div class="store-panel-title">{{ t('forest.panel.backpack', 'Backpack') }}</div>
            <div class="store-panel-sub">{{ t('forest.backpack.sub', 'Manage owned support items.') }}</div>
          </div>
        </div>

        <div v-if="rewards.overview?.inventory?.length" class="store-backpack-list">
          <div
            v-for="item in rewards.overview?.inventory ?? []"
            :key="item.itemId"
            class="store-backpack-item"
          >
            <div>
              <div class="store-item-name">{{ itemName(item.itemId) }}</div>
              <div class="store-item-desc">{{ itemDescription(item.itemId) }}</div>
            </div>
            <strong class="store-backpack-qty">x{{ item.quantity }}</strong>
          </div>
        </div>
        <div v-else class="store-empty store-empty-detail">
          <div class="store-empty-copy">{{ t('forest.backpack.empty', 'No items in backpack yet.') }}</div>
        </div>

        <div v-if="rewards.actionError" class="store-error">{{ rewards.actionError }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { StoreItemId } from '@plainlist/shared'
import { computed } from 'vue'
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore'
import { useI18nStore } from '@/shared/i18n/useI18nStore'

const rewards = useRewardsStore()
const i18n = useI18nStore()

function t(key: string, fallback: string, params?: Record<string, string | number>) {
  return i18n.t(key, fallback, params)
}

const inventoryKinds = computed(() => rewards.overview?.inventory?.length ?? 0)
const inventoryQuantity = computed(() => (
  rewards.overview?.inventory?.reduce((total, item) => total + item.quantity, 0) ?? 0
))

function itemName(itemId: StoreItemId) {
  if (itemId === 'makeup-card') {
    return t('store.item.makeup_card', 'Makeup card')
  }
  return itemId
}

function itemDescription(itemId: StoreItemId) {
  if (itemId === 'makeup-card') {
    return t('store.item.makeup_card_desc', 'Repair one missed plan on one past day.')
  }
  return ''
}

async function buyItem(itemId: StoreItemId) {
  await rewards.purchaseItem(itemId, 1)
}
</script>

<style scoped>
.store-section {
  width: min(1240px, 100%);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.store-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) 280px;
  gap: 18px;
  align-items: stretch;
}

.store-hero-copy,
.store-balance-card,
.store-panel {
  border: 1px solid var(--faint);
  border-radius: 20px;
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
  box-shadow: 0 18px 42px color-mix(in srgb, var(--shadow-color) 68%, transparent);
}

.store-hero-copy {
  padding: 28px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--accent-soft) 92%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, var(--bg)), color-mix(in srgb, var(--surface) 90%, var(--bg)));
}

.store-kicker {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
}

.store-title {
  margin-top: 8px;
  font-size: clamp(34px, 5vw, 50px);
  line-height: 1;
  letter-spacing: -.05em;
  color: var(--dark);
}

.store-subtitle {
  margin-top: 14px;
  max-width: 60ch;
  color: var(--mid);
  line-height: 1.75;
}

.store-hero-metrics {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.store-hero-metric,
.store-balance-meta-item,
.store-item,
.store-backpack-item {
  border: 1px solid color-mix(in srgb, var(--accent) 10%, var(--faint));
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
}

.store-hero-metric {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-hero-metric span,
.store-balance-label,
.store-panel-sub,
.store-balance-meta-item span {
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
}

.store-hero-metric strong,
.store-balance-value {
  font-family: var(--mono);
  font-size: 30px;
  line-height: 1;
  color: var(--dark);
}

.store-balance-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 84%, var(--surface)), color-mix(in srgb, var(--surface) 92%, var(--bg)));
}

.store-balance-meta {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.store-balance-meta-item {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-balance-meta-item strong {
  font-family: var(--mono);
  font-size: 18px;
  line-height: 1;
  color: var(--dark);
}

.store-balance-sub {
  margin-top: 14px;
  font-size: 12px;
  color: var(--mid);
  line-height: 1.7;
}

.store-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, .88fr);
  gap: 18px;
}

.store-panel {
  padding: 20px;
}

.store-catalog-panel {
  background:
    radial-gradient(circle at top center, color-mix(in srgb, var(--accent-soft) 74%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, var(--bg)), color-mix(in srgb, var(--surface) 90%, var(--bg)));
}

.store-backpack-panel {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, var(--bg)), color-mix(in srgb, var(--surface) 88%, var(--bg)));
}

.store-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.store-panel-title,
.store-item-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
}

.store-list,
.store-backpack-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.store-item,
.store-backpack-item {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.store-item-copy {
  min-width: 0;
  flex: 1;
}

.store-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.store-item-desc,
.store-empty,
.store-empty-copy {
  margin-top: 6px;
  font-size: 12px;
  color: var(--mid);
  line-height: 1.7;
}

.store-item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.store-item-cost,
.store-backpack-qty {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.store-item-cost {
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 84%, var(--accent-soft));
  color: var(--accent-strong);
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.store-backpack-qty {
  min-width: 52px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-soft) 90%, var(--surface));
  color: var(--accent-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.store-btn {
  min-height: 36px;
  padding: 0 16px;
  border: 1px solid var(--faint);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 84%, var(--bg));
  color: var(--dark);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  transition: transform .15s, border-color .15s, background .15s, color .15s;
}

.store-btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent) 34%, var(--surface));
}

.store-btn.primary {
  background: linear-gradient(180deg, var(--accent), var(--accent-strong));
  border-color: transparent;
  color: var(--surface);
  box-shadow: 0 14px 24px color-mix(in srgb, var(--shadow-color) 62%, transparent);
}

.store-btn.primary:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, white), var(--accent-strong));
}

.store-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
  transform: none;
}

.store-empty {
  min-height: 220px;
  border-radius: 18px;
  border: 1px dashed color-mix(in srgb, var(--accent) 20%, var(--faint));
  background: color-mix(in srgb, var(--surface) 82%, var(--accent-soft));
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}

.store-empty-detail {
  min-height: 260px;
}

.store-error {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--danger) 20%, var(--surface));
  background: color-mix(in srgb, var(--surface) 86%, color-mix(in srgb, var(--danger) 10%, transparent));
  font-size: 12px;
  color: var(--danger);
  line-height: 1.7;
}

@media (max-width: 1024px) {
  .store-hero,
  .store-main-grid {
    grid-template-columns: 1fr;
  }

  .store-hero-metrics,
  .store-balance-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .store-hero-copy,
  .store-balance-card,
  .store-panel {
    padding-left: 18px;
    padding-right: 18px;
  }

  .store-hero-metrics,
  .store-balance-meta {
    grid-template-columns: 1fr;
  }

  .store-item,
  .store-backpack-item,
  .store-item-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .store-item-actions,
  .store-btn {
    width: 100%;
  }

  .store-btn {
    justify-content: center;
  }

  .store-backpack-qty {
    min-width: 0;
  }
}
</style>
