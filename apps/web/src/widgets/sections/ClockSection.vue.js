/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { DEFAULT_BREAK_MINUTES, DEFAULT_CYCLES, DEFAULT_FOCUS_MINUTES, } from '@plainlist/shared';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useFocusStore } from '@/features/focus/model/useFocusStore';
import { usePlansStore } from '@/features/plans/model/usePlansStore';
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore';
import { useI18nStore } from '@/shared/i18n/useI18nStore';
const i18n = useI18nStore();
const plans = usePlansStore();
const focus = useFocusStore();
const rewards = useRewardsStore();
function t(key, fallback, params) {
    return i18n.t(key, fallback, params);
}
const DAYS_DEFAULT = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_DEFAULT = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function pad(n) { return String(n).padStart(2, '0'); }
function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
const now = ref(new Date());
const selectedPlan = ref('');
const settingsOpen = ref(false);
const pendingSettings = ref({ ...focus.settings });
let timer = null;
const hm = computed(() => pad(now.value.getHours()) + ':' + pad(now.value.getMinutes()));
const sec = computed(() => ':' + pad(now.value.getSeconds()));
const dayOfYear = computed(() => Math.floor((now.value.getTime() - new Date(now.value.getFullYear(), 0, 0).getTime()) / 86400000));
const daysInYear = computed(() => {
    const y = now.value.getFullYear();
    return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 366 : 365;
});
const weekNum = computed(() => pad(Math.ceil(dayOfYear.value / 7)));
const yearPct = computed(() => Math.round(dayOfYear.value / daysInYear.value * 100));
const dayOfMonth = computed(() => now.value.getDate());
const daysInMonth = computed(() => new Date(now.value.getFullYear(), now.value.getMonth() + 1, 0).getDate());
const monthPct = computed(() => Math.round(dayOfMonth.value / daysInMonth.value * 100));
const dayPct = computed(() => {
    const seconds = now.value.getHours() * 3600 + now.value.getMinutes() * 60 + now.value.getSeconds();
    return Math.round(seconds / 86400 * 100);
});
const days = computed(() => i18n.L('DAYS', DAYS_DEFAULT));
const months = computed(() => i18n.L('MONTHS', MONTHS_DEFAULT));
const dateStr = computed(() => {
    if (i18n.locale === 'zh-CN') {
        return `${now.value.getFullYear()}年${now.value.getMonth() + 1}月${now.value.getDate()}日 ${days.value[now.value.getDay()]}`;
    }
    return `${days.value[now.value.getDay()]}, ${months.value[now.value.getMonth()]} ${ordinal(now.value.getDate())}, ${now.value.getFullYear()}`;
});
const weekDayLabel = computed(() => t('clock.week_day', 'Week {week} · Day {day}', {
    week: weekNum.value,
    day: dayOfYear.value,
}));
const yearProgressLabel = computed(() => t('prog.days_elapsed', '{current} / {total} days', {
    current: dayOfYear.value,
    total: daysInYear.value,
}));
const monthProgressLabel = computed(() => t('prog.days_elapsed', '{current} / {total} days', {
    current: dayOfMonth.value,
    total: daysInMonth.value,
}));
const dayProgressLabel = computed(() => t('prog.time_elapsed', '{time} / 24:00', {
    time: `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}`,
}));
const timerDisplay = computed(() => `${pad(Math.floor(focus.remainingSeconds / 60))}:${pad(focus.remainingSeconds % 60)}`);
const focusPhaseLabel = computed(() => {
    if (focus.mode === 'break') {
        return t('focus.phase.break', 'Break');
    }
    if (focus.activeSession) {
        return t('focus.phase.focus', 'Focus');
    }
    return t('focus.phase.ready', 'Ready');
});
const focusPhaseSub = computed(() => {
    if (focus.mode === 'break') {
        return t('focus.phase.break_sub', 'Pause briefly before the next round.');
    }
    if (focus.activeSession?.planName) {
        return t('focus.phase.linked', 'Linked to {name}', { name: focus.activeSession.planName });
    }
    return t('focus.phase.ready_sub', 'Start a focus round when you are ready.');
});
const levelLabel = computed(() => `Lv. ${rewards.overview?.level ?? 1}`);
const primaryActionLabel = computed(() => {
    if (focus.mode === 'break') {
        return focus.running ? t('focus.action.pause', 'Pause') : t('focus.action.resume', 'Resume');
    }
    if (!focus.activeSession) {
        return t('focus.action.start', 'Start focus');
    }
    return focus.running ? t('focus.action.pause', 'Pause') : t('focus.action.resume', 'Resume');
});
const secondaryActionLabel = computed(() => {
    if (focus.mode === 'break') {
        return t('focus.action.skip_break', 'Skip break');
    }
    if (focus.activeSession) {
        return t('focus.action.cancel', 'Cancel');
    }
    return '';
});
const focusMetaLabel = computed(() => {
    if (focus.mode === 'break') {
        return t('focus.break_meta', '{minutes} min break', {
            minutes: focus.breakMinutes || focus.settings.breakMinutes || DEFAULT_BREAK_MINUTES,
        });
    }
    return t('focus.default_cycle', '{focus} min focus · {breakTime} min break · cycle {cycles}', {
        focus: focus.activeSession?.focusMinutes ?? focus.settings.focusMinutes ?? DEFAULT_FOCUS_MINUTES,
        breakTime: focus.activeSession?.breakMinutes ?? focus.settings.breakMinutes ?? DEFAULT_BREAK_MINUTES,
        cycles: focus.activeSession?.cycleInterval ?? focus.settings.cycles ?? DEFAULT_CYCLES,
    });
});
function badgeName(badge) {
    const map = {
        'first-focus': t('reward.badge.first_focus', 'First focus session'),
        'focus-8': t('reward.badge.focus_8', '8 focus sessions'),
        'focus-25': t('reward.badge.focus_25', '25 focus sessions'),
        'perfect-day-1': t('reward.badge.perfect_day', 'First perfect day'),
        'streak-3': t('reward.badge.streak_3', '3-day perfect streak'),
        'streak-7': t('reward.badge.streak_7', '7-day perfect streak'),
    };
    return map[badge.id] || badge.id;
}
const nextBadge = computed(() => rewards.overview?.badges.find((badge) => !badge.earned) ?? null);
const nextBadgeLabel = computed(() => nextBadge.value ? badgeName(nextBadge.value) : t('reward.all_badges', 'All current badges earned'));
const nextBadgeProgressLabel = computed(() => {
    if (!nextBadge.value) {
        return t('reward.all_badges_sub', 'You have cleared the current reward set.');
    }
    return t('reward.badge_progress', '{progress}/{target}', {
        progress: Math.min(nextBadge.value.progress, nextBadge.value.target),
        target: nextBadge.value.target,
    });
});
function describeEvent(event) {
    if (!event) {
        return {
            label: t('reward.none', 'No recent reward yet'),
            sub: t('reward.none_sub', 'Complete a focus session or a perfect day to see updates here.'),
        };
    }
    if (event.kind === 'perfect-day') {
        return {
            label: t('reward.event.perfect_day', 'Perfect day'),
            sub: t('reward.event.perfect_day_sub', '{date} · +{points} points', {
                date: event.date,
                points: event.points,
            }),
        };
    }
    return {
        label: event.planName
            ? t('reward.event.focus_linked', 'Focus session · {name}', { name: event.planName })
            : t('reward.event.focus', 'Focus session'),
        sub: t('reward.event.focus_sub', '{date} · +{points} points', {
            date: event.date,
            points: event.points,
        }),
    };
}
const recentEvent = computed(() => rewards.overview?.recentEvents[0] ?? null);
const recentEventLabel = computed(() => describeEvent(recentEvent.value).label);
const recentEventSub = computed(() => describeEvent(recentEvent.value).sub);
async function onPrimaryAction() {
    if (focus.mode === 'break') {
        if (focus.running) {
            await focus.pause();
        }
        else {
            await focus.resume();
        }
        return;
    }
    if (!focus.activeSession) {
        await focus.start(selectedPlan.value ? Number(selectedPlan.value) : null);
        return;
    }
    if (focus.running) {
        await focus.pause();
    }
    else {
        await focus.resume();
    }
}
async function onSecondaryAction() {
    if (focus.mode === 'break') {
        focus.skipBreak();
        return;
    }
    await focus.cancel();
}
function openSettings() {
    pendingSettings.value = { ...focus.settings };
    settingsOpen.value = !settingsOpen.value;
}
async function saveSettings() {
    await focus.saveSettings({ ...pendingSettings.value });
    settingsOpen.value = false;
}
onMounted(() => {
    timer = window.setInterval(() => { now.value = new Date(); }, 1000);
});
onUnmounted(() => {
    if (timer !== null) {
        window.clearInterval(timer);
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    id: "s1",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "s1-grid" },
});
/** @type {__VLS_StyleScopedClasses['s1-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "clock-panel" },
});
/** @type {__VLS_StyleScopedClasses['clock-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sec-tag" },
});
/** @type {__VLS_StyleScopedClasses['sec-tag']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('section.now', 'Now'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    id: "clock-time",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    id: "ct-hm",
});
(__VLS_ctx.hm);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    id: "ct-sec",
    ...{ style: {} },
});
(__VLS_ctx.sec);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    id: "clock-date",
});
(__VLS_ctx.dateStr);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    id: "clock-week",
});
(__VLS_ctx.weekDayLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "clock-motto" },
});
/** @type {__VLS_StyleScopedClasses['clock-motto']} */ ;
(__VLS_ctx.t('clock.motto', 'Every second is irreversible.'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "progress-panel" },
});
/** @type {__VLS_StyleScopedClasses['progress-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-panel" },
});
/** @type {__VLS_StyleScopedClasses['focus-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sec-tag" },
});
/** @type {__VLS_StyleScopedClasses['sec-tag']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('focus.tag', 'Focus'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-card" },
});
/** @type {__VLS_StyleScopedClasses['focus-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-head" },
});
/** @type {__VLS_StyleScopedClasses['focus-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-phase" },
});
/** @type {__VLS_StyleScopedClasses['focus-phase']} */ ;
(__VLS_ctx.focusPhaseLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-phase-sub" },
});
/** @type {__VLS_StyleScopedClasses['focus-phase-sub']} */ ;
(__VLS_ctx.focusPhaseSub);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-today-points" },
});
/** @type {__VLS_StyleScopedClasses['focus-today-points']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.rewards.overview?.todayPoints ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('reward.points_today', 'today points'));
__VLS_asFunctionalElement1(__VLS_intrinsics.em, __VLS_intrinsics.em)({
    ...{ class: "focus-level-chip" },
});
/** @type {__VLS_StyleScopedClasses['focus-level-chip']} */ ;
(__VLS_ctx.levelLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-display" },
});
/** @type {__VLS_StyleScopedClasses['focus-display']} */ ;
(__VLS_ctx.timerDisplay);
if (__VLS_ctx.focus.phase === 'focus') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "focus-plan-row" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-plan-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "focus-plan-label" },
        for: "focus-plan-select",
    });
    /** @type {__VLS_StyleScopedClasses['focus-plan-label']} */ ;
    (__VLS_ctx.t('focus.link_label', 'Linked plan'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "focus-plan-select",
        value: (__VLS_ctx.selectedPlan),
        ...{ class: "focus-plan-select" },
        disabled: (Boolean(__VLS_ctx.focus.activeSession)),
    });
    /** @type {__VLS_StyleScopedClasses['focus-plan-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    (__VLS_ctx.t('focus.link_none', 'No linked plan'));
    for (const [plan] of __VLS_vFor((__VLS_ctx.plans.plans))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (plan.id),
            value: (String(plan.id)),
        });
        (plan.name);
        // @ts-ignore
        [t, t, t, t, t, t, hm, sec, dateStr, weekDayLabel, focusPhaseLabel, focusPhaseSub, rewards, levelLabel, timerDisplay, focus, focus, selectedPlan, plans,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "focus-break-copy" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-break-copy']} */ ;
    (__VLS_ctx.t('focus.break_copy', 'Short pause. Start the next round when you are ready.'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-actions" },
});
/** @type {__VLS_StyleScopedClasses['focus-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.onPrimaryAction) },
    ...{ class: "focus-btn primary" },
    disabled: (__VLS_ctx.focus.loading),
});
/** @type {__VLS_StyleScopedClasses['focus-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
(__VLS_ctx.primaryActionLabel);
if (__VLS_ctx.secondaryActionLabel) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.onSecondaryAction) },
        ...{ class: "focus-btn" },
        disabled: (__VLS_ctx.focus.loading),
    });
    /** @type {__VLS_StyleScopedClasses['focus-btn']} */ ;
    (__VLS_ctx.secondaryActionLabel);
}
if (!__VLS_ctx.focus.activeSession && __VLS_ctx.focus.mode !== 'break') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openSettings) },
        ...{ class: "focus-btn" },
        disabled: (__VLS_ctx.focus.loading),
    });
    /** @type {__VLS_StyleScopedClasses['focus-btn']} */ ;
    (__VLS_ctx.t('focus.action.settings', 'Settings'));
}
if (__VLS_ctx.settingsOpen && !__VLS_ctx.focus.activeSession && __VLS_ctx.focus.mode !== 'break') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "focus-settings" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-settings']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "focus-settings-field" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-settings-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('focus.settings.focus', 'Focus minutes'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "number",
        min: "5",
        max: "60",
        ...{ class: "focus-settings-input" },
    });
    (__VLS_ctx.pendingSettings.focusMinutes);
    /** @type {__VLS_StyleScopedClasses['focus-settings-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "focus-settings-field" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-settings-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('focus.settings.break', 'Break minutes'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "number",
        min: "1",
        max: "30",
        ...{ class: "focus-settings-input" },
    });
    (__VLS_ctx.pendingSettings.breakMinutes);
    /** @type {__VLS_StyleScopedClasses['focus-settings-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "focus-settings-field" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-settings-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.t('focus.settings.cycles', 'Cycles'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input, __VLS_intrinsics.input)({
        type: "number",
        min: "2",
        max: "8",
        ...{ class: "focus-settings-input" },
    });
    (__VLS_ctx.pendingSettings.cycles);
    /** @type {__VLS_StyleScopedClasses['focus-settings-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "focus-settings-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-settings-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.saveSettings) },
        ...{ class: "focus-btn primary" },
        disabled: (__VLS_ctx.focus.loading),
    });
    /** @type {__VLS_StyleScopedClasses['focus-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
    (__VLS_ctx.t('focus.action.save_settings', 'Save'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.settingsOpen && !__VLS_ctx.focus.activeSession && __VLS_ctx.focus.mode !== 'break'))
                    return;
                __VLS_ctx.settingsOpen = false;
                // @ts-ignore
                [t, t, t, t, t, t, focus, focus, focus, focus, focus, focus, focus, focus, onPrimaryAction, primaryActionLabel, secondaryActionLabel, secondaryActionLabel, onSecondaryAction, openSettings, settingsOpen, settingsOpen, pendingSettings, pendingSettings, pendingSettings, saveSettings,];
            } },
        ...{ class: "focus-btn" },
        disabled: (__VLS_ctx.focus.loading),
    });
    /** @type {__VLS_StyleScopedClasses['focus-btn']} */ ;
    (__VLS_ctx.t('focus.action.close_settings', 'Close'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-meta" },
});
/** @type {__VLS_StyleScopedClasses['focus-meta']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.focusMetaLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('focus.sessions_today', '{count} sessions today', { count: __VLS_ctx.rewards.overview?.completedFocusSessionsToday ?? 0 }));
if (__VLS_ctx.focus.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "focus-error" },
    });
    /** @type {__VLS_StyleScopedClasses['focus-error']} */ ;
    (__VLS_ctx.focus.error);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-grid" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-card" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-kicker" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-kicker']} */ ;
