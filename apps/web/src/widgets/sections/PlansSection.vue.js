/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { useAiReviewStore } from '@/features/ai-review/model/useAiReviewStore';
import { usePlansStore } from '@/features/plans/model/usePlansStore';
import { useChecksStore } from '@/features/checks/model/useChecksStore';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useI18nStore } from '@/shared/i18n/useI18nStore';
const aiReview = useAiReviewStore();
const plans = usePlansStore();
const checks = useChecksStore();
const auth = useAuthStore();
const i18n = useI18nStore();
function t(key, fallback, params) { return i18n.t(key, fallback, params); }
const REVIEW_PERIODS = ['day', 'week', 'month', 'year'];
const MONTHS_DEFAULT = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
const monthNames = computed(() => i18n.L('MONTHS', MONTHS_DEFAULT));
const GROUPS = [
    { key: 'group.morning_early', fallback: 'Morning · before 9:00', test: (hour) => hour < 9 },
    { key: 'group.morning', fallback: 'Morning · 9:00-13:00', test: (hour) => hour < 13 },
    { key: 'group.afternoon', fallback: 'Afternoon · 13:00-18:00', test: (hour) => hour < 18 },
    { key: 'group.evening', fallback: 'Evening · after 18:00', test: () => true },
];
const groupedPlans = computed(() => {
    const result = [];
    let lastKey = null;
    for (const plan of plans.plans) {
        const hour = Number.parseInt(plan.time.split(':')[0], 10);
        const group = GROUPS.find((item) => item.test(hour));
        if (!group)
            continue;
        if (group.key !== lastKey) {
            result.push({ label: t(group.key, group.fallback), items: [] });
            lastKey = group.key;
        }
        result[result.length - 1].items.push(plan);
    }
    return result;
});
const habitPlans = computed(() => plans.plans.filter((plan) => plan.type === 'habit'));
function onRowClick(plan) {
    checks.toggle(plan.id, todayKey());
}
function planTypeTag(type) {
    return type === 'habit'
        ? t('plan.type_tag.habit', 'habit')
        : t('plan.type_tag.todo', 'task');
}
function periodLabel(period, full = false) {
    const short = {
        day: t('plan.ai.period.day', 'Day'),
        week: t('plan.ai.period.week', 'Week'),
        month: t('plan.ai.period.month', 'Month'),
        year: t('plan.ai.period.year', 'Year'),
    };
    const long = {
        day: t('plan.ai.period.day_full', 'Daily'),
        week: t('plan.ai.period.week_full', 'Weekly'),
        month: t('plan.ai.period.month_full', 'Monthly'),
        year: t('plan.ai.period.year_full', 'Yearly'),
    };
    return full ? long[period] : short[period];
}
async function generateReview(period) {
    try {
        await aiReview.generate(period, todayKey());
    }
    catch { }
}
function formatGeneratedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toLocaleString(i18n.locale === 'zh-CN' ? 'zh-CN' : 'en-US');
}
const formOpen = ref(false);
const newName = ref('');
const newType = ref('habit');
const newTime = ref('');
const nameInput = ref(null);
function openForm() {
    formOpen.value = true;
    nextTick(() => nameInput.value?.focus());
}
function cancelForm() {
    formOpen.value = false;
    newName.value = '';
    newTime.value = '';
}
async function submitPlan() {
    const name = newName.value.trim();
    const time = newTime.value.trim() || '09:00';
    if (!name) {
        nameInput.value?.focus();
        return;
    }
    if (!/^\d{2}:\d{2}$/.test(time))
        return;
    await plans.add(name, newType.value, time);
    cancelForm();
}
const today = new Date();
const stripYear = ref(today.getFullYear());
const stripMonth = ref(today.getMonth());
const monthLabel = computed(() => (i18n.locale === 'zh-CN'
    ? `${stripYear.value}年${stripMonth.value + 1}月`
    : `${monthNames.value[stripMonth.value]} ${stripYear.value}`));
