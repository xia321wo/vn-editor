// ===== 故事数据：你的第一个「作品」=====
// 结构说明：
// - 每个节点 = 一个场景，有文字 text 和选项 choices
// - choices 里的 next 指向下一个节点的名字
// - choices 为空 = 结局
// - image = 场景图片（img 文件夹里的 AI 生成图）

const STORY = {
  start: {
    text: "午夜十二点，图书馆的灯突然全灭了。你听到书架深处传来翻书的声音。",
    image: "img/start.png",
    choices: [
      { text: "走进去看看", next: "enter" },
      { text: "转身就跑", next: "run" }
    ]
  },
  enter: {
    text: "你摸黑走进去，看到一本发光的书，书页自己翻动着，仿佛在等你。",
    image: "img/enter.png",
    choices: [
      { text: "翻开那本书", next: "book" },
      { text: "退出图书馆", next: "run" }
    ]
  },
  book: {
    text: "书页上写着你的名字，下面是一行字：「你终于来了。」故事，才刚刚开始……",
    image: "img/book.png",
    choices: [
      { text: "继续阅读", next: "continue" },
      { text: "放下书，离开图书馆", next: "run" }
    ]
  },
  continue: {
    text: "你继续翻阅书页，发现里面记载着你的一生，甚至未来的事情。你感到一阵寒意。",
    image: "img/continue.png",
    choices: [
      { text: "继续看下去", next: "future" },
      { text: "放下书，离开图书馆", next: "run" }
    ]
  },
  future: {
    text: "书页上写着你的命运，你将会被书架深处的影子带走，永远消失在图书馆里。你感到一阵恐惧。",
    image: "img/next.png",
    choices: [
      { text: "你决定继续看下去", next: "next" },
      { text: "放下书，离开图书馆", next: "run" }
    ]
  },
  next: {
    text: "下一秒书架深处竟真站立着一个人影",
    image: "img/next.png",
    choices: [
      { text: "放下书,立刻逃出图书馆", next: "run" },
      { text: "你吓傻了，痴痴看着黑影缓缓逼近", next: "die" }
    ]
  },
  die: {
    text: "你被黑影抓住，书页上的文字开始消失，你的身体也慢慢消失在图书馆里。",
    image: "img/die.png",
    choices: []
  },
  run: {
    text: "你一路狂奔回家，锁上门。窗外的路灯下，似乎站着一个人影，手里捧着一本发光的书。",
    image: "img/run.png",
    choices: []
  }
};