(__VLS_ctx.t('reward.total_points', 'Total points'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-value" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-value']} */ ;
(__VLS_ctx.rewards.overview?.totalPoints ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-card" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-kicker" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-kicker']} */ ;
(__VLS_ctx.t('reward.total_focus', 'Focus sessions'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-value" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-value']} */ ;
(__VLS_ctx.rewards.overview?.completedFocusSessions ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-card" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-kicker" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-kicker']} */ ;
(__VLS_ctx.t('reward.streak', 'Perfect streak'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-reward-value" },
});
/** @type {__VLS_StyleScopedClasses['focus-reward-value']} */ ;
(__VLS_ctx.rewards.overview?.currentPerfectStreak ?? 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-foot" },
});
/** @type {__VLS_StyleScopedClasses['focus-foot']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-next-badge" },
});
/** @type {__VLS_StyleScopedClasses['focus-next-badge']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-foot-label" },
});
/** @type {__VLS_StyleScopedClasses['focus-foot-label']} */ ;
(__VLS_ctx.t('reward.next_badge', 'Next badge'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-foot-value" },
});
/** @type {__VLS_StyleScopedClasses['focus-foot-value']} */ ;
(__VLS_ctx.nextBadgeLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-foot-sub" },
});
/** @type {__VLS_StyleScopedClasses['focus-foot-sub']} */ ;
(__VLS_ctx.nextBadgeProgressLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-last-event" },
});
/** @type {__VLS_StyleScopedClasses['focus-last-event']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-foot-label" },
});
/** @type {__VLS_StyleScopedClasses['focus-foot-label']} */ ;
(__VLS_ctx.t('reward.recent', 'Recent reward'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-foot-value" },
});
/** @type {__VLS_StyleScopedClasses['focus-foot-value']} */ ;
(__VLS_ctx.recentEventLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "focus-foot-sub" },
});
/** @type {__VLS_StyleScopedClasses['focus-foot-sub']} */ ;
(__VLS_ctx.recentEventSub);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "progress-shell" },
});
/** @type {__VLS_StyleScopedClasses['progress-shell']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sec-tag" },
});
/** @type {__VLS_StyleScopedClasses['sec-tag']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.t('section.progress', 'Progress'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-item" },
});
/** @type {__VLS_StyleScopedClasses['prog-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-header" },
});
/** @type {__VLS_StyleScopedClasses['prog-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "prog-label" },
});
/** @type {__VLS_StyleScopedClasses['prog-label']} */ ;
(__VLS_ctx.t('prog.year', 'Year'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-pct" },
});
/** @type {__VLS_StyleScopedClasses['prog-pct']} */ ;
(__VLS_ctx.yearPct);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-sub" },
});
/** @type {__VLS_StyleScopedClasses['prog-sub']} */ ;
(__VLS_ctx.yearProgressLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-track" },
});
/** @type {__VLS_StyleScopedClasses['prog-track']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-fill" },
    ...{ style: ({ width: __VLS_ctx.yearPct + '%' }) },
});
/** @type {__VLS_StyleScopedClasses['prog-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-dots" },
});
/** @type {__VLS_StyleScopedClasses['prog-dots']} */ ;
for (const [i] of __VLS_vFor((10))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (i),
        ...{ class: (['prog-dot', i <= Math.round(__VLS_ctx.yearPct / 10) ? 'on' : '']) },
    });
    /** @type {__VLS_StyleScopedClasses['prog-dot']} */ ;
    // @ts-ignore
    [t, t, t, t, t, t, t, t, t, rewards, rewards, rewards, rewards, focus, focus, focus, focusMetaLabel, nextBadgeLabel, nextBadgeProgressLabel, recentEventLabel, recentEventSub, yearPct, yearPct, yearPct, yearProgressLabel,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-item" },
});
/** @type {__VLS_StyleScopedClasses['prog-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-header" },
});
/** @type {__VLS_StyleScopedClasses['prog-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "prog-label" },
});
/** @type {__VLS_StyleScopedClasses['prog-label']} */ ;
(__VLS_ctx.t('prog.month', 'Month'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-pct" },
});
/** @type {__VLS_StyleScopedClasses['prog-pct']} */ ;
(__VLS_ctx.monthPct);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-sub" },
});
/** @type {__VLS_StyleScopedClasses['prog-sub']} */ ;
(__VLS_ctx.monthProgressLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-track" },
});
/** @type {__VLS_StyleScopedClasses['prog-track']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-fill" },
    ...{ style: ({ width: __VLS_ctx.monthPct + '%' }) },
});
/** @type {__VLS_StyleScopedClasses['prog-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-dots" },
});
/** @type {__VLS_StyleScopedClasses['prog-dots']} */ ;
for (const [i] of __VLS_vFor((__VLS_ctx.daysInMonth))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (i),
        ...{ class: (['prog-dot', i <= __VLS_ctx.dayOfMonth ? 'on' : '']) },
    });
    /** @type {__VLS_StyleScopedClasses['prog-dot']} */ ;
    // @ts-ignore
    [t, monthPct, monthPct, monthProgressLabel, daysInMonth, dayOfMonth,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-item" },
});
/** @type {__VLS_StyleScopedClasses['prog-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-header" },
});
/** @type {__VLS_StyleScopedClasses['prog-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "prog-label" },
});
/** @type {__VLS_StyleScopedClasses['prog-label']} */ ;
(__VLS_ctx.t('prog.today', 'Today'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-pct" },
});
/** @type {__VLS_StyleScopedClasses['prog-pct']} */ ;
(__VLS_ctx.dayPct);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-sub" },
});
/** @type {__VLS_StyleScopedClasses['prog-sub']} */ ;
(__VLS_ctx.dayProgressLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-track" },
});
/** @type {__VLS_StyleScopedClasses['prog-track']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-fill" },
    ...{ style: ({ width: __VLS_ctx.dayPct + '%' }) },
});
/** @type {__VLS_StyleScopedClasses['prog-fill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "prog-dots" },
});
/** @type {__VLS_StyleScopedClasses['prog-dots']} */ ;
for (const [i] of __VLS_vFor((24))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (i),
        ...{ class: (['prog-dot', i <= Math.round(__VLS_ctx.dayPct / 100 * 24) ? 'on' : '']) },
    });
    /** @type {__VLS_StyleScopedClasses['prog-dot']} */ ;
    // @ts-ignore
    [t, dayPct, dayPct, dayPct, dayProgressLabel,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
