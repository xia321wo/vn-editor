// ===== 故事阅读器 v3：体验包 =====
// 新增：①合成音效（心跳/惊吓，Web Audio，零素材）②段落式打字+点击推进 ③背景缓慢缩放（Ken Burns）
//      ④屏幕震动+闪红 ⑤结局收集（本地记录，刷新不丢）⑥静音/全屏按钮
// 数据字段：text 正文（\n\n 分段）| image 场景图 | name 说话人 | choices 选项
//          shake: true 震动闪红 | sfx: "scare"/"heartbeat" 音效

// ---------- 找到页面元素 ----------
const sceneEl = document.getElementById('scene');        // 场景容器（震动用）
const sceneImg = document.getElementById('bgimg');       // 全屏背景图
const flashEl = document.getElementById('flash');        // 闪红层
const nameLabel = document.getElementById('name-label'); // 说话人名字
const textEl = document.getElementById('story-text');    // 正文
const skipHint = document.getElementById('skip-hint');   // 「点击跳过/继续」
const dialogue = document.getElementById('dialogue');    // 对话框
const choicesEl = document.getElementById('choices');    // 选项区
const endingCount = document.getElementById('ending-count'); // 已解锁结局数
const muteBtn = document.getElementById('mute-btn');     // 静音按钮
const fsBtn = document.getElementById('fs-btn');         // 全屏按钮

// ---------- 状态 ----------
let typeTimer = null;      // 打字定时器
let paragraphs = [];       // 当前节点的分段列表
let paraIndex = 0;         // 当前打到第几段
let fullText = '';         // 当前段的完整文字
let currentNode = 'start';

// ============================================================
// 一、声音系统（Web Audio 合成，不需要任何音频文件）
// ============================================================
let audioCtx = null;
let muted = false;
let droneStarted = false;
let droneNodes = [];

// 首次点击时初始化（浏览器要求用户操作后才有声音）
function initAudio() {
  if (audioCtx) return;
  if (!window.AudioContext && !window.webkitAudioContext) return; // 不支持的环境直接跳过
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// 低频嗡鸣背景音（一直循环，营造压抑氛围）
function startDrone() {
  if (!audioCtx || muted || droneStarted) return;
  droneStarted = true;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc1.frequency.value = 55;       // 低音
  osc2.frequency.value = 55.7;     // 差 0.7Hz → 产生缓慢"呼吸"的拍频
  gain.gain.value = 0.05;          // 音量很轻，当氛围
  osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
  osc1.start(); osc2.start();
  droneNodes = [osc1, osc2, gain];
}

function stopDrone() {
  droneNodes.forEach(n => { try { n.stop(); } catch (e) {} });
  droneNodes = [];
  droneStarted = false;
}

// 一次低频重击（心跳、惊吓的基底）
function thump(when, vol) {
  const t = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(60, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);  // 音高快速下坠
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);    // 音量快速衰减
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(t); osc.stop(t + 0.35);
}

// 音效入口：heartbeat 心跳（紧张） / scare 惊吓（跳杀）
function playSfx(type) {
  if (muted || !audioCtx) return;
  if (type === 'heartbeat') {
    thump(0, 1.0);      // 咚
    thump(0.35, 0.8);   // 咚（第二下稍轻）
  } else if (type === 'scare') {
    thump(0, 1.4);      // 低音轰鸣
    const t = audioCtx.currentTime;   // 刺耳高音（短促尖叫感）
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.4);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.5);
  }
}

muteBtn.addEventListener('click', function () {
  muted = !muted;
  muteBtn.textContent = muted ? '🔇' : '🔊';
  if (muted) stopDrone();
  else { initAudio(); startDrone(); }  // 取消静音就恢复氛围音
});

// ============================================================
// 二、场景切换（淡入 + 缓慢缩放）
// ============================================================
function setScene(imagePath) {
  if (!imagePath) return;
  sceneImg.style.opacity = '0';
  sceneImg.onload = function () {
    sceneImg.style.opacity = '1';
    sceneImg.classList.remove('zoom');   // 重新触发缩放动画
    void sceneImg.offsetWidth;           // 强制浏览器重排（动画才会重放）
    sceneImg.classList.add('zoom');
  };
  sceneImg.src = imagePath;
}