function prevMonth() {
    if (stripMonth.value === 0) {
        stripMonth.value = 11;
        stripYear.value -= 1;
    }
    else {
        stripMonth.value -= 1;
    }
    checks.fetchMonth(stripYear.value, stripMonth.value + 1);
}
function nextMonth() {
    if (stripMonth.value === 11) {
        stripMonth.value = 0;
        stripYear.value += 1;
    }
    else {
        stripMonth.value += 1;
    }
    checks.fetchMonth(stripYear.value, stripMonth.value + 1);
}
const daysInStrip = computed(() => {
    const nowDate = new Date();
    const currentYear = nowDate.getFullYear();
    const currentMonth = nowDate.getMonth();
    const currentDay = nowDate.getDate();
    const year = stripYear.value;
    const month = stripMonth.value;
    const count = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let day = 1; day <= count; day += 1) {
        const isToday = year === currentYear && month === currentMonth && day === currentDay;
        const isFuture = new Date(year, month, day) > nowDate;
        const key = dateKey(year, month, day);
        const doneCountForDay = plans.plans.filter((plan) => checks.isChecked(plan.id, key)).length;
        const completionPct = plans.plans.length ? Math.round(doneCountForDay / plans.plans.length * 100) : 0;
        result.push({ day, isToday, isFuture, key, pct: completionPct });
    }
    return result;
});
const doneCount = computed(() => plans.plans.filter((plan) => checks.isChecked(plan.id, todayKey())).length);
const remainCount = computed(() => plans.plans.length - doneCount.value);
const pct = computed(() => plans.plans.length ? Math.round(doneCount.value / plans.plans.length * 100) : 0);
const chartEl = ref(null);
let chartInst = null;
function renderChart() {
    if (!chartEl.value)
        return;
    if (!chartInst)
        chartInst = echarts.init(chartEl.value, null, { renderer: 'svg' });
    const styles = getComputedStyle(document.documentElement);
    const dark = styles.getPropertyValue('--dark').trim() || '#111111';
    const faint = styles.getPropertyValue('--faint').trim() || '#E4E4E4';
    const done = doneCount.value;
    const remain = remainCount.value;
    const total = done + remain || 1;
    chartInst.setOption({
        backgroundColor: 'transparent',
        grid: { top: 4, bottom: 4, left: 8, right: 8 },
        xAxis: { type: 'value', max: total, show: false },
        yAxis: { type: 'category', show: false, data: [''] },
        series: [
            { name: 'Done', type: 'bar', stack: 't', data: [done], itemStyle: { color: dark, borderRadius: [4, 0, 0, 4] }, barMaxWidth: 12 },
            { name: 'Remain', type: 'bar', stack: 't', data: [remain], itemStyle: { color: faint, borderRadius: [0, 4, 4, 0] } },
        ],
    });
}
watch([doneCount, remainCount], () => renderChart());
onMounted(() => {
    checks.fetchMonth(stripYear.value, stripMonth.value + 1);
    nextTick(renderChart);
});
onUnmounted(() => {
    chartInst?.dispose();
    chartInst = null;
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "plans-section" },
});
/** @type {__VLS_StyleScopedClasses['plans-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "plan-list" },
});
/** @type {__VLS_StyleScopedClasses['plan-list']} */ ;
if (!__VLS_ctx.plans.plans.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state-text" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state-text']} */ ;
    (__VLS_ctx.t('plan.empty', 'No plans yet - add your first habit or task below'));
}
else {
    for (const [group, index] of __VLS_vFor((__VLS_ctx.groupedPlans))) {
        (index);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "plan-group-label" },
        });
        /** @type {__VLS_StyleScopedClasses['plan-group-label']} */ ;
        (group.label);
        for (const [plan] of __VLS_vFor((group.items))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.plans.plans.length))
                            return;
                        __VLS_ctx.onRowClick(plan);
                        // @ts-ignore
                        [plans, t, groupedPlans, onRowClick,];
                    } },
                key: (plan.id),
                ...{ class: "plan-item" },
                ...{ class: ({ 'done-item': __VLS_ctx.checks.isChecked(plan.id, __VLS_ctx.todayKey()) }) },
            });
            /** @type {__VLS_StyleScopedClasses['plan-item']} */ ;
            /** @type {__VLS_StyleScopedClasses['done-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "plan-check" },
                ...{ class: ({ done: __VLS_ctx.checks.isChecked(plan.id, __VLS_ctx.todayKey()) }) },
            });
            /** @type {__VLS_StyleScopedClasses['plan-check']} */ ;
            /** @type {__VLS_StyleScopedClasses['done']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "plan-text" },
            });
            /** @type {__VLS_StyleScopedClasses['plan-text']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "plan-name" },
            });
            /** @type {__VLS_StyleScopedClasses['plan-name']} */ ;
            (plan.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "plan-meta" },
            });
            /** @type {__VLS_StyleScopedClasses['plan-meta']} */ ;
            (plan.type === 'habit' ? __VLS_ctx.t('plan.type.habit', 'daily habit') : __VLS_ctx.t('plan.type.todo', 'task'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "plan-tag" },
                ...{ class: (plan.type) },
            });
            /** @type {__VLS_StyleScopedClasses['plan-tag']} */ ;
            (__VLS_ctx.planTypeTag(plan.type));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "plan-time" },
            });
            /** @type {__VLS_StyleScopedClasses['plan-time']} */ ;
            (plan.time);
            if (!__VLS_ctx.auth.isAdmin) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(!__VLS_ctx.plans.plans.length))
                                return;
                            if (!(!__VLS_ctx.auth.isAdmin))
                                return;
                            __VLS_ctx.plans.remove(plan.id);
                            // @ts-ignore
                            [plans, t, t, checks, checks, todayKey, todayKey, planTypeTag, auth,];
                        } },
                    ...{ class: "plan-del" },
                    title: (__VLS_ctx.t('plan.remove', 'remove')),
                });
                /** @type {__VLS_StyleScopedClasses['plan-del']} */ ;
            }
            // @ts-ignore
            [t,];
        }
        // @ts-ignore
        [];
    }
}
if (!__VLS_ctx.auth.isAdmin) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "plan-controls" },
    });
    /** @type {__VLS_StyleScopedClasses['plan-controls']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "add-plan-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['add-plan-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openForm) },
        ...{ class: "add-plan-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['add-plan-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "apb-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['apb-icon']} */ ;
    (__VLS_ctx.t('plan.add_btn', 'Add habit or task'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "add-plan-form" },
        ...{ class: ({ open: __VLS_ctx.formOpen }) },
    });
    /** @type {__VLS_StyleScopedClasses['add-plan-form']} */ ;
    /** @type {__VLS_StyleScopedClasses['open']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "apf-row" },
    });
    /** @type {__VLS_StyleScopedClasses['apf-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onKeydown: (__VLS_ctx.submitPlan) },
        ref: "nameInput",
        ...{ class: "apf-input" },
        placeholder: (__VLS_ctx.t('plan.add_name_ph', 'Name')),
    });
    (__VLS_ctx.newName);
    /** @type {__VLS_StyleScopedClasses['apf-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "apf-type" },
    });
    /** @type {__VLS_StyleScopedClasses['apf-type']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.auth.isAdmin))
                    return;
                __VLS_ctx.newType = 'habit';
                // @ts-ignore
                [t, t, auth, openForm, formOpen, submitPlan, newName, newType,];
            } },
        ...{ class: "apf-type-btn" },
        ...{ class: ({ active: __VLS_ctx.newType === 'habit' }) },
    });
    /** @type {__VLS_StyleScopedClasses['apf-type-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    (__VLS_ctx.t('plan.add_habit', 'Habit'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.auth.isAdmin))
                    return;
                __VLS_ctx.newType = 'todo';
                // @ts-ignore
                [t, newType, newType,];
            } },
        ...{ class: "apf-type-btn" },
        ...{ class: ({ active: __VLS_ctx.newType === 'todo' }) },
    });
    /** @type {__VLS_StyleScopedClasses['apf-type-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    (__VLS_ctx.t('plan.add_task', 'Task'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ class: "apf-input apf-time" },
        placeholder: "08:00",
        maxlength: "5",
    });
    (__VLS_ctx.newTime);
    /** @type {__VLS_StyleScopedClasses['apf-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['apf-time']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "apf-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['apf-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.cancelForm) },
        ...{ class: "apf-cancel" },
    });
    /** @type {__VLS_StyleScopedClasses['apf-cancel']} */ ;
    (__VLS_ctx.t('plan.add_cancel', 'Cancel'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.submitPlan) },
        ...{ class: "apf-save" },
    });
    /** @type {__VLS_StyleScopedClasses['apf-save']} */ ;
    (__VLS_ctx.t('plan.add_save', 'Add'));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "month-strip" },
});
/** @type {__VLS_StyleScopedClasses['month-strip']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "strip-header" },
});
/** @type {__VLS_StyleScopedClasses['strip-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.prevMonth) },
    ...{ class: "strip-nav" },
});
/** @type {__VLS_StyleScopedClasses['strip-nav']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "strip-month-label" },
});
/** @type {__VLS_StyleScopedClasses['strip-month-label']} */ ;
(__VLS_ctx.monthLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.nextMonth) },
    ...{ class: "strip-nav" },
});
/** @type {__VLS_StyleScopedClasses['strip-nav']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "month-strip-rows" },
});
/** @type {__VLS_StyleScopedClasses['month-strip-rows']} */ ;
for (const [day] of __VLS_vFor((__VLS_ctx.daysInStrip))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (day.day),
        ...{ class: "day-row" },
    });
    /** @type {__VLS_StyleScopedClasses['day-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "day-num" },
        ...{ class: ({ today: day.isToday }) },
    });
    /** @type {__VLS_StyleScopedClasses['day-num']} */ ;
    /** @type {__VLS_StyleScopedClasses['today']} */ ;
    (day.day);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "day-dots" },
    });
    /** @type {__VLS_StyleScopedClasses['day-dots']} */ ;
    for (const [habit] of __VLS_vFor((__VLS_ctx.habitPlans))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (habit.id),
            ...{ class: "day-cell" },
            ...{ class: ({ done: !day.isFuture && __VLS_ctx.checks.isChecked(habit.id, day.key) }) },
        });
        /** @type {__VLS_StyleScopedClasses['day-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['done']} */ ;
        // @ts-ignore
        [t, t, t, checks, submitPlan, newType, newTime, cancelForm, prevMonth, monthLabel, nextMonth, daysInStrip, habitPlans,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "day-pct" },
        ...{ class: ({ full: day.pct === 100 }) },
    });
    /** @type {__VLS_StyleScopedClasses['day-pct']} */ ;
    /** @type {__VLS_StyleScopedClasses['full']} */ ;
    (day.isFuture || !__VLS_ctx.plans.plans.length ? '—' : `${day.pct}%`);
    // @ts-ignore
    [plans,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "s2-stats" },
});
/** @type {__VLS_StyleScopedClasses['s2-stats']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-item" },
});
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-val" },
});
/** @type {__VLS_StyleScopedClasses['stat-val']} */ ;
(__VLS_ctx.doneCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-lbl" },
});
/** @type {__VLS_StyleScopedClasses['stat-lbl']} */ ;
(__VLS_ctx.t('stat.done', 'done'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-item" },
});
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-val" },
});
/** @type {__VLS_StyleScopedClasses['stat-val']} */ ;
(__VLS_ctx.remainCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-lbl" },
});
/** @type {__VLS_StyleScopedClasses['stat-lbl']} */ ;
(__VLS_ctx.t('stat.remaining', 'remaining'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-item" },
});
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-val" },
});
/** @type {__VLS_StyleScopedClasses['stat-val']} */ ;
(__VLS_ctx.pct);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "stat-lbl" },
});
/** @type {__VLS_StyleScopedClasses['stat-lbl']} */ ;
(__VLS_ctx.t('stat.completion', 'complete'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ref: "chartEl",
    ...{ class: "stat-chart" },
});
/** @type {__VLS_StyleScopedClasses['stat-chart']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ai-review-panel" },
});
/** @type {__VLS_StyleScopedClasses['ai-review-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ai-review-head" },
});
/** @type {__VLS_StyleScopedClasses['ai-review-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ai-review-heading" },
});
/** @type {__VLS_StyleScopedClasses['ai-review-heading']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ai-review-kicker" },
});
/** @type {__VLS_StyleScopedClasses['ai-review-kicker']} */ ;
(__VLS_ctx.t('plan.ai.title', 'AI Review'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ai-review-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['ai-review-subtitle']} */ ;
(__VLS_ctx.t('plan.ai.subtitle', 'Review your plan execution by day / week / month / year'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.generateReview(__VLS_ctx.aiReview.activePeriod);
            // @ts-ignore
            [t, t, t, t, t, doneCount, remainCount, pct, generateReview, aiReview,];
        } },
    ...{ class: "ai-review-refresh" },
    disabled: (__VLS_ctx.aiReview.loading || !__VLS_ctx.plans.plans.length),
});
/** @type {__VLS_StyleScopedClasses['ai-review-refresh']} */ ;
(__VLS_ctx.aiReview.current ? __VLS_ctx.t('plan.ai.refresh', 'Refresh') : __VLS_ctx.t('plan.ai.generate', 'Generate'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ai-review-periods" },
});
/** @type {__VLS_StyleScopedClasses['ai-review-periods']} */ ;
for (const [period] of __VLS_vFor((__VLS_ctx.REVIEW_PERIODS))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.generateReview(period);
                // @ts-ignore
                [plans, t, t, generateReview, aiReview, aiReview, REVIEW_PERIODS,];
            } },
        key: (period),
        ...{ class: "ai-review-period-btn" },
        ...{ class: ({ active: __VLS_ctx.aiReview.activePeriod === period }) },
        disabled: (__VLS_ctx.aiReview.loading || !__VLS_ctx.plans.plans.length),
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-period-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    (__VLS_ctx.periodLabel(period));
    // @ts-ignore
    [plans, aiReview, aiReview, periodLabel,];
}
if (!__VLS_ctx.plans.plans.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-empty" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-empty']} */ ;
    (__VLS_ctx.t('plan.ai.empty', 'Add some plans first, then let AI judge your execution.'));
}
else if (__VLS_ctx.aiReview.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-loading" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-loading']} */ ;
    (__VLS_ctx.t('plan.ai.loading', 'AI is generating a critique based on your completion data...'));
}
else if (__VLS_ctx.aiReview.current) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-meta" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ai-review-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-chip']} */ ;
    (__VLS_ctx.periodLabel(__VLS_ctx.aiReview.current.period, true));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ai-review-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-chip']} */ ;
    (__VLS_ctx.aiReview.current.summary.from);
    (__VLS_ctx.aiReview.current.summary.to);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ai-review-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-chip']} */ ;
    (__VLS_ctx.aiReview.current.summary.completionRate);
    (__VLS_ctx.t('plan.ai.complete', 'completion'));
    if (__VLS_ctx.aiReview.current.source === 'fallback') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "ai-review-chip fallback" },
        });
        /** @type {__VLS_StyleScopedClasses['ai-review-chip']} */ ;
        /** @type {__VLS_StyleScopedClasses['fallback']} */ ;
        (__VLS_ctx.t('plan.ai.fallback', 'fallback'));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-copy" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-copy']} */ ;
    (__VLS_ctx.aiReview.current.review);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-stat" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ai-review-stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-label']} */ ;
    (__VLS_ctx.t('plan.ai.stats.checks', 'Checks done'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "ai-review-stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-value']} */ ;
    (__VLS_ctx.aiReview.current.summary.completedChecks);
    (__VLS_ctx.aiReview.current.summary.expectedChecks);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-stat" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ai-review-stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-label']} */ ;
    (__VLS_ctx.t('plan.ai.stats.perfect', 'Perfect days'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "ai-review-stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-value']} */ ;
    (__VLS_ctx.aiReview.current.summary.perfectDays);
    (__VLS_ctx.aiReview.current.summary.activeDays);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-stat" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ai-review-stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-label']} */ ;
    (__VLS_ctx.t('plan.ai.stats.streak', 'Current streak'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "ai-review-stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-value']} */ ;
    (__VLS_ctx.aiReview.current.summary.currentPerfectStreak);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-stat" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ai-review-stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-label']} */ ;
    (__VLS_ctx.t('plan.ai.stats.longest', 'Longest streak'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "ai-review-stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-stat-value']} */ ;
    (__VLS_ctx.aiReview.current.summary.longestPerfectStreak);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-plan-groups" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-plan-groups']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-plan-group" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-plan-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-group-title" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-group-title']} */ ;
    (__VLS_ctx.t('plan.ai.best', 'Best plans'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-plan-list" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-plan-list']} */ ;
    for (const [plan] of __VLS_vFor((__VLS_ctx.aiReview.current.summary.bestPlans))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            key: (`best-${plan.id}`),
            ...{ class: "ai-review-plan-pill good" },
        });
        /** @type {__VLS_StyleScopedClasses['ai-review-plan-pill']} */ ;
        /** @type {__VLS_StyleScopedClasses['good']} */ ;
        (plan.name);
        (plan.completedDays);
        (plan.expectedDays);
        (plan.completionRate);
        // @ts-ignore
        [plans, t, t, t, t, t, t, t, t, t, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, aiReview, periodLabel,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-plan-group" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-plan-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-group-title" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-group-title']} */ ;
    (__VLS_ctx.t('plan.ai.weakest', 'Needs work'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-plan-list" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-plan-list']} */ ;
    for (const [plan] of __VLS_vFor((__VLS_ctx.aiReview.current.summary.weakestPlans))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            key: (`weak-${plan.id}`),
            ...{ class: "ai-review-plan-pill weak" },
        });
        /** @type {__VLS_StyleScopedClasses['ai-review-plan-pill']} */ ;
        /** @type {__VLS_StyleScopedClasses['weak']} */ ;
        (plan.name);
        (plan.completedDays);
        (plan.expectedDays);
        (plan.completionRate);
        // @ts-ignore
        [t, aiReview,];
    }
    if (__VLS_ctx.aiReview.current.summary.mostMissedDays.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "ai-review-missed" },
        });
        /** @type {__VLS_StyleScopedClasses['ai-review-missed']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "ai-review-missed-label" },
        });
        /** @type {__VLS_StyleScopedClasses['ai-review-missed-label']} */ ;
        (__VLS_ctx.t('plan.ai.missed', 'Worst days'));
        for (const [day] of __VLS_vFor((__VLS_ctx.aiReview.current.summary.mostMissedDays))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (day.date),
                ...{ class: "ai-review-plan-pill neutral" },
            });
            /** @type {__VLS_StyleScopedClasses['ai-review-plan-pill']} */ ;
            /** @type {__VLS_StyleScopedClasses['neutral']} */ ;
            (day.date);
            (day.completedChecks);
            (day.expectedChecks);
            (day.completionRate);
            // @ts-ignore
            [t, aiReview, aiReview,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-foot" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-foot']} */ ;
    (__VLS_ctx.t('plan.ai.model', 'Model'));
    (__VLS_ctx.aiReview.current.model);
    (__VLS_ctx.formatGeneratedAt(__VLS_ctx.aiReview.current.generatedAt));
}
else if (__VLS_ctx.aiReview.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-error" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-error']} */ ;
    (__VLS_ctx.aiReview.error);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ai-review-placeholder" },
    });
    /** @type {__VLS_StyleScopedClasses['ai-review-placeholder']} */ ;
    (__VLS_ctx.t('plan.ai.placeholder', 'Pick a period and let AI summarize how well you actually executed.'));
}
// @ts-ignore
[t, t, aiReview, aiReview, aiReview, aiReview, formatGeneratedAt,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
