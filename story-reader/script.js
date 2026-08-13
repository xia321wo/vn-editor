// ===== 故事阅读器 v3：体验包 =====
// 新增：①合成音效（心跳/惊吓，Web Audio，零素材）②段落式打字+点击推进 ③背景缓慢缩放（Ken Burns）
//      ④屏幕震动+闪红 ⑤结局收集（本地记录，刷新不丢）⑥静音/全屏按钮
// 数据字段：text 正文（\n\n 分段）| image 场景图 | name 说话人 | choices 选项
//          shake: true 震动闪红 | sfx: "scare"/"heartbeat" 音效
// 选项字段：sanity 理智变化（负=下降，正=恢复）| need_sanity 理智门控（≤ 该值才显示）
// 理智系统：0-100，开局 100；理智条在左上角，低理智变红；重新开始自动复位
// 惊吓节点（shake: true）进入时理智自动 -10（闪红 = 惊吓代价）

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
const sanityText = document.getElementById('sanity-text'); // 理智数字
const sanityBar = document.getElementById('sanity-bar');   // 理智条

// ---------- 状态 ----------
let typeTimer = null;      // 打字定时器
let paragraphs = [];       // 当前节点的分段列表
let paraIndex = 0;         // 当前打到第几段
let fullText = '';         // 当前段的完整文字
let currentNode = 'start';
const SANITY_START = 100;  // 理智初始值
const SANITY_MIN = 0;      // 理智下限
const SANITY_MAX = 100;    // 理智上限
let sanity = SANITY_START; // 当前理智
const SHAKE_SANITY_COST = 10; // 每次惊吓（闪红）的理智代价

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
// 二、场景切换（淡入 + 缓慢缩放，聚焦点轴心）
// ============================================================
// focus 参数：画面聚焦点（人脸位置）——中心/上/下/左/右
// zoomEnabled：false 表示该节点不做缩放（脸部特写场景用）
function setScene(imagePath, focus, zoomEnabled) {
  if (!imagePath) return;
  // 聚焦点 → 画面显示位置 + 缩放轴心
  const map = {
    center: ['50% 50%', 'center'],
    top:    ['50% 25%', '50% 25%'],
    bottom: ['50% 75%', '50% 75%'],
    left:   ['25% 50%', '25% 50%'],
    right:  ['75% 50%', '75% 50%']
  };
  const pos = map[focus] || ['50% 50%', 'center'];
  sceneImg.style.objectPosition = pos[0];   // 决定图片的哪部分显示在画面里
  sceneImg.style.transformOrigin = pos[1];  // 缩放时以哪个点为轴心（人脸不动）
  sceneImg.style.opacity = '0';
  sceneImg.onload = function () {
    sceneImg.style.opacity = '1';
    if (zoomEnabled) {
      sceneImg.classList.remove('zoom');    // 重新触发缩放动画
      void sceneImg.offsetWidth;
      sceneImg.classList.add('zoom');
    } else {
      sceneImg.classList.remove('zoom');    // 该节点不要缩放
    }
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

// 理智条刷新：数字 + 进度条宽度 + 低理智变红
function updateSanityBar() {
  sanityText.textContent = '理智 ' + sanity;
  sanityBar.style.width = (sanity / SANITY_MAX * 100) + '%';
  sanityBar.classList.toggle('low', sanity <= 40);
}

function updateEndingCount() {
  const total = Object.keys(STORY).filter(n => STORY[n].choices.length === 0).length;
  endingCount.textContent = '已解锁 ' + getEndings().length + '/' + total;
}

function showChoices() {
  const node = STORY[currentNode];
  choicesEl.innerHTML = '';

  // 理智门控：need_sanity 的选项在理智不达标时不显示（真结局入口）
  const visible = node.choices.filter(function (c) {
    return c.need_sanity === undefined || sanity <= c.need_sanity;
  });
  const list = visible.length > 0 ? visible : node.choices; // 保险：全被门控时退回全显示，绝不卡死玩家

  list.forEach(function (choice) {
    const btn = document.createElement('button');
    btn.textContent = choice.text;
    btn.addEventListener('click', function () {
      if (choice.sanity) {   // 选择影响理智
        sanity = Math.max(SANITY_MIN, Math.min(SANITY_MAX, sanity + choice.sanity));
        updateSanityBar();
      }
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

  if (nodeName === 'start') sanity = SANITY_START;   // 重新开始时理智复位
  updateSanityBar();                                 // 理智条随时刷新

  choicesEl.innerHTML = '';            // ① 先清掉上一节点的选项（避免残留）
  setScene(node.image, node.focus, node.zoom !== false); // ② 切背景（聚焦点/是否缩放）

  if (node.name) {                     // ③ 说话人名字
    nameLabel.textContent = node.name;
    nameLabel.style.display = 'inline-block';
  } else {
    nameLabel.style.display = 'none';
  }

  if (node.shake) {                    // ④ 惊吓时刻：震动 + 闪红 + 理智下降
    sceneEl.classList.remove('shake');
    void sceneEl.offsetWidth;
    sceneEl.classList.add('shake');
    flashEl.classList.remove('flash');
    void flashEl.offsetWidth;
    flashEl.classList.add('flash');
    sanity = Math.max(SANITY_MIN, sanity - SHAKE_SANITY_COST); // 惊吓代价：理智 -10
    updateSanityBar();
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
window.getSanity = function () { return sanity; };  // 调试/验证用：查当前理智
window.getNode = function () { return currentNode; }; // 调试/验证用：查当前节点
