// ===== 故事数据：《妈妈今晚的汤》v2 =====
// 改剧本就改这个文件！：
// - 每个节点 = 一个场景，text 是"引号里的台词"，choices 是选项
// - choices 里的 next 指向下一个节点名（别改）
// - choices 为空 = 结局
// - image = 场景图片
// - shake: true = 进入该节点时屏幕震动+闪红（惊吓时刻用）
// - sfx: "scare"（惊吓音）或 "heartbeat"（心跳声，紧张时刻用）——合成音效，无需素材
//
// v2 设定（重要）：
// - 主角和妈妈相依为命，三年一直一起住
// - 妈妈生前从不做饭，连面条都煮不熟——她是在儿子出事以后才学的
// - 真妈妈就是直发，"假妈妈"和她一模一样（这版没有假妈妈，只有真妈妈）
// - 汤里的肉：主角疑心是人肉（排骨没那么大块）——真相：是排骨汤，儿子生前最爱
// - 张奶奶从不和主角说话——因为楼下根本没有张奶奶，小卖部也不存在
// - 真结局：主角三年前雨夜车祸去世，妈妈患上严重心理疾病，每天炖排骨汤等儿子回来喝

const STORY = {
  // ===== 开场：晚自习放学回家 =====
  start: {
    text: "你晚自习放学。走在回家的路上，路灯拉长你的影子。\n\n拐进小区，小卖部灯还亮着。张奶奶坐在门口，直直看着你。",
    image: "img/street.png",
    choices: [
      { text: "照常回家", next: "frontdoor" },
      { text: "你莫名多看了她一眼", next: "grandma2" }
    ]
  },
  grandma2: {
    text: "你停下来，多看了她一眼。她也看着你。目光直勾勾的。你突然想起：这个小区，什么时候有的小卖部？",
    image: "img/what.png",
    choices: [
      { text: "快步回家", next: "frontdoor" },
      { text: "你好奇询问", next: "grandma3" }
    ]
  },
  grandma3: {
    shake: true,
    sfx: "scare",
    text: "老人仍然的看着你，一言不发。你忽然发现小卖部的红布后面挂着一张黑白的照片似乎正是眼前这个老人！",
    image: "img/shenme.png",
    choices: [
      { text: "你吓坏了，急忙跑回家", next: "frontdoor" }
    ]
  },
  frontdoor: {
    text: "厨房门口，门虚掩着。汤的香味从缝里飘出来。你站在客厅，垃圾桶堆着很多骨头，你忽然觉得哪里不对。\n\n你想了想：我妈什么时候会做饭了？你感到好奇你决定",
    image: "img/frontdoor.png",
    choices: [
      { text: "走进厨房", next: "kitchen" },
      { text: "先回房间放书包", next: "bedroom" },
      { text: "站在门口喊：「妈？」", next: "shout" }
    ]
  },
  shout: {
    text: "「妈？」厨房安静了三秒。厨房传来妈妈欣喜的声音「回来啦？来洗手，喝汤。」\n\n声音是你妈的",
    image: "img/frontdoor2.png",
    choices: [
      { text: "进厨房", next: "kitchen" },
      { text: "先回房间", next: "bedroom" }
    ]
  },

  // ===== 第一幕：厨房里的不对劲 =====
  bedroom: {
    text: "你回房间，放下书包。\n\n桌上相框里，是你们母子的合影。\n\n你盯着照片看了很久。\n\n照片是三年前拍的当时你还在上初三，你放好了书包，你决定",
    image: "img/bedroom.png",
    choices: [
      { text: "去厨房看看", next: "kitchen" },
      { text: "从门缝里偷偷看厨房", next: "peek" }
    ]
  },
  peek: {
    text: "妈妈背对着你，舀一勺汤，尝了一口。\n\n又端起碗凑到嘴边——没喝，光闻。\n\n还对着汤轻轻说了一句话，听不清。你感到很不对劲，你决定",
    image: "img/kitchen.png",
    choices: [
      { text: "走进厨房", next: "confront" },
      { text: "退回房间，锁门", next: "hide" },
      { text: "溜进厨房，拿刀", next: "knife_1" }
    ]
  },
  kitchen: {
    text: "你走进厨房。妈妈背对着你，站在灶台前。汤红得不健康，香味浓得发腻。你问道「妈，炖的什么？」\n\n「排骨汤。你最爱喝的。」\n\n你妈笑得自然。冰箱门没关严，你发现里面好像有什么东西，动了一下。你决定",
    image: "img/kitchen2.png",
    choices: [
      { text: "「妈，我帮你盛汤。」", next: "kitchen2" },
      { text: "借口喝水，拉开冰箱", next: "fridge" },
      { text: "退出厨房", next: "bedroom" }
    ]
  },
  fridge: {
    shake: true,
    sfx: "scare",
    text: "你拉开冰箱门，冷气扑面。\n\n冰箱里没有菜，没有鸡蛋——\n\n正中间，放着一摞文件，用保鲜膜裹着，上面冻得模糊不清。这时你妈妈发现了你的动作，脸上的笑容变得扭曲「儿子你是不是发现了什么呀？」",
    image: "img/fridge.png",
    choices: [
      { text: "「没、没什么，找水喝。」", next: "kitchen2" },
      { text: "跑！", next: "escape_door" }
    ]
  },
  kitchen2: {
    text: "你回到灶台边。汤已经盛好了。\n\n很清，飘着葱花，汤里有几块肉。\n\n肉块很大，大得不像是排骨。\n\n你盯着肉块。\n\n「妈，这是什么肉？」\n\n「排骨啊。你最爱喝的排骨汤。」\n\n排骨……没这么大块吧？\n\n你妈看着你僵硬的笑：\n\n「快喝吧，凉了就不好喝了。」",
    image: "img/kitchen3.png",
    choices: [
      { text: "喝", next: "drink_end" },
      { text: "「我妈根本不会做饭！这汤哪来的？」", next: "green_onion" },
      { text: "打翻汤，跑", next: "escape_door" }
    ]
  },
  green_onion: {
    text: "「我妈根本不会做饭！这汤是谁炖的？！」\n\n妈妈的笑容僵住，她没接话，低头，用筷子把葱花一片一片挑出来，挑得很慢。\n\n你盯着她的手。\n\n指甲缝里，有深色的东西。像泥，又像干了的血。\n\n「好了，喝吧。」",
    image: "img/kitchen4.png",
    choices: [
      { text: "喝", next: "drink_end" },
      { text: "「你不是我妈妈！」", next: "confront" },
      { text: "打翻汤，跑", next: "escape_door" }
    ]
  },
  confront: {
    text: "你退到墙边，声音在抖：\n\n「我妈不会做饭。她连面条都煮不熟。\n\n你是谁？你为什么长着我妈的脸？\n\n冰箱里那本东西是什么！，厨房安静下来。汤还在咕嘟。\n\n她放下勺子。脸上的笑，没了。她痴痴的望着你",
    image: "img/kitchen5.png",
    choices: [
      { text: "「你说话啊！你到底是谁！」", next: "truth" },
      { text: "趁她愣住，冲出门", next: "escape_door" }
    ]
  },
  truth: {
    text: "你发现桌子上正放着你刚刚在冰箱里看到的文件。你没看见有谁把它们放在这，就像凭空变出来的一样。你发现文件上写着：病历、诊断书、病程记录…严重妄想症",
    image: "img/kitchen.png",
    choices: [
      { text: "你回忆起了什么", next: "escape_door" },
      { text: "「不对，你不是我妈妈！」", next: "who_is_she" },
      { text: "沉默。端起那碗汤", next: "drink_end" }
    ]
  },
  who_is_she: {
    shake: true,
    sfx: "scare",
    text: "你吼完，喘着气。鬼使神差的，你走向了镜子，你看向镜子。\n\n你发现镜子里，什么都没有。你联想到那张病历单",
    image: "img/kitchen.png",
    choices: [
      { text: "「不可能！」冲出家门", next: "escape_door" },
      { text: "站在原地，沉默了很久", next: "good_end" }
    ]
  },

  // ===== 真结局 =====
  good_end: {
    text: "你站在原地，站了很久。\n\n雨夜的记忆，一段一段涌上来。\n\n刹车声。血。路边的积水里，倒映着一个人，躺在雨里。\n\n那个人，穿着你的校服。\n\n你慢慢抬起头，看着妈妈。\n\n她老了。三年，她老了很多。头发白了大半，眼睛下面全是青的。\n\n可她在笑。你摸了摸妈妈的脸，你的手径直穿过了妈妈的身体",
    image: "img/dawn.png",
    choices: []
  },

  // ===== 第二幕：逃亡 =====
  escape_door: {
    sfx: "heartbeat",
    text: "你冲出家门。楼道声控灯「啪」亮了。\n\n走廊尽头，站着张奶奶。\n\n她拎着保温桶，冲你笑：\n\n「跑什么？奶奶给你熬了粥。」\n\n你想起来了——她今天开口说话了。\n\n可她这辈子，都没跟你说过一个字。\n\n「您怎么……」她打断你，声音又干又哑，「奶奶就是来接你的。」",
    image: "img/corridor.png",
    choices: [
      { text: "挤过去，冲下楼", next: "downstairs_run" },
      { text: "退回屋里", next: "back_inside" },
      { text: "接过保温桶，掀盖子", next: "thermos" }
    ]
  },
  downstairs_run: {
    text: "你从她身边挤过去。她没拦，只在你身后说：\n\n「跑吧……反正，跑不掉的。」\n\n你一口气冲下楼，跑出小区，回头——\n\n你家那栋楼，窗户全黑。\n\n可你刚从那栋楼七楼跑出来。\n\n你数了数：\n\n六层。\n\n只有六层。\n\n没有第七层。\n\n你站在楼下，仰头看。\n\n六楼那扇窗，是你家的。\n\n你从来，都住在六楼。",
    image: "img/street.png",
    choices: [
      { text: "往派出所跑", next: "police" },
      { text: "停下来，再数一遍", next: "count_floors" },
      { text: "跑回楼里", next: "back_inside" }
    ]
  },
  count_floors: {
    sfx: "heartbeat",
    text: "你数了三遍。\n\n六层。\n\n你妈家在六楼。你刚才，从七楼跑下来。\n\n可这楼，没有七楼。\n\n你抬头，六楼窗边站着个人影，穿着碎花围裙，静静看着你。\n\n她朝你招手。\n\n你的手，在发抖。\n\n你忽然想起，你从来没有从外面看过这栋楼。\n\n一次都没有。",
    image: "img/building.png",
    choices: [
      { text: "往派出所跑", next: "police" },
      { text: "往回跑", next: "back_inside" }
    ]
  },
  police: {
    text: "凌晨的派出所。你话都说不利索：\n\n「我妈……汤……那楼只有六层……」\n\n民警抬头看了你一眼，低头查档案。\n\n他查了很久。再抬头时，脸色发白：\n\n「你说你叫什么？」\n\n你报了名字。\n\n他的嘴唇动了动：\n\n「……xxx，三年前，雨天车祸，当场死亡。」\n\n「档案上是这么写的。」\n\n你愣住了：「我就是他啊！我活得好好的！」\n\n他盯着你，目光直直的，穿过你，落在你身后的门上：\n\n「那……是谁在跟我说话？」\n\n你回头。\n\n值班室门口，妈妈站在那里，拎着保温桶，看着你。\n\n她看得见你。\n\n只有她，看得见你。",
    image: "img/police.png",
    choices: []
  },
  thermos: {
    text: "你掀开保温桶。\n\n白粥，热气腾腾。\n\n粥面上，飘着一根头发。\n\n直的。\n\n张奶奶盯着你，眼神亮得吓人：\n\n「喝吧。凉了，就不好喝了。」\n\n你想起她刚才说的：\n\n「奶奶就是来接你的。」\n\n接你……去哪？\n\n屋里传来「妈妈」的声音：\n\n「儿子！别喝她的！」\n\n门里一个，门外一个。\n\n一个要你喝粥，一个要你喝汤。\n\n都笑着。",
    image: "img/corridor.png",
    choices: [
      { text: "摔了保温桶，夺路而逃", next: "downstairs_run" },
      { text: "喝粥", next: "porridge_end" }
    ]
  },
  back_inside: {
    text: "你退回屋里。「妈妈」已经站在玄关等你。\n\n她没生气，甚至有点高兴：\n\n「就知道你会回来。汤还热着。」\n\n她伸手想摸你的头。\n\n你躲开了。\n\n你的手还在抖。刀还在你手里。",
    image: "img/kitchen.png",
    choices: [
      { text: "挥刀，拼了", next: "stab" },
      { text: "放下刀，认命", next: "drink_end" }
    ]
  },

  // ===== 坏结局们 =====
  stab: {
    shake: true,
    sfx: "scare",
    text: "你闭着眼，挥刀。\n\n刀锋刺进她的胸口——\n\n不。\n\n刀从她身上穿过去了。\n\n像刺进一团雾。\n\n她低头看了看自己，又看了看你。\n\n你低头看自己的手。\n\n你的手，也是半透明的。\n\n刀掉在地上，没有声音。）",
    image: "img/pot.png",
    choices: []
  },
  dark_end: {
    text: "黑暗中，一只手搭上你的肩膀。很凉。\n\n声音贴着你的耳朵，又干又哑：\n\n「别怕。跟奶奶走。」\n\n你想回头，身体却动不了。\n\n你被她牵着，一步一步，走出楼道。\n\n你回头，想再看一眼——\n\n你家那扇窗里，妈妈站在灶台前，还在炖汤。\n\n她不知道你走了。\n\n她还在等。",
    image: "img/dark.png",
    choices: []
  },
  porridge_end: {
    text: "粥很香。\n\n你喝了一口。又一口。\n\n张奶奶看着你喝完，点头：\n\n「好孩子。跟奶奶走吧。」\n\n你迷迷糊糊跟着她走。\n\n走过小卖部门口，你回头看了一眼——\n\n卷帘门上贴着一张纸，被夜风吹得哗哗响。\n\n是《寻人启事》。\n\n照片里，一个穿校服的男孩，笑得很开心。\n\n那个男孩，长得跟你一模一样。\n\n下面一行小字，被风吹得卷了边：\n\n「儿子，妈等你回家喝汤。」\n\n落款：你妈妈。\n\n日期：三年前。\n\n贴了三年了。",
    image: "img/table.png",
    choices: []
  },
  closet: {
    text: "你躲进衣柜，抱着膝盖，不敢出声。\n\n脚步声停在衣柜前。\n\n柜门拉开一条缝——外面没人。\n\n很久后，厨房传来锅碗声，然后安静了。\n\n你在衣柜里睡着了。\n\n醒来，天亮。\n\n妈妈在做早饭，回头看你：\n\n「醒了？怎么在衣柜里睡着了？」\n\n她端上桌。你端起碗。\n\n碗里不是粥。是汤。\n\n汤面映出你的脸。\n\n你的脸，是模糊的。\n\n像隔着一层水。\n\n你抬头，妈妈在笑。\n\n你低头，汤面里，只有妈妈一个人的倒影。\n\n没有你。",
    image: "img/bedroom.png",
    choices: []
  },
  drink_end: {
    text: "汤很鲜。你一口气喝完。\n\n困意铺天盖地。你撑着眼皮，最后的画面：妈妈站在床边，笑着看你。\n\n你睡了。\n\n第二天，妈妈端着汤走进你房间。\n\n「儿子，起来喝汤了。」\n\n床上，空荡荡的。\n\n被子叠得整整齐齐，三年来，从没动过。\n\n妈妈在床边坐下，端着那碗汤，慢慢说：\n\n「今天的排骨，买得很新鲜。」\n\n「你最喜欢的。」\n\n「喝吧。」\n\n她对着空荡荡的房间，笑了。\n\n碗里的汤，冒着热气。\n\n（她每天都这样。她不知道，你三年前就喝过那碗汤了。）",
    image: "img/table.png",
    choices: []
  },

  // ===== 支线：厨房对峙 =====
  knife_1: {
    sfx: "heartbeat",
    text: "你踮脚溜进厨房。妈妈背对着你。\n\n你摸到案板上的水果刀，攥紧。\n\n她没回头，开口了：\n\n「儿子，你在拿刀吗？」\n\n你僵住。\n\n「拿刀……是想给妈妈削个苹果？」\n\n你没说话。你盯着案板。\n\n案板上有一块肉，刚剁开的，还带着血。\n\n骨头很大。\n\n排骨……没这么大的骨头。\n\n你问：「妈，这是什么肉？」\n\n她没回头：「排骨。你爱吃的。」",
    image: "img/kitchen.png",
    choices: [
      { text: "「是、是，想削苹果。」", next: "apple" },
      { text: "握着刀，退到门口", next: "escape_door" },
      { text: "冲她后背刺过去", next: "stab" }
    ]
  },
  apple: {
    text: "她转身，手里端着一碗汤，脸上是妈妈的笑：\n\n「先喝汤。喝完再削。」\n\n她眼神很亮，亮得不正常。\n\n你低头看案板。\n\n那块肉，已经被她收走了。案板上干干净净。\n\n垃圾桶里，堆满了骨头。\n\n你数不过来。\n\n一顿排骨汤，用不了这么多骨头。\n\n你妈，到底炖了多少年的汤？",
    image: "img/kitchen.png",
    choices: [
      { text: "接过汤", next: "drink_end" },
      { text: "打翻汤碗，举刀", next: "standoff" }
    ]
  },
  standoff: {
    shake: true,
    sfx: "scare",
    text: "汤碗摔在地上。热汤溅到你脚上，你没躲。\n\n你举着刀，声音发抖：\n\n「你别过来！我妈不会做饭！你到底是谁！」\n\n她没生气。表情第一次变了——像难过？\n\n「儿子，妈妈是学了三年，才学会的。」\n\n「你出事那天，妈妈连汤都不会热。」\n\n你脑子轰的一声：\n\n「出事？我出什么事了？」\n\n她没回答。她往前一步。你退一步。\n\n你退到墙边，没路了。\n\n她伸手，轻轻摸了摸你的脸——\n\n手指，从你脸上穿了过去。\n\n你僵住了。\n\n她看着你，眼泪掉下来：\n\n「儿子，三年了。妈妈想你想得，都快疯了。」",
    image: "img/kitchen.png",
    choices: [
      { text: "转身冲出家门", next: "escape_door" },
      { text: "刀架自己脖子：「再过来我就——」", next: "self_threat" },
      { text: "闭上眼，站在原地", next: "dark_end" }
    ]
  },
  self_threat: {
    text: "她停住了。\n\n沉默。三秒，像三个小时。\n\n她轻轻笑了：\n\n「你赢了。」\n\n她转身关了灶火。「噗」，汤不响了。\n\n她站在窗边，看着窗外：\n\n「汤，倒了吧。」\n\n你举着刀，不知道该怎么办。\n\n她背对着你，声音很轻：\n\n「儿子，你要是真的想走……妈妈不拦你。」\n\n「可你记得，妈一直在这儿。汤一直热着。」\n\n你手里的刀，在发抖。",
    image: "img/kitchen.png",
    choices: [
      { text: "退到门口，开门逃走", next: "escape_door" },
      { text: "放下刀：「妈……我是不是……死了？」", next: "who_is_she" }
    ]
  },

  // ===== 支线：房间里的手机 =====
  hide: {
    sfx: "heartbeat",
    text: "你锁上门，心脏狂跳。\n\n手机！给爸爸打电话——\n\n屏幕亮了。\n\n壁纸，是你和妈妈的合照。\n\n你盯着照片。\n\n照片里的你，穿着那件校服。\n\n三年前的校服。\n\n你早就该换新校服了。\n\n可你翻遍相册，最近的每一张照片，你都穿着这件校服。\n\n像你的时间，停在了三年前。",
    image: "img/bedroom.png",
    choices: [
      { text: "拨打爸爸的号码", next: "call_dad" },
      { text: "放下手机，听门外动静", next: "listen" },
      { text: "手机突然响了——「妈妈」来电", next: "phone_ring" }
    ]
  },
  call_dad: {
    text: "电话通了。那边很吵，像有风。\n\n「喂？谁啊？」一个陌生男人的声音。\n\n「爸！我妈她——」\n\n「你打错了。」\n\n「嘟——」挂了。\n\n你再打。\n\n「对不起，您拨打的号码是空号。」\n\n你愣住了。\n\n你翻通讯录。\n\n通讯录里，只有一个号码。\n\n备注：妈。\n\n三年来，你从没打过别的电话。",
    image: "img/bedroom.png",
    choices: [
      { text: "冲出家门", next: "escape_door" },
      { text: "反锁门，钻进衣柜", next: "closet" }
    ]
  },
  phone_ring: {
    text: "手机响了。来电显示「妈妈」。\n\n你接通。妈妈的声音很温柔：\n\n「儿子，汤要凉了，快出来喝。」\n\n「妈，我就在厨房门口。」\n\n「嗯。」她说，「妈知道。」\n\n「快进来吧。汤要凉了。」\n\n你回头。\n\n厨房门口，没有人。\n\n可你听见，厨房里传来汤的咕嘟声。\n\n像等了你很久。",
    image: "img/bedroom.png",
    choices: [
      { text: "挂断，冲出门", next: "escape_door" },
      { text: "开门，走向厨房", next: "kitchen2" }
    ]
  },
  listen: {
    sfx: "heartbeat",
    text: "你贴着门，屏住呼吸。\n\n门外没动静。安静得吓人。\n\n厨房传来「咯吱——」一声，像什么东西被撕开。\n\n然后是咀嚼声。\n\n停了。妈妈的声音传来，含含糊糊的，像嘴里含着东西：\n\n「儿子……出来……喝汤……」\n\n你握紧门把手。\n\n（你妈，从来不这样说话。\n\n可她，已经在厨房里，这样等了三年。）",
    image: "img/bedroom.png",
    choices: [
      { text: "夺门而出", next: "escape_door" },
      { text: "拿起台灯，开门", next: "fight_light" }
    ]
  },
  fight_light: {
    text: "你举起台灯，拉开门——\n\n门外没有人。\n\n走廊空荡荡的。声控灯一闪一闪。\n\n你冲出去。\n\n身后，传来妈妈的声音，很轻：\n\n「儿子，别跑了。」\n\n「你已经到家了。」",
    image: "img/corridor.png",
    choices: [
      { text: "继续跑", next: "escape_door" }
    ]
  }
};
