// ===== 故事阅读器逻辑 =====
// 核心思路（记住这句话，这就是你产品的发动机）：
// 「显示当前节点的文字 → 显示选项按钮 → 点按钮跳到下一个节点」

// 找到页面上的元素（类似 C 里取变量的地址）
const textEl = document.getElementById('story-text');
const choicesEl = document.getElementById('choices');

// 显示一个节点
function showNode(nodeName) {
  const node = STORY[nodeName];   // 从故事数据里取出这个节点

  // 1. 显示文字
  textEl.textContent = node.text;

  // 2. 清空旧的选项按钮（innerHTML = '' 就是把里面的东西清掉）
  choicesEl.innerHTML = '';

  // 3. 为每个选项创建一个按钮
  //    forEach = 遍历数组，对每个选项执行一次里面的函数
  node.choices.forEach(function (choice) {
    const btn = document.createElement('button');  // 造一个按钮
    btn.textContent = choice.text;                // 按钮上写选项文字
    btn.addEventListener('click', function () {   // 点击时……
      showNode(choice.next);                      // ……跳到下一个节点（递归调用）
    });
    choicesEl.appendChild(btn);                   // 把按钮放到页面上
  });

  // 4. 如果是结局（没有选项），显示「重新开始」按钮
  if (node.choices.length === 0) {
    const again = document.createElement('button');
    again.textContent = '🔄 重新开始';
    again.addEventListener('click', function () {
      showNode('start');
    });
    choicesEl.appendChild(again);
  }
}

// 启动：显示第一个节点
showNode('start');
