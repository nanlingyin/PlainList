/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore';
import { useI18nStore } from '@/shared/i18n/useI18nStore';
const rewards = useRewardsStore();
const i18n = useI18nStore();
function t(key, fallback, params) {
    return i18n.t(key, fallback, params);
}
function itemName(itemId) {
    if (itemId === 'makeup-card') {
        return t('store.item.makeup_card', 'Makeup card');
    }
    return itemId;
}
function itemDescription(itemId) {
    if (itemId === 'makeup-card') {
        return t('store.item.makeup_card_desc', 'Repair one missed plan on one past day.');
    }
    return '';
}
async function buyItem(itemId) {
    await rewards.purchaseItem(itemId, 1);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['store-balance-card']} */ ;
/** @type {__VLS_StyleScopedClasses['store-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['store-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['store-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['store-header']} */ ;
/** @type {__VLS_StyleScopedClasses['store-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['store-item']} */ ;
/** @type {__VLS_StyleScopedClasses['store-backpack-item']} */ ;
/** @type {__VLS_StyleScopedClasses['store-item-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "store-section" },
});
/** @type {__VLS_StyleScopedClasses['store-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-header" },
});
/** @type {__VLS_StyleScopedClasses['store-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-kicker" },
});
/** @type {__VLS_StyleScopedClasses['store-kicker']} */ ;
(__VLS_ctx.t('store.kicker', 'Progression'));
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "store-title" },
});
/** @type {__VLS_StyleScopedClasses['store-title']} */ ;
(__VLS_ctx.t('store.title', 'Store & Backpack'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "store-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['store-subtitle']} */ ;
(__VLS_ctx.t('store.subtitle', 'Use points to buy support items and manage them from one place.'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-balance-card" },
});
/** @type {__VLS_StyleScopedClasses['store-balance-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-balance-label" },
});
/** @type {__VLS_StyleScopedClasses['store-balance-label']} */ ;
(__VLS_ctx.t('forest.balance', 'Points balance'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-balance-value" },
});
/** @type {__VLS_StyleScopedClasses['store-balance-value']} */ ;
(__VLS_ctx.rewards.overview?.spendablePoints ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-balance-sub" },
});
/** @type {__VLS_StyleScopedClasses['store-balance-sub']} */ ;
(__VLS_ctx.t('store.level', 'Level'));
(__VLS_ctx.rewards.overview?.level ?? 1);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-grid" },
});
/** @type {__VLS_StyleScopedClasses['store-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel" },
});
/** @type {__VLS_StyleScopedClasses['store-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel-head" },
});
/** @type {__VLS_StyleScopedClasses['store-panel-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel-title" },
});
/** @type {__VLS_StyleScopedClasses['store-panel-title']} */ ;
(__VLS_ctx.t('forest.panel.store', 'Store'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel-sub" },
});
/** @type {__VLS_StyleScopedClasses['store-panel-sub']} */ ;
(__VLS_ctx.t('forest.store.sub', 'Use points to buy support items.'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-list" },
});
/** @type {__VLS_StyleScopedClasses['store-list']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.rewards.overview?.storeItems ?? []))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (item.itemId),
        ...{ class: "store-item" },
    });
    /** @type {__VLS_StyleScopedClasses['store-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "store-item-name" },
    });
    /** @type {__VLS_StyleScopedClasses['store-item-name']} */ ;
    (__VLS_ctx.itemName(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "store-item-desc" },
    });
    /** @type {__VLS_StyleScopedClasses['store-item-desc']} */ ;
    (__VLS_ctx.itemDescription(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "store-item-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['store-item-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "store-item-cost" },
    });
    /** @type {__VLS_StyleScopedClasses['store-item-cost']} */ ;
    (item.pointsCost);
    (__VLS_ctx.t('reward.points', 'Points'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.buyItem(item.itemId);
                // @ts-ignore
                [t, t, t, t, t, t, t, t, rewards, rewards, rewards, itemName, itemDescription, buyItem,];
            } },
        ...{ class: "store-btn" },
        disabled: (__VLS_ctx.rewards.actionLoading),
    });
    /** @type {__VLS_StyleScopedClasses['store-btn']} */ ;
    (__VLS_ctx.t('forest.store.buy', 'Buy'));
    // @ts-ignore
    [t, rewards,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel" },
});
/** @type {__VLS_StyleScopedClasses['store-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel-head" },
});
/** @type {__VLS_StyleScopedClasses['store-panel-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel-title" },
});
/** @type {__VLS_StyleScopedClasses['store-panel-title']} */ ;
(__VLS_ctx.t('forest.panel.backpack', 'Backpack'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-panel-sub" },
});
/** @type {__VLS_StyleScopedClasses['store-panel-sub']} */ ;
(__VLS_ctx.t('forest.backpack.sub', 'Manage owned support items.'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "store-backpack-list" },
});
/** @type {__VLS_StyleScopedClasses['store-backpack-list']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.rewards.overview?.inventory ?? []))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (item.itemId),
        ...{ class: "store-backpack-item" },
    });
    /** @type {__VLS_StyleScopedClasses['store-backpack-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.itemName(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (item.quantity);
    // @ts-ignore
    [t, t, rewards, itemName,];
}
if (!(__VLS_ctx.rewards.overview?.inventory?.length)) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "store-empty" },
    });
    /** @type {__VLS_StyleScopedClasses['store-empty']} */ ;
    (__VLS_ctx.t('forest.backpack.empty', 'No items in backpack yet.'));
}
if (__VLS_ctx.rewards.actionError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "store-error" },
    });
    /** @type {__VLS_StyleScopedClasses['store-error']} */ ;
    (__VLS_ctx.rewards.actionError);
}
// @ts-ignore
[t, rewards, rewards, rewards,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
