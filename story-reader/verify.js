// ===== 故事阅读器验证工具（v3） =====
// 用法：改完 story.js（或阅读器代码）后，在 story-reader 目录运行：node verify.js
// 作用：①检查剧情数据（断链/死节点/图片缺失）②模拟点击遍历全部分支（含段落式打字）
//      ③验证震动标记、结局收集、静音/全屏按钮不崩溃 ④验证重新开始
// 输出「✓✓ 全部验证通过」= 可以放心 git 提交了。

const fs = require('fs');
const path = require('path');

const dir = __dirname;
let failed = false;
const fail = (msg) => { failed = true; console.log(' ✗', msg); };

// ---------- ① 加载并检查故事数据 ----------
const storyCode = fs.readFileSync(path.join(dir, 'story.js'), 'utf8');
let STORY;
{
  const m = { exports: {} };
  new Function('module', 'exports', storyCode + '\n;module.exports = STORY;')(m, m.exports);
  STORY = m.exports;
}

console.log('=== ① 剧情数据结构检查 ===');
if (!STORY.start) fail('缺少 start 节点');
const nodeCount = Object.keys(STORY).length;
for (const [name, node] of Object.entries(STORY)) {
  if (typeof node.text !== 'string' || !node.text.trim()) fail(`${name}: text 缺失`);
  if (!Array.isArray(node.choices)) { fail(`${name}: choices 不是数组`); continue; }
  for (const c of node.choices) {
    if (!c.text) fail(`${name}: 选项缺文字`);
    if (!STORY[c.next]) fail(`${name}: 选项「${c.text}」指向不存在的节点 '${c.next}'（断链）`);
  }
  if (!node.image) { fail(`${name}: 缺少 image 字段`); continue; }
  if (!fs.existsSync(path.join(dir, node.image))) fail(`${name}: 图片文件不存在 ${node.image}`);
  if (node.sfx && !['scare', 'heartbeat'].includes(node.sfx)) fail(`${name}: 未知音效类型 '${node.sfx}'`);
  for (const c of (node.choices || [])) {
    if (c.sanity !== undefined && typeof c.sanity !== 'number') fail(`${name}: sanity 必须是数字`);
    if (c.need_sanity !== undefined && typeof c.need_sanity !== 'number') fail(`${name}: need_sanity 必须是数字`);
  }
  if (node.shake !== undefined && typeof node.shake !== 'boolean') fail(`${name}: shake 必须是 true/false`);
}
const seen = new Set(['start']); const queue = ['start'];
while (queue.length) {
  const n = queue.shift();
  if (!STORY[n]) continue;
  for (const c of STORY[n].choices) if (!seen.has(c.next)) { seen.add(c.next); queue.push(c.next); }
}
for (const name of Object.keys(STORY)) if (!seen.has(name)) fail(`${name}: 从 start 无法到达（死节点）`);
const endings = Object.keys(STORY).filter(n => STORY[n].choices.length === 0);
if (endings.length === 0) fail('没有任何结局节点');
const shakeNodes = Object.keys(STORY).filter(n => STORY[n].shake);
const sfxNodes = Object.keys(STORY).filter(n => STORY[n].sfx);
console.log(`  ✓ 节点 ${nodeCount} 个 | 结局 ${endings.length} 个 | 震动节点 ${shakeNodes.length} 个 | 音效节点 ${sfxNodes.length} 个`);

// ---------- ② 模拟 DOM（v3 UI）+ 全分支真实点击遍历 ----------
console.log('=== ② 阅读器逻辑检查（段落式打字 + 全分支）===');
function makeEl(id) {
  const el = {
    id, textContent: '', src: '', className: '',
    style: { display: 'none', opacity: '0' },
    classList: { _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); },
      toggle(c, force) { if (force === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else { force ? this._s.add(c) : this._s.delete(c); } } },
    children: [], listeners: {},
    addEventListener(ev, fn) { this.listeners[ev] = fn; },
    appendChild(c) { this.children.push(c); },
    set innerHTML(v) { this.children = []; },
    get innerHTML() { return this.children.map(c => c.textContent).join('|'); },
    click() { if (this.listeners.click) this.listeners.click(); }
  };
  return el;
}
const elements = {
  'scene': makeEl('scene'),
  'bgimg': makeEl('bgimg'),
  'flash': makeEl('flash'),
  'name-label': makeEl('name-label'),
  'story-text': makeEl('story-text'),
  'skip-hint': makeEl('skip-hint'),
  'dialogue': makeEl('dialogue'),
  'choices': makeEl('choices'),
  'ending-count': makeEl('ending-count'),
  'mute-btn': makeEl('mute-btn'),
  'fs-btn': makeEl('fs-btn'),
  'sanity-text': makeEl('sanity-text'),
  'sanity-bar': makeEl('sanity-bar')
};
const document = { getElementById: (id) => elements[id], createElement: () => makeEl('button') };
// 模拟 localStorage；不提供 AudioContext → 音效自动跳过（不崩溃）
const localStorageMock = {
  _s: {},
  getItem(k) { return this._s[k] !== undefined ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); }
};
const windowMock = { localStorage: localStorageMock };

