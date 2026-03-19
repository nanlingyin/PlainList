<template>
  <div id="auth-terminal" @click="focusInput">
    <div ref="termBody" id="term-body">
      <div v-for="(line, i) in lines" :key="i"
           :class="['term-line', line.type ? 'term-' + line.type : '']">
        <template v-if="line.link">
          guide → <a href="/guide.html" target="_blank" rel="noopener">/guide.html</a>
        </template>
        <template v-else>{{ line.text }}</template>
      </div>
      <div v-if="!closing" class="term-prompt-line">
        <span class="term-ps">pl/</span>
        <input ref="inputEl"
               :type="isPassState ? 'password' : 'text'"
               autocomplete="off"
               :spellcheck="false"
               v-model="inputVal"
               @keydown="onKeyDown" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

const emit = defineEmits(['login'])
const auth = useAuthStore()
const { get, post } = useApi()

const termBody = ref(null)
const inputEl = ref(null)
const lines = ref([])
const inputVal = ref('')
const state = ref(null) // null | 'passphrase' | 'new-name' | 'new-pass' | 'ob-name' | 'ob-pass'
const pendingUser = ref(null)
const pendingName = ref(null)
const closing = ref(false)
const history = ref([])
const histIdx = ref(-1)

const isPassState = ref(false)

function print(type, text) {
  if (type === 'link') { lines.value.push({ link: true, type: 'out' }); return }
  lines.value.push({ type: type || '', text: text || '' })
  nextTick(scrollBottom)
}

function scrollBottom() {
  const el = document.getElementById('auth-terminal')
  if (el) el.scrollTop = el.scrollHeight
}

function focusInput() {
  inputEl.value?.focus()
}

function termBar(pct, len = 24) {
  const f = Math.round(pct / 100 * len)
  return '█'.repeat(f) + '░'.repeat(len - f)
}

function showWelcome() {
  const BW = 55
  const bx = s => { s = s || ''; return '  │  ' + s + ' '.repeat(Math.max(0, BW - s.length)) + '  │' }
  const bxTop = '  ┌' + '─'.repeat(BW + 4) + '┐'
  const bxBot = '  └' + '─'.repeat(BW + 4) + '┘'

  const ls = [
    { t: '',    s: '' },
    { t: '',    s: '   ____  _       _       _     _     _   ' },
    { t: '',    s: '  |  _ \\| | __ _(_)_ __ | |   (_)___| |_ ' },
    { t: '',    s: '  | |_) | |/ _` | | \'_ \\| |   | / __| __|' },
    { t: '',    s: '  |  __/| | (_| | | | | | |___| \\__ \\ |_ ' },
    { t: '',    s: '  |_|   |_|\\__,_|_|_| |_|_____|_|___/\\__|' },
    { t: '',    s: '' },
    { t: '',    s: bxTop },
    { t: '',    s: bx('') },
    { t: 'out', s: bx('welcome to PlainList.') },
    { t: '',    s: bx('') },
    { t: 'out', s: bx('a radically minimal tool site that integrates habit') },
    { t: 'out', s: bx('tracking, event reminders, todo lists, and even') },
    { t: 'out', s: bx('simple calendar annotations -- all in one plain page.') },
    { t: '',    s: bx('') },
    { t: 'out', s: bx('it may feel unfamiliar at first, but once you get') },
    { t: 'out', s: bx('the hang of it, you\'ll discover the efficiency and') },
    { t: 'out', s: bx('intent behind every design choice.') },
    { t: '',    s: bx('') },
    { t: '',    s: bxBot },
    { t: '',    s: '' },
    { t: 'out', s: '  quick start:' },
    { t: 'out', s: '    pl cd <name>       log in' },
    { t: 'out', s: '    pl new <name>      create account' },
    { t: 'out', s: '    pl onboard         guided setup' },
    { t: '',    s: '' },
    { t: 'out', s: '  type /help to see all available commands.' },
    { t: 'link' },
    { t: '',    s: '' },
  ]

  let i = 0
  function next() {
    if (i >= ls.length) { nextTick(() => inputEl.value?.focus()); return }
    const l = ls[i++]
    print(l.t, l.s)
    setTimeout(next, l.s === '' ? 25 : 45)
  }
  setTimeout(next, 80)
}

async function onKeyDown(e) {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (histIdx.value < history.value.length - 1) {
      histIdx.value++
      inputVal.value = history.value[histIdx.value]
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (histIdx.value > 0) { histIdx.value--; inputVal.value = history.value[histIdx.value] }
    else { histIdx.value = -1; inputVal.value = '' }
    return
  }
  if (e.key !== 'Enter') return

  const val = inputVal.value
  if (!val.trim()) return

  // Freeze line
  const frozen = 'pl/ ' + (isPassState.value ? '·'.repeat(Math.min(val.length, 20)) : val)
  lines.value.push({ type: '', text: frozen })
  if (!isPassState.value) { history.value.unshift(val); histIdx.value = -1 }
  inputVal.value = ''

  await exec(val.trim())
  nextTick(scrollBottom)
}

