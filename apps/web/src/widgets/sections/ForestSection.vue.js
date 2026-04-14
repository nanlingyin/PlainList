/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref } from 'vue';
import { useChecksStore } from '@/features/checks/model/useChecksStore';
import { useFocusStore } from '@/features/focus/model/useFocusStore';
import { usePlansStore } from '@/features/plans/model/usePlansStore';
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore';
import { useI18nStore } from '@/shared/i18n/useI18nStore';
const focus = useFocusStore();
const rewards = useRewardsStore();
const plans = usePlansStore();
const checks = useChecksStore();
const i18n = useI18nStore();
const selectedTree = ref(null);
const makeupDate = ref('');
const makeupPlanId = ref('');
function t(key, fallback, params) {
    return i18n.t(key, fallback, params);
}
const forestTrees = computed(() => focus.forestSessions.map((session) => ({
    sessionId: session.id,
    plantedAt: session.endedAt || session.startedAt,
    focusMinutes: session.focusMinutes,
})));
const levelProgressPct = computed(() => {
    const overview = rewards.overview;
    if (!overview || !overview.nextLevelExperience) {
        return 100;
    }
    const span = overview.nextLevelExperience - overview.currentLevelExperience;
    if (span <= 0) {
        return 100;
    }
    return Math.max(0, Math.min(100, Math.round(((overview.totalExperience - overview.currentLevelExperience) / span) * 100)));
});
const levelProgressLabel = computed(() => {
    const overview = rewards.overview;
    if (!overview) {
        return t('forest.level_progress.empty', 'Level data unavailable');
    }
    if (!overview.nextLevelExperience) {
        return t('forest.level_progress.max', 'Max level reached');
    }
    return t('forest.level_progress', '{current}/{next} XP', {
        current: overview.totalExperience,
        next: overview.nextLevelExperience,
    });
});
function treeEmoji(focusMinutes) {
    if (focusMinutes >= 50)
        return '🌳';
    if (focusMinutes >= 35)
        return '🌲';
    return '🌱';
}
function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleDateString(i18n.locale === 'zh-CN' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
}
function formatDateTime(value) {
    const date = new Date(value);
    return date.toLocaleString(i18n.locale === 'zh-CN' ? 'zh-CN' : 'en-US');
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
async function useMakeup() {
    if (!makeupDate.value || !makeupPlanId.value) {
        return;
    }
    await rewards.useMakeupCard(Number(makeupPlanId.value), makeupDate.value);
    await checks.fetchRange(makeupDate.value, makeupDate.value);
    makeupDate.value = '';
    makeupPlanId.value = '';
}
onMounted(async () => {
    await focus.loadForest();
    if (!selectedTree.value && focus.forestSessions.length > 0) {
        selectedTree.value = focus.forestSessions[0];
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['forest-level-card']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-tree']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-tree']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-header']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-main-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-economy-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-store-item']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-backpack-item']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
/** @type {__VLS_StyleScopedClasses['forest-store-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "forest-section" },
});
/** @type {__VLS_StyleScopedClasses['forest-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-header" },
});
/** @type {__VLS_StyleScopedClasses['forest-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-kicker" },
});
/** @type {__VLS_StyleScopedClasses['forest-kicker']} */ ;
(__VLS_ctx.t('forest.kicker', 'Focus Forest'));
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "forest-title" },
});
/** @type {__VLS_StyleScopedClasses['forest-title']} */ ;
(__VLS_ctx.t('forest.title', 'Focus Forest'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "forest-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['forest-subtitle']} */ ;
(__VLS_ctx.t('forest.subtitle', 'Each completed focus session grows one tree. Click a tree to inspect that session.'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-level-card" },
});
/** @type {__VLS_StyleScopedClasses['forest-level-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-level-label" },
});
/** @type {__VLS_StyleScopedClasses['forest-level-label']} */ ;
(__VLS_ctx.t('forest.level', 'Level'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-level-value" },
});
/** @type {__VLS_StyleScopedClasses['forest-level-value']} */ ;
(__VLS_ctx.rewards.overview?.level ?? 1);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-level-bar" },
});
/** @type {__VLS_StyleScopedClasses['forest-level-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-level-fill" },
    ...{ style: ({ width: `${__VLS_ctx.levelProgressPct}%` }) },
});
/** @type {__VLS_StyleScopedClasses['forest-level-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-level-sub" },
});
/** @type {__VLS_StyleScopedClasses['forest-level-sub']} */ ;
(__VLS_ctx.levelProgressLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-summary-grid" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-summary-card" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "forest-summary-label" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-label']} */ ;
(__VLS_ctx.t('reward.total_points', 'Total points'));
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
    ...{ class: "forest-summary-value" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-value']} */ ;
(__VLS_ctx.rewards.overview?.totalPoints ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-summary-card" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "forest-summary-label" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-label']} */ ;
(__VLS_ctx.t('forest.balance', 'Points balance'));
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
    ...{ class: "forest-summary-value" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-value']} */ ;
(__VLS_ctx.rewards.overview?.spendablePoints ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-summary-card" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "forest-summary-label" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-label']} */ ;
(__VLS_ctx.t('forest.xp', 'Experience'));
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
    ...{ class: "forest-summary-value" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-value']} */ ;
(__VLS_ctx.rewards.overview?.totalExperience ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-summary-card" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "forest-summary-label" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-label']} */ ;
(__VLS_ctx.t('reward.focus_sessions', 'Focus sessions'));
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
    ...{ class: "forest-summary-value" },
});
/** @type {__VLS_StyleScopedClasses['forest-summary-value']} */ ;
(__VLS_ctx.focus.forestSessions.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-main-grid" },
});
/** @type {__VLS_StyleScopedClasses['forest-main-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-head" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-title" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-title']} */ ;
(__VLS_ctx.t('forest.panel.forest', 'Forest'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-sub" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-sub']} */ ;
(__VLS_ctx.t('forest.count', '{count} trees', { count: __VLS_ctx.focus.forestSessions.length }));
if (!__VLS_ctx.focus.forestSessions.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-empty" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-empty']} */ ;
    (__VLS_ctx.t('forest.empty', 'Finish a focus session to plant your first tree.'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-grid']} */ ;
    for (const [tree] of __VLS_vFor((__VLS_ctx.forestTrees))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.focus.forestSessions.length))
                        return;
                    __VLS_ctx.selectedTree = __VLS_ctx.focus.forestSessions.find((session) => session.id === tree.sessionId) || null;
                    // @ts-ignore
                    [t, t, t, t, t, t, t, t, t, t, t, rewards, rewards, rewards, rewards, levelProgressPct, levelProgressLabel, focus, focus, focus, focus, forestTrees, selectedTree,];
                } },
            key: (tree.sessionId),
            ...{ class: "forest-tree" },
            ...{ class: ({ active: __VLS_ctx.selectedTree?.id === tree.sessionId }) },
        });
        /** @type {__VLS_StyleScopedClasses['forest-tree']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "forest-tree-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['forest-tree-icon']} */ ;
        (__VLS_ctx.treeEmoji(tree.focusMinutes));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "forest-tree-date" },
        });
        /** @type {__VLS_StyleScopedClasses['forest-tree-date']} */ ;
        (__VLS_ctx.formatDate(tree.plantedAt));
        // @ts-ignore
        [selectedTree, treeEmoji, formatDate,];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-head" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-title" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-title']} */ ;
(__VLS_ctx.t('forest.panel.detail', 'Tree detail'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-sub" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-sub']} */ ;
(__VLS_ctx.selectedTree ? __VLS_ctx.t('forest.detail.ready', 'Session record') : __VLS_ctx.t('forest.detail.empty', 'Select a tree'));
if (__VLS_ctx.selectedTree) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('forest.detail.time', 'Completed at'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.formatDateTime(__VLS_ctx.selectedTree.endedAt || __VLS_ctx.selectedTree.startedAt));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('forest.detail.duration', 'Focus duration'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedTree.focusMinutes);
    (__VLS_ctx.t('focus.minutes', 'min'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('forest.detail.break', 'Break duration'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedTree.breakMinutes);
    (__VLS_ctx.t('focus.minutes', 'min'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('forest.detail.cycle', 'Cycle setting'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedTree.cycleInterval);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('forest.detail.plan', 'Linked plan'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedTree.planName || __VLS_ctx.t('focus.link_none', 'No linked plan'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('reward.points', 'Points'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedTree.pointsAwarded);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-detail-row" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-detail-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('forest.xp', 'Experience'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedTree.experienceAwarded);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-empty" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-empty']} */ ;
    (__VLS_ctx.t('forest.detail.prompt', 'Click any tree in the forest to see the linked focus session.'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-economy-grid" },
});
/** @type {__VLS_StyleScopedClasses['forest-economy-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-head" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-title" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-title']} */ ;
(__VLS_ctx.t('forest.panel.store', 'Store'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-sub" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-sub']} */ ;
(__VLS_ctx.t('forest.store.sub', 'Use points to buy support items.'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-store-list" },
});
/** @type {__VLS_StyleScopedClasses['forest-store-list']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.rewards.overview?.storeItems ?? []))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (item.itemId),
        ...{ class: "forest-store-item" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-store-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-store-name" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-store-name']} */ ;
    (__VLS_ctx.itemName(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-store-desc" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-store-desc']} */ ;
    (__VLS_ctx.itemDescription(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-store-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-store-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "forest-store-cost" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-store-cost']} */ ;
    (item.pointsCost);
    (__VLS_ctx.t('reward.points', 'Points'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.buyItem(item.itemId);
                // @ts-ignore
                [t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, t, rewards, selectedTree, selectedTree, selectedTree, selectedTree, selectedTree, selectedTree, selectedTree, selectedTree, selectedTree, selectedTree, formatDateTime, itemName, itemDescription, buyItem,];
            } },
        ...{ class: "forest-btn" },
        disabled: (__VLS_ctx.rewards.actionLoading),
    });
    /** @type {__VLS_StyleScopedClasses['forest-btn']} */ ;
    (__VLS_ctx.t('forest.store.buy', 'Buy'));
    // @ts-ignore
    [t, rewards,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-head" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-title" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-title']} */ ;
(__VLS_ctx.t('forest.panel.backpack', 'Backpack'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-panel-sub" },
});
/** @type {__VLS_StyleScopedClasses['forest-panel-sub']} */ ;
(__VLS_ctx.t('forest.backpack.sub', 'Manage owned support items.'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-backpack-list" },
});
/** @type {__VLS_StyleScopedClasses['forest-backpack-list']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.rewards.overview?.inventory ?? []))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (item.itemId),
        ...{ class: "forest-backpack-item" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-backpack-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.itemName(item.itemId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (item.quantity);
    // @ts-ignore
    [t, t, rewards, itemName,];
}
if (!(__VLS_ctx.rewards.overview?.inventory?.length)) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-empty-mini" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-empty-mini']} */ ;
    (__VLS_ctx.t('forest.backpack.empty', 'No items in backpack yet.'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-makeup-form" },
});
/** @type {__VLS_StyleScopedClasses['forest-makeup-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "forest-makeup-title" },
});
/** @type {__VLS_StyleScopedClasses['forest-makeup-title']} */ ;
(__VLS_ctx.t('forest.makeup.title', 'Use makeup card'));
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "forest-field" },
});
/** @type {__VLS_StyleScopedClasses['forest-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('forest.makeup.date', 'Date'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
    type: "date",
    ...{ class: "forest-input" },
});
(__VLS_ctx.makeupDate);
/** @type {__VLS_StyleScopedClasses['forest-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "forest-field" },
});
/** @type {__VLS_StyleScopedClasses['forest-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('forest.makeup.plan', 'Plan'));
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.makeupPlanId),
    ...{ class: "forest-input" },
});
/** @type {__VLS_StyleScopedClasses['forest-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
(__VLS_ctx.t('forest.makeup.plan_select', 'Select plan'));
for (const [plan] of __VLS_vFor((__VLS_ctx.plans.plans))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (plan.id),
        value: (String(plan.id)),
    });
    (plan.name);
    // @ts-ignore
    [t, t, t, t, t, rewards, makeupDate, makeupPlanId, plans,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.useMakeup) },
    ...{ class: "forest-btn wide" },
    disabled: (__VLS_ctx.rewards.actionLoading),
});
/** @type {__VLS_StyleScopedClasses['forest-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['wide']} */ ;
(__VLS_ctx.t('forest.makeup.use', 'Use card'));
if (__VLS_ctx.rewards.actionError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "forest-error" },
    });
    /** @type {__VLS_StyleScopedClasses['forest-error']} */ ;
    (__VLS_ctx.rewards.actionError);
}
// @ts-ignore
[t, rewards, rewards, rewards, useMakeup,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