new Function('document', 'STORY', 'window',
  fs.readFileSync(path.join(dir, 'script.js'), 'utf8'))(document, STORY, windowMock);

const textEl = elements['story-text'], choicesEl = elements['choices'],
      bgimg = elements['bgimg'], dialogue = elements['dialogue'],
      nameLabel = elements['name-label'], sceneEl = elements['scene'],
      endingCount = elements['ending-count'],
      muteBtn = elements['mute-btn'], fsBtn = elements['fs-btn'];

// 启动：应处于第一段打字中
if (textEl.textContent.length >= STORY.start.text.split(/\n\n+/)[0].length) fail('启动时未处于打字状态');
console.log('  启动 → 第一段打字中 ✓');

// 点击推进到选项出现（多段文本需要多次点击）
function skipToChoices() {
  let guard = 0;
  while (choicesEl.children.length === 0 && guard++ < 50) dialogue.click();
  if (guard >= 50) fail('点击多次后选项仍未出现');
}
skipToChoices();
if (choicesEl.children.length !== STORY.start.choices.length) fail('选项数量不对');
console.log('  段落推进 → 选项出现: ', choicesEl.innerHTML);

// 深度优先遍历所有分支
const visited = new Set();        // 已完成遍历的节点
const gatedPending = new Map();   // 节点名 -> 曾被理智门控隐藏、待低理智时复查的选项
function walk(nodeName, pathArr) {
  if (visited.has(nodeName)) {
    // 已遍历过：检查之前被门控隐藏的选项，理智更低后是否已可见（真结局入口复查）
    const pending = gatedPending.get(nodeName);
    if (pending) {
      for (const choice of pending) {
        windowMock.showNode(nodeName); skipToChoices();
        const idx = choicesEl.children.findIndex(b => b.textContent === choice.text);
        if (idx !== -1) {
          gatedPending.delete(nodeName);
          console.log(`    (门控复查: 理智降至 ${windowMock.getSanity()}，选项「${choice.text}」出现)`);
          choicesEl.children[idx].click(); skipToChoices();
          walk(choice.next, [...pathArr, choice.next]);
        }
      }
    }
    return;
  }
  visited.add(nodeName);
  const node = STORY[nodeName];
  if (node.choices.length === 0) {
    console.log(`  ✓ ${pathArr.join(' → ')} → 结局「${nodeName}」`);
    return;
  }
  for (const choice of node.choices) {
    windowMock.showNode(nodeName);
    skipToChoices();
    // 震动节点检查：显示后 scene 应有 shake class
    if (node.shake && !sceneEl.classList.contains('shake')) fail(`${nodeName}: 标记了 shake 但未触发震动`);
    const idx = choicesEl.children.findIndex(b => b.textContent === choice.text);
    if (idx === -1) {
      // 理智门控：need_sanity 选项在理智不达标时隐藏，属于预期行为
      if (choice.need_sanity !== undefined && windowMock.getSanity() > choice.need_sanity) {
        console.log(`    (门控隐藏待复查: 「${choice.text}」需理智≤${choice.need_sanity}，当前 ${windowMock.getSanity()})`);
        if (!gatedPending.has(nodeName)) gatedPending.set(nodeName, []);
        gatedPending.get(nodeName).push(choice);
        continue;
      }
      fail(`${nodeName}: 找不到选项「${choice.text}」`); continue;
    }
    choicesEl.children[idx].click();
    skipToChoices();
    const nextName = choice.next; // 目标节点由选项数据直接给出
    // 段落式显示：此时文本框应等于目标节点的最后一段
    const lastPara = STORY[nextName].text.split(/\n\n+/).pop();
    if (textEl.textContent !== lastPara) fail(`${nextName}: 点击「${choice.text}」后文本未显示（${textEl.textContent.slice(0, 12)}…）`);
    if (bgimg.src !== STORY[nextName].image) fail(`${nextName}: 背景图未切换`);
    if (nameLabel.style.display !== 'none') fail(`${nextName}: 无 name 字段但标签显示了`);
    walk(nextName, [...pathArr, nextName]);
  }
}
walk('start', ['start']);
console.log(`  遍历覆盖 ${visited.size}/${nodeCount} 个节点`);
if (visited.size !== nodeCount) fail('有节点未被遍历覆盖');

// ---------- ③ 结局收集 + 重新开始 ----------
console.log('=== ③ 结局收集与重新开始检查 ===');
const collected = JSON.parse(localStorageMock.getItem('soup_endings_v1') || '[]');
if (collected.length !== endings.length) fail(`结局收集不完整: 已收集 ${collected.length}/${endings.length}`);
if (!/已解锁 \d+\/\d+/.test(endingCount.textContent)) fail('顶部结局计数未更新');
console.log(`  结局收集: ${collected.length}/${endings.length} | 计数显示: ${endingCount.textContent} ✓`);