async function exec(val) {
  // Multi-step states
  if (state.value === 'passphrase') {
    try {
      const resp = await post('/auth/login', { username: pendingUser.value, password: val })
      auth.setAuth(resp.token, pendingUser.value, resp.isAdmin)
      emit('login')
      print(''); print('ok', '  ✓  welcome back, ' + pendingUser.value + '.  opening dashboard…')
      state.value = null; closing.value = true
    } catch {
      print('err', '  ✗  incorrect passphrase.')
      print('out', '     try again, or type  pl graphic  to switch modes.')
      print('')
      isPassState.value = false; state.value = null
    }
    return
  }

  if (state.value === 'new-name' || state.value === 'ob-name') {
    const name = val.toLowerCase()
    if (!/^[a-zA-Z0-9_\-.]{2,20}$/.test(val)) {
      print('err', '  ✗  2–20 chars, letters / numbers / _ only.'); return
    }
    const accounts = await get('/auth/accounts').catch(() => [])
    if (accounts.find(a => a.username === name)) {
      print('err', '  ✗  "' + name + '" is already taken.'); return
    }
    pendingName.value = name
    state.value = state.value === 'ob-name' ? 'ob-pass' : 'new-pass'
    isPassState.value = true
    print('out', '  set a passphrase  (≥ 3 chars):')
    return
  }

  if (state.value === 'new-pass' || state.value === 'ob-pass') {
    if (val.length < 3) { print('err', '  ✗  at least 3 characters.'); return }
    try {
      const resp = await post('/auth/register', { username: pendingName.value, password: val })
      auth.setAuth(resp.token, pendingName.value, resp.isAdmin)
      emit('login')
      print('')
      if (state.value === 'ob-pass') {
        print('ok',  '  ✓  all set, ' + pendingName.value + '!')
        print('out', '     head to the Day section to add your first habit or task.')
      } else {
        print('ok',  '  ✓  account created.  welcome, ' + pendingName.value + '!')
      }
      print('out', '     opening dashboard…')
      state.value = null; closing.value = true
    } catch(e) {
      print('err', '  ✗  ' + (e.message || 'registration failed.'))
      state.value = null; isPassState.value = false
    }
    return
  }

  // Commands
  if (val === '/help' || val === 'help') {
    print(''); print('out', '  commands:')
    print('out', '    pl cd <name>      log in to account')
    print('out', '    pl new <name>     create new account')
    print('out', '    pl ls             list accounts')
    print('out', '    pl onboard        guided first-time setup')
    print('out', '    pl graphic        switch to graphical mode')
    print('out', '    /help             show this help')
    print('out', '    /clear            clear terminal')
    print(''); return
  }

  if (val === '/clear' || val === 'clear') {
    lines.value = []; return
  }

  if (!val.startsWith('pl ') && val !== 'pl') {
    print('err', '  unknown command: ' + val)
    print('out', '  type /help for available commands.')
    return
  }

  const parts = val.slice(3).trim().split(/\s+/)
  const sub = parts[0]; const arg = parts[1]

  if (sub === 'ls') {
    const accounts = await get('/auth/accounts').catch(() => [])
    print('')
    if (!accounts.length) print('out', '  no accounts yet.  try: pl onboard')
    else print('out', '  accounts: ' + accounts.map(a => a.username).join(', '))
    print(''); return
  }

  if (sub === 'onboard') {
    print(''); print('out', '  let\'s get you set up.')
    print('out', '  choose a username  (2–20 chars):')
    state.value = 'ob-name'; return
  }

  if (sub === 'cd') {
    const accounts = await get('/auth/accounts').catch(() => [])
    if (!arg) {
      print('')
      if (!accounts.length) print('out', '  no accounts yet.  try: pl onboard')
      else { print('out', '  accounts: ' + accounts.map(a => a.username).join(', ')); print('out', '  usage:    pl cd [name]') }
      print(''); return
    }
    if (!accounts.find(a => a.username === arg)) {
      print('err', '  ✗  account "' + arg + '" not found.  try: pl ls'); return
    }
    pendingUser.value = arg
    state.value = 'passphrase'
    isPassState.value = true
    print('out', '  passphrase for ' + arg + ':')
    return
  }

  if (sub === 'new') {
    if (arg) {
      const name = arg.toLowerCase()
      if (!/^[a-zA-Z0-9_\-.]{2,20}$/.test(arg)) {
        print('err', '  ✗  name must be 2–20 chars, letters/numbers/_ only.'); return
      }
      const accounts = await get('/auth/accounts').catch(() => [])
      if (accounts.find(a => a.username === name)) {
        print('err', '  ✗  "' + name + '" already exists.'); return
      }
      pendingName.value = name
      state.value = 'new-pass'
      isPassState.value = true
      print('out', '  creating: ' + name)
      print('out', '  set a passphrase  (≥ 3 chars):')
    } else {
      print('out', '  choose a username  (2–20 chars):')
      state.value = 'new-name'
    }
    return
  }

  if (sub === 'graphic') {
    // Not implemented in Vue version — terminal is the only auth mode
    print('out', '  graphical mode not available in this version.')
    return
  }

  print('err', '  unknown subcommand: pl ' + sub)
  print('out', '  type /help for available commands.')
}

onMounted(() => {
  showWelcome()
})
</script>
