// PlainList Plugin — lang-zh v1.0.0
// 简体中文语言包
(function () {
  if (typeof PluginRuntime === 'undefined') return;

  PluginRuntime.register({
    id: 'lang-zh',
    name: '中文语言包',
    version: '1.0.0',
    setup(api) {
      // Date arrays
      api.on('i18n:DAYS',     () => ['周日', '周一', '周二', '周三', '周四', '周五', '周六']);
      api.on('i18n:MONTHS',   () => ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']);
      api.on('i18n:MONTHS_S', () => ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']);
      api.on('i18n:WDAYS_S',  () => ['日', '一', '二', '三', '四', '五', '六']);
      api.on('i18n:WDAYS_M',  () => ['一', '二', '三', '四', '五', '六', '日']);

      // Nav links
      api.on('i18n:ui.nav.now',   () => '当下');
      api.on('i18n:ui.nav.day',   () => '今日');
      api.on('i18n:ui.nav.month', () => '月度');
      api.on('i18n:ui.nav.year',  () => '年度');
      api.on('i18n:ui.nav.week',  () => '周回顾');
      api.on('i18n:ui.nav.lock',  () => '退出');

      // Section tags
      api.on('i18n:ui.section.now',   () => '当下');
      api.on('i18n:ui.section.day',   () => '今日计划');
      api.on('i18n:ui.section.month', () => '月度追踪');
      api.on('i18n:ui.section.year',  () => '年度视图');
      api.on('i18n:ui.section.week',  () => '周回顾');

      // Clock
      api.on('i18n:ui.clock.motto', () => '每一秒都不可逆。');

      // Progress labels
      api.on('i18n:ui.prog.year',  () => '年');
      api.on('i18n:ui.prog.month', () => '月');
      api.on('i18n:ui.prog.today', () => '今日');

      // Month tracker nav
      api.on('i18n:ui.tracker.prev',  () => '上月');
      api.on('i18n:ui.tracker.today', () => '本月');
      api.on('i18n:ui.tracker.next',  () => '下月');

      // Year heatmap
      api.on('i18n:ui.year.heatmap', () => '习惯一致性');

      // Auth
      api.on('i18n:ui.auth.greeting.morning',  () => '早上好。');
      api.on('i18n:ui.auth.greeting.afternoon', () => '下午好。');
      api.on('i18n:ui.auth.greeting.evening',   () => '晚上好。');
      api.on('i18n:ui.auth.new_account',        () => '+ 新建账号');
      api.on('i18n:ui.auth.enter_pass',         () => '输入口令');
      api.on('i18n:ui.auth.back',               () => '返回');

      // Day section
      api.on('i18n:ui.group.morning_early', () => '早晨 · 9:00 前');
      api.on('i18n:ui.group.morning',       () => '上午 · 9:00–13:00');
      api.on('i18n:ui.group.afternoon',     () => '下午 · 13:00–18:00');
      api.on('i18n:ui.group.evening',       () => '晚上 · 18:00 后');
      api.on('i18n:ui.plan.empty',          () => '还没有计划 — 在下方添加第一个习惯或任务');
      api.on('i18n:ui.plan.type.habit',     () => '↻ 每日习惯');
      api.on('i18n:ui.plan.type.todo',      () => '⊡ 任务');
      api.on('i18n:ui.plan.add_btn',        () => '+ 添加习惯或任务');
      api.on('i18n:ui.plan.add_name_ph',    () => '名称');
      api.on('i18n:ui.plan.add_habit',      () => '习惯');
      api.on('i18n:ui.plan.add_task',       () => '任务');
      api.on('i18n:ui.plan.add_cancel',     () => '取消');
      api.on('i18n:ui.plan.add_save',       () => '添加');
      api.on('i18n:ui.stat.done',           () => '已完成');
      api.on('i18n:ui.stat.remaining',      () => '未完成');
      api.on('i18n:ui.stat.completion',     () => '完成率');

      // Month tracker
      api.on('i18n:ui.tracker.task_habit',   () => '任务 / 习惯');
      api.on('i18n:ui.tracker.done_col',     () => '完成');
      api.on('i18n:ui.tracker.group.habits', () => '习惯 · 每日重复');
      api.on('i18n:ui.tracker.group.tasks',  () => '任务 · 一次性');
      api.on('i18n:ui.tracker.empty',        () => '在「今日计划」中添加计划后开始追踪');
      api.on('i18n:ui.tracker.week_prefix',  () => '第');
      api.on('i18n:ui.tracker.week_suffix',  () => '周');

      // Year view
      api.on('i18n:ui.year.summary.completion', () => '本年完成率');
      api.on('i18n:ui.year.summary.total',      () => '总打卡数');
      api.on('i18n:ui.year.summary.perfect',    () => '完美天数');
      api.on('i18n:ui.year.summary.best',       () => '最佳习惯');

      // Weekly review
      api.on('i18n:ui.week.prefix',            () => '第');
      api.on('i18n:ui.week.suffix',            () => '周');
      api.on('i18n:ui.chart.habit_radar',      () => '习惯雷达');
      api.on('i18n:ui.chart.daily_completion', () => '每日完成率');
      api.on('i18n:ui.chart.trend_4w',         () => '近四周趋势');
      api.on('i18n:ui.week.insight.avg',       () => '平均完成率');
      api.on('i18n:ui.week.insight.active',    () => '活跃天数');
      api.on('i18n:ui.week.insight.best_day',  () => '最佳星期');
      api.on('i18n:ui.week.insight.streak',    () => '连续打卡');

      // Plugin store
      api.on('i18n:ui.plugins.title',        () => '插件');
      api.on('i18n:ui.plugins.tab.all',      () => '全部');
      api.on('i18n:ui.plugins.tab.theme',    () => '主题');
      api.on('i18n:ui.plugins.tab.language', () => '语言');
      api.on('i18n:ui.plugins.installed',    () => '已安装');
      api.on('i18n:ui.plugins.install',      () => '安装');
      api.on('i18n:ui.plugins.uninstall',    () => '卸载');
      api.on('i18n:ui.plugins.restart_hint', () => '重新登录后生效');
    }
  });
})();
