<template>
  <section class="store-section">
    <div class="store-header">
      <div>
        <div class="store-kicker">{{ t('store.kicker', 'Progression') }}</div>
        <h2 class="store-title">{{ t('store.title', 'Store & Backpack') }}</h2>
        <p class="store-subtitle">{{ t('store.subtitle', 'Use points to buy support items and manage them from one place.') }}</p>
      </div>
      <div class="store-balance-card">
        <div class="store-balance-label">{{ t('forest.balance', 'Points balance') }}</div>
        <div class="store-balance-value">{{ rewards.overview?.spendablePoints ?? 0 }}</div>
        <div class="store-balance-sub">{{ t('store.level', 'Level') }} {{ rewards.overview?.level ?? 1 }}</div>
      </div>
    </div>

    <div class="store-grid">
      <div class="store-panel">
        <div class="store-panel-head">
          <div class="store-panel-title">{{ t('forest.panel.store', 'Store') }}</div>
          <div class="store-panel-sub">{{ t('forest.store.sub', 'Use points to buy support items.') }}</div>
        </div>

        <div class="store-list">
          <div v-for="item in rewards.overview?.storeItems ?? []" :key="item.itemId" class="store-item">
            <div>
              <div class="store-item-name">{{ itemName(item.itemId) }}</div>
              <div class="store-item-desc">{{ itemDescription(item.itemId) }}</div>
            </div>
            <div class="store-item-actions">
              <span class="store-item-cost">{{ item.pointsCost }} {{ t('reward.points', 'Points') }}</span>
              <button class="store-btn" :disabled="rewards.actionLoading" @click="buyItem(item.itemId)">
                {{ t('forest.store.buy', 'Buy') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="store-panel">
        <div class="store-panel-head">
          <div class="store-panel-title">{{ t('forest.panel.backpack', 'Backpack') }}</div>
          <div class="store-panel-sub">{{ t('forest.backpack.sub', 'Manage owned support items.') }}</div>
        </div>

        <div class="store-backpack-list">
          <div
            v-for="item in rewards.overview?.inventory ?? []"
            :key="item.itemId"
            class="store-backpack-item"
          >
            <span>{{ itemName(item.itemId) }}</span>
            <strong>x{{ item.quantity }}</strong>
          </div>
          <div v-if="!(rewards.overview?.inventory?.length)" class="store-empty">
            {{ t('forest.backpack.empty', 'No items in backpack yet.') }}
          </div>
        </div>

        <div v-if="rewards.actionError" class="store-error">{{ rewards.actionError }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { StoreItemId } from '@plainlist/shared'
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore'
import { useI18nStore } from '@/shared/i18n/useI18nStore'

const rewards = useRewardsStore()
const i18n = useI18nStore()

function t(key: string, fallback: string, params?: Record<string, string | number>) {
  return i18n.t(key, fallback, params)
}

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

.store-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 18px;
  align-items: start;
}

.store-kicker {
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
}

.store-title {
  margin-top: 6px;
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1;
  letter-spacing: -.05em;
}

.store-subtitle {
  margin-top: 12px;
  max-width: 56ch;
  color: var(--mid);
  line-height: 1.7;
}

.store-balance-card,
.store-panel {
  border: 1px solid var(--faint);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 94%, var(--bg));
  box-shadow: 0 14px 34px rgba(17,17,17,.03);
}

.store-balance-card {
  padding: 18px;
}

.store-balance-label,
.store-panel-sub {
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
}

.store-balance-value {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 32px;
  line-height: 1;
  color: var(--dark);
}

.store-balance-sub {
  margin-top: 8px;
  font-size: 12px;
  color: var(--mid);
}

.store-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.store-panel {
  padding: 18px;
}

.store-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.store-panel-title,
.store-makeup-title,
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--faint2);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 90%, var(--bg));
}

.store-item-desc,
.store-empty {
  margin-top: 4px;
  font-size: 12px;
  color: var(--mid);
  line-height: 1.6;
}

.store-item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.store-item-cost {
  font-size: 12px;
  color: var(--muted);
}

.store-btn {
  min-height: 34px;
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

.store-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.store-btn.wide {
  width: 100%;
}

.store-makeup-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--faint2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.store-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--mid);
}

.store-input {
  min-height: 38px;
  border: 1px solid var(--faint);
  border-radius: 12px;
  background: var(--surface);
  color: var(--dark);
  padding: 0 12px;
  font-size: 13px;
}

.store-error {
  margin-top: 16px;
  font-size: 12px;
  color: #8b3232;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .store-header,
  .store-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .store-item,
  .store-backpack-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .store-item-actions {
    align-items: flex-start;
  }
}
</style>
