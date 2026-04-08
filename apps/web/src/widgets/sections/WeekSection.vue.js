/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="D:/jisuanjisheji/PlainList/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { usePlansStore } from '@/features/plans/model/usePlansStore';
import { useChecksStore } from '@/features/checks/model/useChecksStore';
import { usePluginsStore } from '@/features/plugins/model/usePluginsStore';
import { useI18nStore } from '@/shared/i18n/useI18nStore';
const plansStore = usePlansStore();
const checksStore = useChecksStore();
const pluginsStore = usePluginsStore();
const i18n = useI18nStore();
function t(key, fallback, params) { return i18n.t(key, fallback, params); }
const radarEl = ref(null);
const barEl = ref(null);
const lineEl = ref(null);
let chartRadar = null;
let chartBar = null;
let chartLine = null;
const DAYS_S_DEFAULT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_S_DEFAULT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function pad(value) { return String(value).padStart(2, '0'); }
const today = new Date();
const dayNamesShort = computed(() => i18n.L('DAYS_S', DAYS_S_DEFAULT));
const monthNamesShort = computed(() => i18n.L('MONTHS_S', MONTHS_S_DEFAULT));
const monday = computed(() => {
    const date = new Date(today);
    const dayOfWeek = date.getDay();
    date.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    date.setHours(0, 0, 0, 0);
    return date;
});
const weekNumber = computed(() => {
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    return Math.ceil(Math.floor(diff / 86400000) / 7);
});
const rangeLabel = computed(() => {
    const sunday = new Date(monday.value);
    sunday.setDate(monday.value.getDate() + 6);
    if (i18n.locale === 'zh-CN') {
        return `${monthNamesShort.value[monday.value.getMonth()]}${monday.value.getDate()}日 - ${monthNamesShort.value[sunday.getMonth()]}${sunday.getDate()}日`;
    }
    return `${monthNamesShort.value[monday.value.getMonth()]} ${monday.value.getDate()} - ${monthNamesShort.value[sunday.getMonth()]} ${sunday.getDate()}`;
});
const totalPlans = computed(() => plansStore.plans.length);
function pctForDate(date) {
    const all = plansStore.plans;
    if (!all.length)
        return null;
    if (date > today)
        return null;
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `${date.getFullYear()}-${mm}-${dd}`;
    const done = all.filter((plan) => checksStore.isChecked(plan.id, key)).length;
    return Math.round((done / all.length) * 100);
}
const weekDays = computed(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday.value);
    date.setDate(monday.value.getDate() + index);
    return {
        date,
        label: dayNamesShort.value[date.getDay()],
        isToday: date.toDateString() === today.toDateString(),
        pct: pctForDate(date),
    };
}));
const pcts = computed(() => weekDays.value.map((day) => day.pct));
const dayLabels = computed(() => weekDays.value.map((day) => day.label));
const validPcts = computed(() => pcts.value.filter((value) => value !== null));
const avg = computed(() => validPcts.value.length ? Math.round(validPcts.value.reduce((left, right) => left + right, 0) / validPcts.value.length) : 0);
const activeDays = computed(() => validPcts.value.length);
const maxPct = computed(() => validPcts.value.length ? Math.max(...validPcts.value) : 0);
const bestDay = computed(() => {
    if (!validPcts.value.length)
        return '—';
    const index = pcts.value.indexOf(maxPct.value);
    return index >= 0 ? dayLabels.value[index] : '—';
});
const streak = computed(() => {
    let count = 0;
    const cursor = new Date(today);
    while (count <= 365) {
        const mm = String(cursor.getMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getDate()).padStart(2, '0');
        const key = `${cursor.getFullYear()}-${mm}-${dd}`;
        const all = plansStore.plans;
        if (!all.length)
            break;
        const done = all.filter((plan) => checksStore.isChecked(plan.id, key)).length;
        if (done === 0)
            break;
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return count;
});
const habits = computed(() => plansStore.plans.filter((plan) => plan.type === 'habit'));
const priorWeeks = [
    [65, 72, 68, 55, 80, 75, 70],
    [70, 60, 85, 78, 66, 80, 77],
    [80, 75, 90, 82, 85, 78, 83],
];
function getCSSVar(name) {
    return pluginsStore.themeVars[name] ?? getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function buildRadarOption() {
    const indicators = habits.value.length
        ? habits.value.map((habit) => ({ name: habit.name.split(' ').slice(0, 2).join(' '), max: 100 }))
        : [{ name: t('week.no_habits', 'No habits'), max: 100 }];
    const values = habits.value.map(() => (validPcts.value.length ? avg.value : 0));
    const dark = getCSSVar('--dark');
    const faint = getCSSVar('--faint');
    const muted = getCSSVar('--muted');
    return {
        backgroundColor: 'transparent',
        radar: {
            indicator: indicators,
            shape: 'polygon',
            splitNumber: 3,
            axisName: { color: muted, fontSize: 9 },
            splitLine: { lineStyle: { color: faint } },
            splitArea: { areaStyle: { color: ['transparent'] } },
            axisLine: { lineStyle: { color: faint } },
        },
        series: [{
                type: 'radar',
                data: [{
                        value: values,
                        lineStyle: { color: dark, width: 1.5 },
                        areaStyle: { color: faint },
                        itemStyle: { color: dark },
                    }],
            }],
    };
}
function buildBarOption() {
    const dark = getCSSVar('--dark');
    const mid = getCSSVar('--mid');
    const muted = getCSSVar('--muted');
    const faint = getCSSVar('--faint');
    const faint2 = getCSSVar('--faint2');
    return {
        backgroundColor: 'transparent',
        grid: { top: 8, bottom: 24, left: 24, right: 8 },
        xAxis: {
            type: 'category',
            data: dayLabels.value,
            axisLabel: { fontFamily: 'monospace', fontSize: 9, color: muted },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { fontFamily: 'monospace', fontSize: 9, color: faint, formatter: '{value}%' },
            splitLine: { lineStyle: { color: faint } },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        series: [{
                type: 'bar',
                barMaxWidth: 20,
                data: pcts.value.map((value) => ({
                    value,
                    itemStyle: {
                        color: value === null ? faint2 : value >= 80 ? dark : value >= 60 ? mid : muted,
                        borderRadius: [3, 3, 0, 0],
                    },
                })),
            }],
    };
}
function buildLineOption() {
    const dark = getCSSVar('--dark');
    const faint = getCSSVar('--faint');
    const muted = getCSSVar('--muted');
    const currentData = pcts.value.map((value) => value ?? 0);
    const series = [...priorWeeks, currentData].map((data, index) => ({
        type: 'line',
        smooth: true,
        data,
        lineStyle: { color: index === 3 ? dark : faint, width: index === 3 ? 2 : 1 },
        itemStyle: { color: index === 3 ? dark : faint },
        symbol: index === 3 ? 'circle' : 'none',
        symbolSize: 4,
        showSymbol: index === 3,
    }));
    return {
        backgroundColor: 'transparent',
        grid: { top: 8, bottom: 24, left: 24, right: 8 },
        xAxis: {
            type: 'category',
            data: dayLabels.value,
            axisLabel: { fontFamily: 'monospace', fontSize: 9, color: muted },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { fontFamily: 'monospace', fontSize: 9, color: faint, formatter: '{value}' },
            splitLine: { lineStyle: { color: faint } },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        series,
    };
}
function initCharts() {
    if (radarEl.value && !chartRadar) {
        chartRadar = echarts.init(radarEl.value, null, { renderer: 'svg' });
    }
    if (barEl.value && !chartBar) {
        chartBar = echarts.init(barEl.value, null, { renderer: 'svg' });
    }
    if (lineEl.value && !chartLine) {
        chartLine = echarts.init(lineEl.value, null, { renderer: 'svg' });
    }
    chartRadar?.setOption(buildRadarOption());
    chartBar?.setOption(buildBarOption());
    chartLine?.setOption(buildLineOption());
}
watch([pcts, habits], () => {
    chartRadar?.setOption(buildRadarOption(), true);
    chartBar?.setOption(buildBarOption(), true);
    chartLine?.setOption(buildLineOption(), true);
}, { deep: true });
watch(() => ({ ...pluginsStore.themeVars }), () => {
    chartRadar?.setOption(buildRadarOption(), true);
    chartBar?.setOption(buildBarOption(), true);
    chartLine?.setOption(buildLineOption(), true);
}, { deep: true });
function onThemeChanged() {
    chartRadar?.setOption(buildRadarOption(), true);
    chartBar?.setOption(buildBarOption(), true);
    chartLine?.setOption(buildLineOption(), true);
}
onMounted(() => {
    initCharts();
    document.addEventListener('theme:changed', onThemeChanged);
});
onBeforeUnmount(() => {
    document.removeEventListener('theme:changed', onThemeChanged);
    chartRadar?.dispose();
    chartBar?.dispose();
    chartLine?.dispose();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['week-day-card']} */ ;
/** @type {__VLS_StyleScopedClasses['today-card']} */ ;
/** @type {__VLS_StyleScopedClasses['wdc-bar-track']} */ ;
/** @type {__VLS_StyleScopedClasses['insight-delta']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    id: "s5",
    ...{ class: "section" },
});
/** @type {__VLS_StyleScopedClasses['section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "week-header" },
});
/** @type {__VLS_StyleScopedClasses['week-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "week-title" },
});
/** @type {__VLS_StyleScopedClasses['week-title']} */ ;
(__VLS_ctx.t('week.prefix', 'Week'));
(__VLS_ctx.pad(__VLS_ctx.weekNumber));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "week-range" },
});
/** @type {__VLS_StyleScopedClasses['week-range']} */ ;
(__VLS_ctx.rangeLabel);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "week-days-row" },
});
/** @type {__VLS_StyleScopedClasses['week-days-row']} */ ;
for (const [day, index] of __VLS_vFor((__VLS_ctx.weekDays))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (index),
        ...{ class: "week-day-card" },
        ...{ class: ({ 'today-card': day.isToday }) },
    });
    /** @type {__VLS_StyleScopedClasses['week-day-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['today-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "wdc-label" },
    });
    /** @type {__VLS_StyleScopedClasses['wdc-label']} */ ;
    (day.label);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "wdc-date-num" },
    });
    /** @type {__VLS_StyleScopedClasses['wdc-date-num']} */ ;
    (__VLS_ctx.pad(day.date.getDate()));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "wdc-pct" },
    });
    /** @type {__VLS_StyleScopedClasses['wdc-pct']} */ ;
    (day.pct !== null ? `${day.pct}%` : '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "wdc-bar-track" },
    });
    /** @type {__VLS_StyleScopedClasses['wdc-bar-track']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "wdc-bar-fill" },
        ...{ style: ({ width: `${day.pct || 0}%` }) },
    });
    /** @type {__VLS_StyleScopedClasses['wdc-bar-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "wdc-tasks" },
    });
    /** @type {__VLS_StyleScopedClasses['wdc-tasks']} */ ;
    (day.pct !== null
        ? `${Math.round(__VLS_ctx.totalPlans * (day.pct / 100))}/${__VLS_ctx.totalPlans}`
        : __VLS_ctx.t('week.upcoming', 'upcoming'));
    // @ts-ignore
    [t, t, pad, pad, weekNumber, rangeLabel, weekDays, totalPlans, totalPlans,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "charts-row" },
});
/** @type {__VLS_StyleScopedClasses['charts-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ref: "radarEl",
    ...{ class: "chart chart-radar" },
});
/** @type {__VLS_StyleScopedClasses['chart']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-radar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ref: "barEl",
    ...{ class: "chart chart-bar" },
});
/** @type {__VLS_StyleScopedClasses['chart']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-bar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ref: "lineEl",
    ...{ class: "chart chart-line" },
});
/** @type {__VLS_StyleScopedClasses['chart']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-line']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "week-insight" },
});
/** @type {__VLS_StyleScopedClasses['week-insight']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-item" },
});
/** @type {__VLS_StyleScopedClasses['insight-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-val" },
});
/** @type {__VLS_StyleScopedClasses['insight-val']} */ ;
(__VLS_ctx.avg);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-label" },
});
/** @type {__VLS_StyleScopedClasses['insight-label']} */ ;
(__VLS_ctx.t('week.insight.avg', 'Avg Completion'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-delta up" },
});
/** @type {__VLS_StyleScopedClasses['insight-delta']} */ ;
/** @type {__VLS_StyleScopedClasses['up']} */ ;
(__VLS_ctx.t('week.this_week', 'this week'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-item" },
});
/** @type {__VLS_StyleScopedClasses['insight-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-val" },
});
/** @type {__VLS_StyleScopedClasses['insight-val']} */ ;
(__VLS_ctx.activeDays);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-label" },
});
/** @type {__VLS_StyleScopedClasses['insight-label']} */ ;
(__VLS_ctx.t('week.insight.active', 'Active Days'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-delta" },
});
/** @type {__VLS_StyleScopedClasses['insight-delta']} */ ;
(__VLS_ctx.t('week.tracked', '{count}/7 tracked', { count: __VLS_ctx.activeDays }));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-item" },
});
/** @type {__VLS_StyleScopedClasses['insight-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-val" },
});
/** @type {__VLS_StyleScopedClasses['insight-val']} */ ;
(__VLS_ctx.bestDay || '—');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-label" },
});
/** @type {__VLS_StyleScopedClasses['insight-label']} */ ;
(__VLS_ctx.t('week.insight.best_day', 'Best Day'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-delta up" },
});
/** @type {__VLS_StyleScopedClasses['insight-delta']} */ ;
/** @type {__VLS_StyleScopedClasses['up']} */ ;
(__VLS_ctx.t('week.peak', 'peak: {value}%', { value: __VLS_ctx.maxPct }));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-item" },
});
/** @type {__VLS_StyleScopedClasses['insight-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-val" },
});
/** @type {__VLS_StyleScopedClasses['insight-val']} */ ;
(__VLS_ctx.streak);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-label" },
});
/** @type {__VLS_StyleScopedClasses['insight-label']} */ ;
(__VLS_ctx.t('week.insight.streak', 'Current Streak'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "insight-delta" },
});
/** @type {__VLS_StyleScopedClasses['insight-delta']} */ ;
(__VLS_ctx.t('week.days_in_a_row', 'days in a row'));
// @ts-ignore
[t, t, t, t, t, t, t, t, avg, activeDays, activeDays, bestDay, maxPct, streak,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
