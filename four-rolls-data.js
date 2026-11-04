/* Four rolls, one us — content mapping. */
(() => {
  const D = window.FILM_DATA;
  if (!D) return;
  const [sy, sm, sd] = D.startDate.split('-');
  const startDate = `${sy}.${sm}.${sd}`;
  const contact = id => D.contact.find(item => item.id === id);

  const firstFrames = [
    {
      kind: 'photo',
      frame: '001',
      src: D.hero.src,
      alt: D.hero.alt,
      caption: '那天之前，日子只是日历上的一格一格。'
    },
    {
      kind: 'photo',
      frame: '002',
      src: D.origin.src,
      alt: D.origin.alt,
      caption: '第一格，留给开始。'
    },
    {
      kind: 'text',
      frame: '003',
      kicker: startDate,
      title: '故事从这天开始',
      body: '在那以后，我开始留意天气、光、路边的小事，和每一个你出现的普通瞬间。'
    }
  ];

  const slowFrames = D.contact.map((item, index) => ({
    kind: 'photo',
    frame: item.frame,
    src: item.src,
    alt: item.alt,
    caption: item.caption,
    photoId: item.photoId,
    rollIndex: index
  }));

  const stillFrames = [
    {
      kind: 'letter',
      frame: '001',
      title: '一封信，给婷婷',
      caption: '点开，慢慢读。'
    },
    {
      kind: 'photo',
      frame: '002',
      src: (contact('autumn') || {}).src || 'assets/images/daily-autumn.webp',
      alt: (contact('autumn') || {}).alt || '',
      caption: '秋天，和想写给你的话。'
    },
    {
      kind: 'photo',
      frame: '003',
      src: (contact('bokeh') || {}).src || 'assets/images/daily-bokeh.webp',
      alt: (contact('bokeh') || {}).alt || '',
      caption: '夜里回家的路，灯都变成了光斑。'
    },
    {
      kind: 'text',
      frame: '004',
      kicker: 'P.S.',
      title: '下一格，想拍你笑的样子。',
      body: ''
    }
  ];

  const tomorrowFrames = D.future.plans.map((plan, index) => ({
    kind: 'future',
    frame: String(index + 1).padStart(3, '0'),
    plan,
    index
  }));

  window.FOUR_ROLLS = [
    {
      id: 'first',
      no: '01',
      label: 'first day',
      zh: '初见',
      line: 'where it started',
      color: 'cream',
      meta: startDate,
      frames: firstFrames
    },
    {
      id: 'slow',
      no: '02',
      label: 'slow days',
      zh: '日常',
      line: 'coffee, rain, and nothing to do',
      color: 'orange',
      meta: 'KODAK 400',
      frames: slowFrames
    },
    {
      id: 'still',
      no: '03',
      label: 'still us',
      zh: '一封信',
      line: 'things I haven’t said',
      color: 'olive',
      meta: 'ROLL 03',
      frames: stillFrames
    },
    {
      id: 'tomorrow',
      no: '04',
      label: 'tomorrow',
      zh: '未曝光',
      line: 'not yet, but soon',
      color: 'black',
      meta: 'UNEXPOSED',
      frames: tomorrowFrames
    }
  ];
})();
