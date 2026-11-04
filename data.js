/* 这卷胶片的内容都在这里。想换字，改这里最稳。 */
window.FILM_DATA = {
  name: "婷婷",
  roman: "TINGTING",
  startDate: "2026-09-26",

  hero: {
    photoId: "hero",
    src: "assets/images/hero.webp",
    alt: "黄昏的海边，两个人并肩坐在长椅上，面前是安静的海。",
    line: "关于你的每一帧，\n我都想留下来。",
    subline: "从这一天开始，学着把普通的日子拍成电影。",
    stamp: "ROLL 001"
  },

  origin: {
    photoId: "origin",
    src: "assets/images/origin.webp",
    alt: "木屋里，午后的光从窗边斜斜落下。",
    frame: "002",
    title: "故事从这天开始",
    paragraphs: [
      "在那以前，日子只是日历上的一格一格。",
      "在那以后，我开始留意天气、光、路边的小事，和每一个你出现的普通瞬间。"
    ],
    quote: "这一卷，不打算忘记。",
    caption: "第一格，留给开始。"
  },

  contact: [
    {
      id: "coffee",
      photoId: "contact-coffee",
      src: "assets/images/daily-coffee.webp",
      alt: "红色桌面上的一杯热咖啡。",
      frame: "003A",
      caption: "一杯热咖啡，和一个慢下来的早上。"
    },
    {
      id: "vinyl",
      photoId: "contact-vinyl",
      src: "assets/images/daily-vinyl.webp",
      alt: "唱针落在黑胶唱片上。",
      frame: "004A",
      caption: "唱针落下，房间就有了旧时光的声音。"
    },
    {
      id: "autumn",
      photoId: "contact-autumn",
      src: "assets/images/daily-autumn.webp",
      alt: "散落在桌面上的秋天落叶。",
      frame: "005",
      caption: "路边捡到的秋天。"
    },
    {
      id: "sea",
      photoId: "contact-sea",
      src: "assets/images/daily-sea.webp",
      alt: "悬崖之间的一片安静海面。",
      frame: "006",
      caption: "想和你去看很多次海。"
    },
    {
      id: "bokeh",
      photoId: "contact-bokeh",
      src: "assets/images/daily-bokeh.webp",
      alt: "夜晚街道上失焦的灯光。",
      frame: "007A",
      caption: "夜里回家的路，灯都变成了光斑。",
      marked: true
    },
    {
      id: "cafe",
      photoId: "contact-cafe",
      src: "assets/images/daily-cafe.webp",
      alt: "午后咖啡馆里空着的木桌。",
      frame: "008",
      caption: "什么都没做的一个下午。"
    }
  ],

  interlude: {
    photoId: "interlude",
    src: "assets/images/interlude.webp",
    alt: "黄昏的海边，一个人推着单车停在远处。",
    frame: "009",
    quote: "喜欢你之后，\n普通的日子\n开始舍不得过完。",
    note: "写在第 <span data-days>38</span> 天"
  },

  letter: {
    to: "TO: 婷婷",
    from: "FROM: 我",
    roll: "ROLL 001",
    greeting: "婷婷：",
    paragraphs: [
      "以前我不太相信「记录」这件事。日子过得太快，照片又太安静，总觉得把什么都留下来，反而显得贪心。",
      "可是遇见你之后，我开始想把它们都存起来。你说话时停顿的那一下，傍晚从窗边退走的光，我们并排走路时鞋底踩过落叶的声音。",
      "这些都不算什么大事。可它们加起来，好像就是我现在的生活。",
      "这一卷才刚开始。后面的空白，我想和你一起拍完。"
    ],
    ps: "下一格，想拍你笑的样子。",
    signature: "—— 我"
  },

  future: {
    title: "未曝光",
    intro: "这一卷还没拍完。\n有些画面，等我们一起曝光。",
    hint: "点一下，就算约好了。",
    plans: [
      "一起看一次海",
      "在冬天分一杯热可可",
      "拍一张放在钱包里的拍立得",
      "看一场深夜电影",
      "一起做一顿饭，难吃也算",
      "去一个没去过的地方",
      "把普通的一天过成纪念日",
      "一直拍下去"
    ]
  },

  closing: {
    title: "未完待续",
    endLabel: "END OF REEL 001",
    line: "第 <span data-days>38</span> 天，故事还很长。",
    note: "本片由真实日子改编，仍在拍摄中。",
    credits: [
      ["导演", "时间"],
      ["主演", "婷婷 & 我"],
      ["摄影", "每一个普通的日子"],
      ["冲洗", "耐心"],
      ["特别鸣谢", "那天的光"]
    ],
    back: "回到片头",
    privacy: "照片与文字只保存在这台设备里。",
    roll: "ROLL 001 / 2026—∞"
  }
};
