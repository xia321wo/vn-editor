// ===== 按钮变色 =====
// 目标：每点一次按钮，标题换一种颜色（循环）

// 1. 从页面上"找到"元素（类似 C 里取变量的地址）
const btn = document.getElementById('btn');
const title = document.getElementById('title');

// 2. 准备一个颜色列表（数组，类似 C 的数组）
const colors = ['red', 'blue', 'green', 'purple'];

// 3. 记录当前是第几个颜色（类似 C 的计数器）
let index = 0;

// 4. 给按钮绑定"点击事件"：每次点击执行后面的函数
btn.addEventListener('click', function () {
  index = (index + 1) % colors.length;   // 取余：到末尾就回到 0，循环换色
  title.style.color = colors[index];     // 改标题颜色

  // 在浏览器开发者工具的控制台里能看到这行字（F12 → Console）
  console.log('第 ' + (index + 1) + ' 次点击，颜色：' + colors[index]);
});
