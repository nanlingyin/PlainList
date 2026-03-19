// PlainList Plugin — theme-cool v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;
  PluginRuntime.register({
    id: 'theme-cool',
    name: 'Cool',
    version: '1.0.0',
    setup(api) {
      api.theme({
        '--bg':      '#EEF2F7',
        '--surface': '#F8FAFD',
        '--dark':    '#0D1B2A',
        '--mid':     '#3D5A80',
        '--muted':   '#7A9BBF',
        '--faint':   '#D4DDE8',
        '--faint2':  '#E4EBF2',
      });
    }
  });
})();
