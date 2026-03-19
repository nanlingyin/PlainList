// PlainList Plugin — theme-pack v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;

  const THEMES = {
    default:   { '--bg':'#F7F7F7', '--surface':'#FFFFFF', '--dark':'#111111', '--mid':'#555555', '--muted':'#999999', '--faint':'#E4E4E4', '--faint2':'#EFEFEF' },
    dark:      { '--bg':'#0F0F0F', '--surface':'#1A1A1A', '--dark':'#EFEFEF', '--mid':'#AAAAAA', '--muted':'#666666', '--faint':'#2C2C2C', '--faint2':'#222222' },
    warm:      { '--bg':'#F5F0E8', '--surface':'#FDFAF4', '--dark':'#2C1F0E', '--mid':'#6B5744', '--muted':'#A08C78', '--faint':'#E2D8CC', '--faint2':'#EDE8DF' },
    cool:      { '--bg':'#EEF2F7', '--surface':'#F8FAFD', '--dark':'#0D1B2A', '--mid':'#3D5A80', '--muted':'#7A9BBF', '--faint':'#D4DDE8', '--faint2':'#E4EBF2' },
    hc:        { '--bg':'#FFFFFF', '--surface':'#FFFFFF', '--dark':'#000000', '--mid':'#000000', '--muted':'#444444', '--faint':'#BBBBBB', '--faint2':'#EEEEEE' },
    solarized: { '--bg':'#FDF6E3', '--surface':'#EEE8D5', '--dark':'#073642', '--mid':'#586E75', '--muted':'#93A1A1', '--faint':'#D3CBB8', '--faint2':'#E8E2D0' },
    nord:      { '--bg':'#2E3440', '--surface':'#3B4252', '--dark':'#ECEFF4', '--mid':'#D8DEE9', '--muted':'#7B88A1', '--faint':'#434C5E', '--faint2':'#3B4252' },
    rose:      { '--bg':'#FDF2F4', '--surface':'#FFF8F9', '--dark':'#3D0A14', '--mid':'#8B3A4A', '--muted':'#C4849A', '--faint':'#F0D4DA', '--faint2':'#F7E5E9' },
  };

  const plugin = {
    id: 'theme-pack',
    name: 'Theme Pack',
    version: '1.0.0',
    _api: null,
    _activeId: 'default',
    _previewId: null,

    setup(api) {
      this._api = api;
      this._loadAndApply();
    },

    async _loadAndApply() {
      try {
        const token = sessionStorage.getItem('pl_token') || '';
        const res = await fetch('/api/plugins/active-theme', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return;
        const { themeId } = await res.json();
        if (themeId && THEMES[themeId]) {
          this._activeId = themeId;
          this._api.theme(THEMES[themeId]);
        }
      } catch(e) { /* 静默失败，保持默认主题 */ }
    },

    // 实时预览（不保存）
    applyTheme(themeId) {
      if (!THEMES[themeId]) return;
      this._previewId = themeId;
      this._api.theme(THEMES[themeId]);
    },

    // 取消预览，恢复已保存主题
    revertTheme() {
      this._previewId = null;
      this._api.theme(THEMES[this._activeId] || THEMES.default);
    },

    // 确认保存
    async saveTheme(themeId) {
      if (!THEMES[themeId]) return;
      this._api.theme(THEMES[themeId]);
      this._activeId = themeId;
      this._previewId = null;
      try {
        const token = sessionStorage.getItem('pl_token') || '';
        await fetch('/api/plugins/active-theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ themeId })
        });
      } catch(e) { console.warn('Failed to save theme:', e); }
    },

    getActiveId() { return this._activeId; },
    getThemes()   { return THEMES; },
  };

  PluginRuntime.register(plugin);
})();
