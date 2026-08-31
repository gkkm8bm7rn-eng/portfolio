(() => {
  if (!document.body.classList.contains('home-page')) return;
  const maps = {
    en: {
      'цифровые продукты для бизнеса.': 'digital products for business.',
      'Дизайн, e-commerce и AI — от визуализации продукта до работающих веб-инструментов.': 'Design, e-commerce and AI — from product visualization to working web tools.',
      'Визуальная система для мебельного бренда: визуализация продукта, коммерческие материалы, 3D и GPT-инструмент для расчётов.': 'A visual system for a furniture brand: product visualization, commercial materials, 3D and a GPT tool for calculations.',
      'Структура, тексты и лёгкая веб-реализация профессиональных портфолио.': 'Structure, copy and lightweight web implementation for professional portfolios.'
    },
    de: {
      'цифровые продукты для бизнеса.': 'digitale Produkte für Unternehmen.',
      'Дизайн, e-commerce и AI — от визуализации продукта до работающих веб-инструментов.': 'Design, E-Commerce und KI — von Produktvisualisierung bis zu funktionierenden Web-Tools.',
      'Визуальная система для мебельного бренда: визуализация продукта, коммерческие материалы, 3D и GPT-инструмент для расчётов.': 'Ein visuelles System für eine Möbelmarke: Produktvisualisierung, Verkaufsunterlagen, 3D und ein GPT-Tool für Kalkulationen.',
      'Структура, тексты и лёгкая веб-реализация профессиональных портфолио.': 'Struktur, Texte und schlanke Web-Umsetzung professioneller Portfolios.'
    },
    it: {
      'цифровые продукты для бизнеса.': 'prodotti digitali per il business.',
      'Дизайн, e-commerce и AI — от визуализации продукта до работающих веб-инструментов.': 'Design, e-commerce e AI — dalla visualizzazione del prodotto a strumenti web funzionanti.',
      'Визуальная система для мебельного бренда: визуализация продукта, коммерческие материалы, 3D и GPT-инструмент для расчётов.': 'Un sistema visivo per un brand di arredamento: visualizzazione prodotto, materiali commerciali, 3D e uno strumento GPT per i calcoli.',
      'Структура, тексты и лёгкая веб-реализация профессиональных портфолио.': 'Struttura, testi e realizzazione web leggera di portfolio professionali.'
    },
    fr: {
      'цифровые продукты для бизнеса.': 'produits numériques pour les entreprises.',
      'Дизайн, e-commerce и AI — от визуализации продукта до работающих веб-инструментов.': 'Design, e-commerce et IA — de la visualisation produit aux outils web fonctionnels.',
      'Визуальная система для мебельного бренда: визуализация продукта, коммерческие материалы, 3D и GPT-инструмент для расчётов.': 'Un système visuel pour une marque de mobilier : visualisation produit, supports commerciaux, 3D et outil GPT de calcul.',
      'Структура, тексты и лёгкая веб-реализация профессиональных портфолио.': 'Structure, textes et réalisation web légère de portfolios professionnels.'
    },
    zh: {
      'цифровые продукты для бизнеса.': '面向商业的数字产品。',
      'Дизайн, e-commerce и AI — от визуализации продукта до работающих веб-инструментов.': '设计、电商与 AI——从产品可视化到真正可用的 Web 工具。',
      'Визуальная система для мебельного бренда: визуализация продукта, коммерческие материалы, 3D и GPT-инструмент для расчётов.': '为家具品牌建立的视觉系统：产品可视化、商业材料、3D，以及用于计算的 GPT 工具。',
      'Структура, тексты и лёгкая веб-реализация профессиональных портфолио.': '专业作品集的网站结构、文案与轻量化实现。'
    }
  };

  const entries = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p || ['SCRIPT','STYLE','NOSCRIPT','CODE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    const m = node.nodeValue.match(/^(\s*)(.*?)(\s*)$/s);
    if (m && m[2]) entries.push({ node, prefix:m[1], source:m[2], suffix:m[3] });
  }

  const apply = () => {
    const lang = document.documentElement.lang.toLowerCase().split('-')[0];
    const map = maps[lang];
    entries.forEach(({node,prefix,source,suffix}) => {
      if (lang === 'ru') node.nodeValue = prefix + source + suffix;
      else if (map && map[source]) node.nodeValue = prefix + map[source] + suffix;
    });
  };
  new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  queueMicrotask(apply);
})();