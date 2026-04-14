import type { PluginManifest, ThemeDefinition, ThemeVars } from '../types';

export const THEME_PLUGIN_ID = 'theme-pack';
export const FOCUS_FOREST_PLUGIN_ID = 'focus-forest';

export const USER_SETTING_KEYS = {
  activeTheme: 'active_theme',
  installedPlugins: 'installed_plugins',
  focusTimerSettings: 'focus_timer_settings',
} as const;

export const DEFAULT_THEME_ID = 'default';

export const DEFAULT_THEME_VARS: ThemeVars = {
  '--bg': '#F5F7FB',
  '--surface': '#FFFFFF',
  '--dark': '#111827',
  '--mid': '#4B5563',
  '--muted': '#94A3B8',
  '--faint': '#DFE6F1',
  '--faint2': '#EEF3F8',
  '--accent': '#5B7CFA',
  '--accent-strong': '#3C5AF1',
  '--accent-soft': '#E8EEFF',
  '--success': '#1F9D71',
  '--warning': '#C8871A',
  '--danger': '#D45555',
  '--shadow-color': 'rgba(15, 23, 42, 0.12)',
};

const themePackThemes: ThemeDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    vars: DEFAULT_THEME_VARS,
  },
  {
    id: 'dark',
    name: 'Dark',
    vars: {
      '--bg': '#0C111C',
      '--surface': '#111A2B',
      '--dark': '#EAF1FF',
      '--mid': '#B1BED4',
      '--muted': '#70809C',
      '--faint': '#22314B',
      '--faint2': '#182338',
      '--accent': '#5BC0EB',
      '--accent-strong': '#34ABD7',
      '--accent-soft': '#0F3146',
      '--success': '#34D399',
      '--warning': '#FBBF24',
      '--danger': '#FB7185',
      '--shadow-color': 'rgba(2, 6, 23, 0.38)',
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    vars: {
      '--bg': '#F6EFE7',
      '--surface': '#FFF9F3',
      '--dark': '#362418',
      '--mid': '#6C5443',
      '--muted': '#AF967E',
      '--faint': '#E5D7C9',
      '--faint2': '#F0E4D8',
      '--accent': '#C67A5B',
      '--accent-strong': '#AE5F41',
      '--accent-soft': '#F7E2D8',
      '--success': '#729C65',
      '--warning': '#CE8C2D',
      '--danger': '#B96565',
      '--shadow-color': 'rgba(54, 36, 24, 0.12)',
    },
  },
  {
    id: 'cool',
    name: 'Cool',
    vars: {
      '--bg': '#EEF5FB',
      '--surface': '#FAFCFF',
      '--dark': '#163047',
      '--mid': '#48657E',
      '--muted': '#8EA7BC',
      '--faint': '#D8E3EE',
      '--faint2': '#E9F1F7',
      '--accent': '#2E91C8',
      '--accent-strong': '#1D7CB0',
      '--accent-soft': '#DDF2FB',
      '--success': '#249C8C',
      '--warning': '#D19333',
      '--danger': '#D46262',
      '--shadow-color': 'rgba(22, 48, 71, 0.12)',
    },
  },
  {
    id: 'hc',
    name: 'High Contrast',
    vars: {
      '--bg': '#FFFFFF',
      '--surface': '#FFFFFF',
      '--dark': '#000000',
      '--mid': '#222222',
      '--muted': '#5A5A5A',
      '--faint': '#BBBBBB',
      '--faint2': '#EDEDED',
      '--accent': '#0047FF',
      '--accent-strong': '#0036C7',
      '--accent-soft': '#DCE6FF',
      '--success': '#0E8A4C',
      '--warning': '#A65A00',
      '--danger': '#B00020',
      '--shadow-color': 'rgba(0, 0, 0, 0.18)',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    vars: {
      '--bg': '#FDF6E3',
      '--surface': '#FFF9EA',
      '--dark': '#073642',
      '--mid': '#586E75',
      '--muted': '#93A1A1',
      '--faint': '#D8CFB7',
      '--faint2': '#EDE5D0',
      '--accent': '#268BD2',
      '--accent-strong': '#1F73B1',
      '--accent-soft': '#E2F0FB',
      '--success': '#2AA198',
      '--warning': '#B58900',
      '--danger': '#DC322F',
      '--shadow-color': 'rgba(7, 54, 66, 0.14)',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    vars: {
      '--bg': '#2E3440',
      '--surface': '#3B4252',
      '--dark': '#ECEFF4',
      '--mid': '#D8DEE9',
      '--muted': '#7B88A1',
      '--faint': '#4C566A',
      '--faint2': '#434C5E',
      '--accent': '#88C0D0',
      '--accent-strong': '#5E9FB4',
      '--accent-soft': '#2E465B',
      '--success': '#A3BE8C',
      '--warning': '#EBCB8B',
      '--danger': '#BF616A',
      '--shadow-color': 'rgba(15, 23, 42, 0.36)',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    vars: {
      '--bg': '#FFF3F6',
      '--surface': '#FFF9FA',
      '--dark': '#3D0A14',
      '--mid': '#8B3A4A',
      '--muted': '#C4849A',
      '--faint': '#F0D4DA',
      '--faint2': '#F7E5E9',
      '--accent': '#E06C9F',
      '--accent-strong': '#C95687',
      '--accent-soft': '#FCE4EE',
      '--success': '#5FA36A',
      '--warning': '#D88A2D',
      '--danger': '#B94C63',
      '--shadow-color': 'rgba(61, 10, 20, 0.14)',
    },
  },
];

export const PLUGIN_CATALOG: PluginManifest[] = [
  {
    id: FOCUS_FOREST_PLUGIN_ID,
    name: 'Focus Forest',
    version: '1.0.0',
    category: 'feature',
    author: 'PlainList',
    description: 'Unlock a built-in forest page that turns completed focus sessions into clickable trees.',
    longDescription:
      'This first-party plugin unlocks the Focus Forest page, store, backpack, and progression views without executing arbitrary plugin JavaScript.',
    features: [
      'Unlock the Focus Forest page',
      'Review each completed session as a tree',
      'Access store and backpack for progression items',
    ],
    runtime: 'manifest',
  },
  {
    id: THEME_PLUGIN_ID,
    name: 'Theme Pack',
    version: '2.0.0',
    category: 'theme',
    author: 'PlainList',
    description: 'Curated color themes with config-driven preview and persistence.',
    longDescription:
      'All theme variants now live in the manifest catalog and are resolved without executing plugin JavaScript.',
    themes: themePackThemes,
    features: [
      'Preview and save built-in themes',
      'Theme selection persists per user',
      'No arbitrary runtime script execution',
    ],
    runtime: 'manifest',
  },
];

export function findPluginManifest(pluginId: string): PluginManifest | undefined {
  return PLUGIN_CATALOG.find((plugin) => plugin.id === pluginId);
}

export function getThemeDefinitions(): ThemeDefinition[] {
  return findPluginManifest(THEME_PLUGIN_ID)?.themes ?? themePackThemes;
}

export function findThemeById(themeId: string): ThemeDefinition | undefined {
  return getThemeDefinitions().find((theme) => theme.id === themeId);
}