// ============================================================
// 三、打字机：逐段显示，点击推进（Ren'Py 式节奏）
//    打字中点击 = 跳过当前段；段结束后点击 = 显示下一段；最后一段打完 = 出选项
// ============================================================
function typeParagraph() {
  fullText = paragraphs[paraIndex];
  textEl.textContent = '';
  skipHint.textContent = '点击跳过 ▸';
  skipHint.style.display = 'block';
  let i = 0;
  typeTimer = setInterval(function () {
    i++;
    textEl.textContent = fullText.slice(0, i);
    if (i >= fullText.length) finishParagraph();
  }, 35);
}

function finishParagraph() {
  clearInterval(typeTimer);
  typeTimer = null;
  textEl.textContent = fullText;
  paraIndex++;
  if (paraIndex < paragraphs.length) {
    skipHint.textContent = '点击继续 ▸';   // 还有下一段，等玩家点击
  } else {
    skipHint.style.display = 'none';
    showChoices();                          // 全部打完，出选项
  }
}

dialogue.addEventListener('click', function () {
  initAudio();
  if (!muted && !droneStarted) startDrone();   // 第一次点击开始氛围音
  if (typeTimer) finishParagraph();            // 打字中：跳过当前段
  else if (paraIndex < paragraphs.length) typeParagraph(); // 段结束：显示下一段
});

// ============================================================
// 四、选项 + 结局收集（localStorage，刷新不丢）
// ============================================================
const END_KEY = 'soup_endings_v1';

function getEndings() {
  try { return JSON.parse(window.localStorage.getItem(END_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveEnding(name) {
  const arr = getEndings();
  if (!arr.includes(name)) {
    arr.push(name);
    try { window.localStorage.setItem(END_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  updateEndingCount();
}
function updateEndingCount() {
  const total = Object.keys(STORY).filter(n => STORY[n].choices.length === 0).length;
  endingCount.textContent = '已解锁 ' + getEndings().length + '/' + total;
}

function showChoices() {
  const node = STORY[currentNode];
  choicesEl.innerHTML = '';

  node.choices.forEach(function (choice) {
    const btn = document.createElement('button');
    btn.textContent = choice.text;
    btn.addEventListener('click', function () {
      showNode(choice.next);
    });
    choicesEl.appendChild(btn);
  });

  // 结局：记录收集 + 显示「重新开始」
  if (node.choices.length === 0) {
    saveEnding(currentNode);
    const again = document.createElement('button');
    again.textContent = '🔄 重新开始';
    again.className = 'restart';
    again.addEventListener('click', function () {
      showNode('start');
    });
    choicesEl.appendChild(again);
  }
}

// ============================================================
// 五、显示节点（核心入口）
// ============================================================
function showNode(nodeName) {
  currentNode = nodeName;
  const node = STORY[nodeName];

  choicesEl.innerHTML = '';            // ① 先清掉上一节点的选项（避免残留）
  setScene(node.image);                // ② 切背景

  if (node.name) {                     // ③ 说话人名字
    nameLabel.textContent = node.name;
    nameLabel.style.display = 'inline-block';
  } else {
    nameLabel.style.display = 'none';
  }

  if (node.shake) {                    // ④ 惊吓时刻：震动 + 闪红
    sceneEl.classList.remove('shake');
    void sceneEl.offsetWidth;
    sceneEl.classList.add('shake');
    flashEl.classList.remove('flash');
    void flashEl.offsetWidth;
    flashEl.classList.add('flash');
  }
  if (node.sfx) playSfx(node.sfx);     // ⑤ 音效

  paragraphs = node.text.split(/\n\n+/);   // ⑥ 按空行分段
  paraIndex = 0;
  typeParagraph();                     // ⑦ 打字机显示第一段
}

// 全屏按钮
fsBtn.addEventListener('click', function () {
  if (document.documentElement && document.documentElement.requestFullscreen) {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }
});

// 启动
showNode('start');
updateEndingCount();

// 调试用：浏览器控制台输入 showNode('节点名') 可跳到任意节点
window.showNode = showNode;
