'use strict';
// Translate UI text only. Source model names, units, places and dates remain unchanged.
(() => {
  const dictionary = {
    '俄军技术装备损失可视化':['Russian Military Equipment Losses','Візуалізація втрат військової техніки РФ'],
    '重置':['Reset','Скинути'], '时间范围':['Date range','Період'],
    '开始日期':['Start date','Початкова дата'], '结束日期':['End date','Кінцева дата'],
    '开始日期不能晚于结束日期。':['The start date must not be after the end date.','Початкова дата не може бути пізнішою за кінцеву.'],
    '装备类别':['Equipment category','Категорія техніки'], '全部装备':['All equipment','Уся техніка'],
    '搜索装备类别':['Search equipment categories','Пошук категорій техніки'],
    '所属部队':['Unit','Підрозділ'], '全部部队':['All units','Усі підрозділи'],
    '搜索部队原文名称':['Search original unit names','Пошук за оригінальною назвою підрозділу'],
    '搜索部队':['Search units','Пошук підрозділів'], '损失状态':['Loss status','Стан втрати'],
    '全部状态':['All statuses','Усі стани'], '全选':['Select all','Вибрати все'],
    '匹配记录':['Matching records','Знайдені записи'], '匹配损失记录':['Matching losses','Знайдені втрати'],
    '可定位记录':['Geolocated records','Геолоковані записи'], '可确认部队':['Identified units','Визначені підрозділи'],
    '正在读取数据快照…':['Loading data…','Завантаження даних…'],
    '上一页':['Previous page','Попередня сторінка'], '下一页':['Next page','Наступна сторінка'],
    '离线地图':['Offline map','Офлайн-мапа'], '准备地图…':['Preparing map…','Підготовка мапи…'],
    '正在检查离线地图。':['Checking the offline map.','Перевірка офлайн-мапи.'],
    '数据口径与来源':['Data scope and sources','Охоплення та джерела даних'],
    '来源：':['Source: ','Джерело: '], '正在加载数据':['Loading data','Завантаження даних'],
    '最新在线数据':['Latest online data','Останні онлайн-дані'],
    '上次保存的数据':['Previously saved data','Раніше збережені дані'],
    '内置数据快照':['Bundled data snapshot','Вбудований знімок даних'],
    '，共':['; total: ','; усього: '], '。':['. ','. '],
    '条记录，日期保留官方原值。仅表示该站记录的装备损失，不代表全部实际损失。':['records. Dates are retained as published. This covers losses documented by the source, not all actual losses.','записів. Дати збережено як у джерелі. Наведено лише втрати, задокументовані джерелом, а не всі фактичні втрати.'],
    '抓取工具参考：':['Scraper reference: ','Приклад інструмента збору даних: '],
    '。数据每天自动检查更新；抓取失败时保留上一份完整数据。':['. Data is checked daily; a failed update preserves the previous complete snapshot.','. Дані перевіряються щодня; якщо оновлення не вдається, зберігається попередній повний знімок.'],
    '无坐标的记录仅参与统计和列表。所属部队保留来源名称，不推测、补齐或合并。地图为当前底图，不代表事件发生时的道路、建筑或部署。':['Records without coordinates appear only in statistics and the list. Unit names are retained from the source without inference or merging. The basemap shows current geography, not roads, buildings or deployments at the time of an event.','Записи без координат відображаються лише у статистиці та списку. Назви підрозділів збережено з джерела без припущень чи об’єднання. Базова мапа показує сучасну географію, а не дороги, будівлі чи розташування сил на час події.'],
    '点位是历史损失记录，不表示部队现驻位置。内置底图包含乌克兰全境的主要道路、城市与地名，保存后可断网使用；更细街巷与建筑联网加载。地物覆盖以 OpenStreetMap 为准。':['Markers show historical losses, not current unit positions. The bundled map covers major roads, cities and place names across Ukraine and can be saved for offline use. Finer streets and buildings load online. Coverage follows OpenStreetMap.','Позначки показують історичні втрати, а не поточні позиції підрозділів. Вбудована мапа охоплює основні дороги, міста й назви місць по всій Україні та може бути збережена для роботи офлайн. Детальніші вулиці й будівлі завантажуються онлайн. Охоплення залежить від OpenStreetMap.'],
    '装备损失地图':['Equipment loss map','Мапа втрат техніки'],
    '地图全屏':['Fullscreen map','Мапа на весь екран'], '退出全屏':['Exit fullscreen','Вийти з повноекранного режиму'],
    '回到全景':['Reset map view','Показати всю мапу'], '图例显示方式':['Legend mode','Режим легенди'],
    '按装备':['By equipment','За типом техніки'], '按所属部队':['By unit','За підрозділом'], '按损失状态':['By loss status','За станом втрати'],
    '向下收起图例':['Collapse legend','Згорнути легенду'], '收起图例':['Collapse legend','Згорнути легенду'], '展开图例':['Expand legend','Розгорнути легенду'],
    '向下收起统计与月度分布':['Collapse statistics and monthly chart','Згорнути статистику та помісячний графік'],
    '展开统计与月度分布':['Expand statistics and monthly chart','Розгорнути статистику та помісячний графік'],
    '收起统计':['Collapse statistics','Згорнути статистику'], '展开统计':['Expand statistics','Розгорнути статистику'],
    '月度分布':['Monthly distribution','Розподіл за місяцями'],
    '按月记录数量，点击月份筛选':['Monthly record counts; select a month to filter','Кількість записів за місяцями; виберіть місяць для фільтрації'],
    '点击柱形查看该月 · 高度表示记录数':['Select a bar to filter by month · Height represents record count','Виберіть стовпчик для фільтрації за місяцем · Висота показує кількість записів'],
    '坦克':['Tanks','Танки'], '步兵战车':['Infantry fighting vehicles','Бойові машини піхоти'],
    '运输车辆':['Transport vehicles','Транспортні засоби'], '自行火炮':['Self-propelled artillery','Самохідна артилерія'],
    '无人机':['Drones','Безпілотники'], '工程装备':['Engineering equipment','Інженерна техніка'],
    '火箭炮与导弹炮兵':['Rocket and missile artillery','Реактивна та ракетна артилерія'],
    '步兵机动车辆':['Infantry mobility vehicles','Транспорт піхоти'], '防空系统':['Air defense systems','Системи ППО'],
    '牵引火炮':['Towed artillery','Буксирована артилерія'], '指挥与通信':['Command and communications','Управління та зв’язок'],
    '雷达与干扰设备':['Radars and jammers','Радари та засоби РЕБ'], '其他':['Other','Інше'],
    '直升机':['Helicopters','Гелікоптери'], '固定翼飞机':['Fixed-wing aircraft','Літаки'],
    '救护与医疗车辆':['Ambulances and medical vehicles','Санітарні та медичні машини'],
    '反坦克系统':['Anti-tank systems','Протитанкові системи'], '舰艇':['Vessels','Судна'],
    '摧毁':['Destroyed','Знищено'], '缴获':['Captured','Захоплено'], '遗弃':['Abandoned','Покинуто'], '受损':['Damaged','Пошкоджено'],
    '未知':['Unknown','Невідомо'], '其他部队':['Other units','Інші підрозділи'],
    '日期':['Date','Дата'], '状态':['Status','Стан'], '地点':['Location','Місце'], '部队':['Unit','Підрозділ'],
    '坐标':['Coordinates','Координати'], '标签':['Tags','Позначки'], '未注明':['Not specified','Не вказано'],
    '缺少坐标':['Coordinates unavailable','Координати відсутні'], '无坐标':['No coordinates','Без координат'],
    '地点未注明':['Location not specified','Місце не вказано'], '关闭':['Close','Закрити'],
    '查看 WarSpotting 原始记录 ↗':['View original WarSpotting record ↗','Переглянути оригінальний запис WarSpotting ↗'],
    '此记录没有坐标，未在地图上标注。':['This record has no coordinates and is not shown on the map.','Цей запис не має координат і не позначений на мапі.'],
    '没有匹配记录。请调整时间范围、装备类别或部队名称。':['No matching records. Adjust the dates, equipment categories or units.','Записів не знайдено. Змініть період, категорії техніки або підрозділи.'],
    '没有匹配选项':['No matching options','Варіантів не знайдено'],
    '匹配记录均无坐标；请在列表查看详情。':['Matching records have no coordinates; see the list for details.','Знайдені записи не мають координат; перегляньте подробиці у списку.'],
    '当前筛选没有匹配记录。':['No records match the current filters.','Жоден запис не відповідає поточним фільтрам.'],
    '数据或地图组件加载失败，请刷新重试。':['Data or map components failed to load. Refresh to retry.','Не вдалося завантажити дані або компоненти мапи. Оновіть сторінку.'],
    '未能加载数据，请检查网络或重新打开网站。':['Could not load data. Check your connection or reopen the website.','Не вдалося завантажити дані. Перевірте з’єднання або знову відкрийте сайт.'],
    '覆盖乌克兰全境主要道路、城市与地名；保存后可断网使用。更细街巷与建筑需联网。':['Covers major roads, cities and place names across Ukraine. Save for offline use; finer streets and buildings require a connection.','Охоплює основні дороги, міста й назви місць по всій Україні. Збережіть для роботи офлайн; детальніші вулиці й будівлі потребують з’єднання.'],
    '离线地图已保存':['Offline map saved','Офлайн-мапу збережено'],
    '可断网重新打开网站。更细街巷与建筑需联网；清除浏览器数据后需重新保存。':['You can reopen the website offline. Finer streets and buildings require a connection. Save again after clearing browser data.','Сайт можна знову відкрити офлайн. Детальніші вулиці й будівлі потребують з’єднання. Після очищення даних браузера збережіть мапу знову.'],
    '已完整保存道路与城市底图。断网可重新打开；更细街巷与建筑需联网。':['The full road and city map is saved. Reopen offline; finer streets and buildings require a connection.','Повну мапу доріг і міст збережено. Її можна відкрити офлайн; детальніші вулиці й будівлі потребують з’єднання.'],
    '继续保存离线地图':['Resume offline map download','Продовжити завантаження офлайн-мапи'],
    '当前浏览器尚未启用离线缓存，请刷新后重试。':['Offline caching is not ready in this browser. Refresh and retry.','Офлайн-кеш у цьому браузері ще не готовий. Оновіть сторінку та спробуйте знову.'],
    '浏览器可用空间不足，请释放空间后重试。':['Not enough browser storage. Free some space and retry.','Недостатньо місця у сховищі браузера. Звільніть місце та спробуйте знову.'],
    '浏览器未能完整保存地图，请重试。':['The browser could not save the complete map. Please retry.','Браузер не зміг повністю зберегти мапу. Спробуйте знову.'],
    '已保存部分可复用。':['Previously saved parts can be reused.','Раніше збережені частини можна використати повторно.'],
    '离线地图数据读取失败':['Could not read offline map data','Не вдалося прочитати дані офлайн-мапи'],
    '地图数据不完整，请重试':['Map data is incomplete; please retry','Дані мапи неповні; спробуйте знову'],
    '地图校验失败，请重试':['Map validation failed; please retry','Перевірка мапи не вдалася; спробуйте знову'],
    '地图清单加载失败':['Could not load the map manifest','Не вдалося завантажити перелік файлів мапи'],
    'Zoom in':['Zoom in','Збільшити'], 'Zoom out':['Zoom out','Зменшити'],
    'Close popup':['Close popup','Закрити вікно'], 'Map':['Map','Мапа'],
  };
  let language='zh';
  try { const saved=localStorage.getItem('atlas-language'); if(['zh','en','uk'].includes(saved))language=saved; } catch {}
  function t(value) {
    const text=String(value),key=text.trim();
    if(language==='zh')return text;
    const index=language==='en'?0:1;
    let translated=dictionary[key]?.[index];
    if(translated===undefined){
      const rules=[
        [/^已选 (\d+) 项$/,n=>[`${n} selected`,`Вибрано: ${n}`]],
        [/^(\d+) \/ ([\d\s,.  ]+) 页$/,(a,b)=>[`Page ${a} / ${b}`,`Сторінка ${a} / ${b}`]],
        [/^对应 (.+) 条记录$/,n=>[`${n} records`,`${n} записів`]],
        [/^(\d{4}-\d{2})：(.+) 条$/,(month,n)=>[`${month}: ${n} records`,`${month}: ${n} записів`]],
        [/^记录 #(\d+) · (.+)$/,(id,category)=>[`Record #${id} · ${t(category)}`,`Запис №${id} · ${t(category)}`]],
        [/^保存离线地图（(.+) MB）$/,n=>[`Save offline map (${n} MB)`,`Зберегти офлайн-мапу (${n} МБ)`]],
        [/^正在保存 (\d+)%$/,n=>[`Saving ${n}%`,`Збереження: ${n}%`]],
        [/^已保存 (\d+) \/ (\d+)，请保持页面打开。$/,(a,b)=>[`Saved ${a} / ${b}. Keep this page open.`,`Збережено ${a} / ${b}. Не закривайте сторінку.`]],
      ];
      for(const [pattern,format]of rules){const match=key.match(pattern);if(match){translated=format(...match.slice(1))[index];break;}}
      if(translated===undefined&&key.endsWith(' 已保存部分可复用。'))translated=t(key.slice(0,-' 已保存部分可复用。'.length))+' '+t('已保存部分可复用。');
    }
    return translated===undefined?text:text.replace(key,()=>translated);
  }
  const originals=new WeakMap(),attributes=new WeakMap();
  const observer=new MutationObserver(()=>schedule());
  let queued=false;
  function translate(){
    queued=false;observer.disconnect();
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    for(let node;node=walker.nextNode();){
      if(node.parentElement?.closest('script,style,select#language-select,[data-no-translate]'))continue;
      let entry=originals.get(node);
      if(!entry||node.nodeValue!==entry.last)entry={source:node.nodeValue};
      entry.last=t(entry.source);if(node.nodeValue!==entry.last)node.nodeValue=entry.last;originals.set(node,entry);
    }
    for(const element of document.querySelectorAll('[placeholder],[aria-label],[title]')){
      let entries=attributes.get(element)||{};
      for(const attr of ['placeholder','aria-label','title']){
        const value=element.getAttribute(attr);if(value===null)continue;
        let entry=entries[attr];if(!entry||value!==entry.last)entry={source:value};
        entry.last=t(entry.source);if(value!==entry.last)element.setAttribute(attr,entry.last);entries[attr]=entry;
      }
      attributes.set(element,entries);
    }
    document.documentElement.lang={zh:'zh-CN',en:'en',uk:'uk'}[language];
    document.title=t('俄军技术装备损失可视化');
    const selector=document.getElementById('language-select');selector.value=language;
    selector.setAttribute('aria-label',{zh:'界面语言',en:'Interface language',uk:'Мова інтерфейсу'}[language]);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(translate);}}
  window.atlasI18n={t,searchText:value=>[value,...(dictionary[String(value).trim()]||[])].join(" "),get language(){return language},get locale(){return {zh:'zh-CN',en:'en-US',uk:'uk-UA'}[language]},refresh:schedule};
  document.getElementById('language-select').addEventListener('change',event=>{
    if(!['zh','en','uk'].includes(event.target.value))return;
    language=event.target.value;try{localStorage.setItem('atlas-language',language)}catch{}
    translate();window.dispatchEvent(new CustomEvent('atlaslanguagechange',{detail:{language}}));
  });
  translate();
})();