// 重新开始
windowMock.showNode('start'); skipToChoices();
{
  let cur = 'start'; let guard = 0;
  while (STORY[cur].choices.length > 0 && guard++ < 100) {
    const next = STORY[cur].choices[0].next;
    choicesEl.children[0].click(); skipToChoices();
    const lastPara = STORY[next].text.split(/\n\n+/).pop();
    if (textEl.textContent !== lastPara) fail(`${next}: 文本未显示`);
    cur = next;
  }
  const hasRestart = choicesEl.children.some(c => c.className === 'restart' && /重新开始/.test(c.textContent));
  if (!hasRestart) fail('结局缺少「重新开始」按钮');
  choicesEl.children.find(c => c.className === 'restart').click();
  skipToChoices();
  const startLast = STORY.start.text.split(/\n\n+/).pop(); // 段落式：文本框只显示最后一段
  if (textEl.textContent !== startLast || bgimg.src !== STORY.start.image) fail('重新开始未回到 start');
  if (windowMock.getSanity() !== 100) fail(`重新开始后理智未复位: ${windowMock.getSanity()}`);
  console.log('  重新开始 → 回到 start，背景图:', bgimg.src, '✓');
}

// ---------- ④ 按钮与名字标签 ----------
console.log('=== ④ 静音/全屏按钮与名字标签 ===');
muteBtn.click(); fsBtn.click();
if (muteBtn.textContent !== '🔇') fail('静音按钮未切换');
muteBtn.click();
if (muteBtn.textContent !== '🔊') fail('取消静音未切换');
console.log('  静音/全屏按钮点击无异常 ✓');
windowMock.showNode('start'); skipToChoices();
if (nameLabel.style.display !== 'none') fail('无 name 字段时标签应隐藏');
STORY.start.name = '测试';
windowMock.showNode('start'); skipToChoices();
if (nameLabel.style.display !== 'inline-block' || nameLabel.textContent !== '测试') fail('有 name 字段时标签未显示');
delete STORY.start.name;
console.log('  名字标签：无 name 隐藏 / 有 name 显示 ✓');

// ---------- ⑤ 理智系统专项（真结局门控） ----------
console.log('=== ⑤ 理智系统专项（真结局门控）===');
function nav(route) { // 沿给定路线逐选项真实点击（与真实游玩一致：每个节点只触发一次惊吓扣理智）
  windowMock.showNode(route[0]); skipToChoices();
  let cur = route[0];
  for (const target of route.slice(1)) {
    const choice = STORY[cur].choices.find(c => c.next === target);
    if (!choice) { fail(`${cur}: 无通向 ${target} 的选项`); return; }
    const idx = choicesEl.children.findIndex(b => b.textContent === choice.text);
    if (idx === -1) { fail(`${cur}: 找不到选项「${choice.text}」`); return; }
    choicesEl.children[idx].click(); skipToChoices();
    cur = target;
  }
}
// 常规真相线：选择 -60 + 惊吓 -10 = 30（> 25），真结局入口被隐藏
nav(['start','frontdoor','kitchen','kitchen2','green_onion','confront','truth','who_is_she']);
console.log(`  常规真相线抵达 who_is_she，理智 = ${windowMock.getSanity()}`);
if (windowMock.getSanity() !== 30) fail(`常规线理智应为 30（含惊吓-10），实际 ${windowMock.getSanity()}`);
if (choicesEl.children.some(b => /站在原地/.test(b.textContent))) fail('理智 40 > 35，真结局选项不应出现');
console.log('  ✓ 理智 30 > 25：真结局选项被门控隐藏');
// 崩溃线：选择 -65 + 惊吓 -20 = 15（≤ 25），真结局入口出现
nav(['start','frontdoor','bedroom','peek','knife_1','apple','standoff','self_threat','who_is_she']);
console.log(`  崩溃线抵达 who_is_she，理智 = ${windowMock.getSanity()}`);
if (windowMock.getSanity() !== 15) fail(`崩溃线理智应为 15（含惊吓-20），实际 ${windowMock.getSanity()}`);
const goodBtn = choicesEl.children.find(b => /站在原地/.test(b.textContent));
if (!goodBtn) fail('理智 35 ≤ 35，真结局选项应出现');
console.log('  ✓ 理智 15 ≤ 25：真结局选项出现');
goodBtn.click(); skipToChoices();
if (windowMock.getNode() !== 'good_end') fail(`点击后未进入 good_end（当前 ${windowMock.getNode()}）`);
console.log('  ✓ 点击后进入真结局 good_end');

if (failed) { console.log('\n✗✗ 验证未通过，先修复再提交！'); process.exit(1); }
console.log('\n✓✓ 全部验证通过：可以放心提交');
process.exit(0);
