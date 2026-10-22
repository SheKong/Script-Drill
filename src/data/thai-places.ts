import type { Course, Knowledge, Unit } from '../types';
import geometry from './thai-map.json' with { type: 'json' };

// Explicit whole-word readings. Do not infer these from individual Thai characters.
type Province = [string, string, string, string, string, string?];
const provinces: Province[] = [
  ['amnatcharoen', 'อำนาจเจริญ', 'Amnat Charoen', 'ʔam.naːt.tɕa.rɤːn', '安纳乍伦'],
  ['angthong', 'อ่างทอง', 'Ang Thong', 'ʔaːŋ tʰɔːŋ', '红统'],
  ['buengkan', 'บึงกาฬ', 'Bueng Kan', 'bɯŋ kaːn', '汶干'],
  ['buriram', 'บุรีรัมย์', 'Buri Ram', 'bu.riː ram', '武里南'],
  ['chachoengsao', 'ฉะเชิงเทรา', 'Chachoengsao', 'tɕʰa.tɕʰɤːŋ.saw', '北柳'],
  ['chainat', 'ชัยนาท', 'Chai Nat', 'tɕʰaj naːt', '猜纳'],
  ['chaiyaphum', 'ชัยภูมิ', 'Chaiyaphum', 'tɕʰaj.ja.pʰuːm', '猜也奔'],
  ['chanthaburi', 'จันทบุรี', 'Chanthaburi', 'tɕan.tʰa.bu.riː', '尖竹汶'],
  ['chiangmai', 'เชียงใหม่', 'Chiang Mai', 'tɕʰiaŋ maj', '清迈'],
  ['chiangrai', 'เชียงราย', 'Chiang Rai', 'tɕʰiaŋ raːj', '清莱'],
  ['chonburi', 'ชลบุรี', 'Chon Buri', 'tɕʰon bu.riː', '春武里'],
  ['chumphon', 'ชุมพร', 'Chumphon', 'tɕʰum pʰɔːn', '春蓬'],
  ['kalasin', 'กาฬสินธุ์', 'Kalasin', 'kaː.la.sin', '加拉信', 'Kalasin'],
  ['kamphaengphet', 'กำแพงเพชร', 'Kamphaeng Phet', 'kam.pʰɛːŋ pʰet', '甘烹碧'],
  ['kanchanaburi', 'กาญจนบุรี', 'Kanchanaburi', 'kaːn.tɕa.na.bu.riː', '北碧'],
  ['khonkaen', 'ขอนแก่น', 'Khon Kaen', 'kʰɔːn kɛn', '孔敬'],
  ['krabi', 'กระบี่', 'Krabi', 'kra.biː', '甲米'],
  ['lampang', 'ลำปาง', 'Lampang', 'lam.paːŋ', '南邦'],
  ['lamphun', 'ลำพูน', 'Lamphun', 'lam.pʰuːn', '南奔'],
  ['loei', 'เลย', 'Loei', 'lɤːj', '黎'],
  ['lopburi', 'ลพบุรี', 'Lop Buri', 'lop bu.riː', '华富里', 'Lopburi Province'],
  ['maehongson', 'แม่ฮ่องสอน', 'Mae Hong Son', 'mɛː hɔŋ sɔːn', '夜丰颂'],
  ['mahasarakham', 'มหาสารคาม', 'Maha Sarakham', 'ma.haː saː.ra.kʰaːm', '玛哈沙拉堪'],
  ['mukdahan', 'มุกดาหาร', 'Mukdahan', 'muk.daː.haːn', '穆达汉'],
  ['nakhonnayok', 'นครนายก', 'Nakhon Nayok', 'na.kʰɔːn naː.jok', '那空那育'],
  ['nakhonpathom', 'นครปฐม', 'Nakhon Pathom', 'na.kʰɔːn pa.tʰom', '佛统'],
  ['nakhonphanom', 'นครพนม', 'Nakhon Phanom', 'na.kʰɔːn pʰa.nom', '那空拍侬'],
  ['nakhonratchasima', 'นครราชสีมา', 'Nakhon Ratchasima', 'na.kʰɔːn raːt.tɕʰa.siː.maː', '呵叻'],
  ['nakhonsawan', 'นครสวรรค์', 'Nakhon Sawan', 'na.kʰɔːn sa.wan', '北榄坡'],
  ['nakhonsithammarat', 'นครศรีธรรมราช', 'Nakhon Si Thammarat', 'na.kʰɔːn siː tʰam.ma.raːt', '洛坤'],
  ['nan', 'น่าน', 'Nan', 'naːn', '难'],
  ['narathiwat', 'นราธิวาส', 'Narathiwat', 'na.raː.tʰi.waːt', '陶公'],
  ['nongbualamphu', 'หนองบัวลำภู', 'Nong Bua Lam Phu', 'nɔːŋ bua lam pʰuː', '廊磨喃蒲'],
  ['nongkhai', 'หนองคาย', 'Nong Khai', 'nɔːŋ kʰaːj', '廊开'],
  ['nonthaburi', 'นนทบุรี', 'Nonthaburi', 'non.tʰa.bu.riː', '暖武里'],
  ['pathumthani', 'ปทุมธานี', 'Pathum Thani', 'pa.tʰum tʰaː.niː', '巴吞他尼'],
  ['pattani', 'ปัตตานี', 'Pattani', 'pat.taː.niː', '北大年'],
  ['phangnga', 'พังงา', 'Phangnga', 'pʰaŋ.ŋaː', '攀牙', 'Phangnga Province'],
  ['phatthalung', 'พัทลุง', 'Phatthalung', 'pʰat.tʰa.luŋ', '博他仑'],
  ['phayao', 'พะเยา', 'Phayao', 'pʰa.jaw', '帕尧'],
  ['phetchabun', 'เพชรบูรณ์', 'Phetchabun', 'pʰet.tɕʰa.buːn', '碧差汶'],
  ['phetchaburi', 'เพชรบุรี', 'Phetchaburi', 'pʰet.tɕʰa.bu.riː', '佛丕'],
  ['phichit', 'พิจิตร', 'Phichit', 'pʰi.tɕit', '披集'],
  ['phitsanulok', 'พิษณุโลก', 'Phitsanulok', 'pʰit.sa.nu.loːk', '彭世洛'],
  ['phranakhonsiayutthaya', 'พระนครศรีอยุธยา', 'Phra Nakhon Si Ayutthaya', 'pʰra.na.kʰɔːn siː ʔa.jut.tʰa.jaː', '大城'],
  ['phrae', 'แพร่', 'Phrae', 'pʰrɛː', '帕'],
  ['phuket', 'ภูเก็ต', 'Phuket', 'pʰuː.ket', '普吉'],
  ['prachinburi', 'ปราจีนบุรี', 'Prachin Buri', 'praː.tɕiːn bu.riː', '巴真'],
  ['prachuapkhirikhan', 'ประจวบคีรีขันธ์', 'Prachuap Khiri Khan', 'pra.tɕuap kʰiː.riː kʰan', '巴蜀'],
  ['ranong', 'ระนอง', 'Ranong', 'ra.nɔːŋ', '拉廊'],
  ['ratchaburi', 'ราชบุรี', 'Ratchaburi', 'raːt.tɕʰa.bu.riː', '叻丕'],
  ['rayong', 'ระยอง', 'Rayong', 'ra.jɔːŋ', '罗勇'],
  ['roiet', 'ร้อยเอ็ด', 'Roi Et', 'rɔːj ʔet', '黎逸'],
  ['sakaeo', 'สระแก้ว', 'Sa Kaeo', 'sa kɛːw', '沙缴'],
  ['sakonnakhon', 'สกลนคร', 'Sakon Nakhon', 'sa.kon na.kʰɔːn', '色军'],
  ['samutprakan', 'สมุทรปราการ', 'Samut Prakan', 'sa.mut praː.kaːn', '北榄'],
  ['samutsakhon', 'สมุทรสาคร', 'Samut Sakhon', 'sa.mut saː.kʰɔːn', '龙仔厝'],
  ['samutsongkhram', 'สมุทรสงคราม', 'Samut Songkhram', 'sa.mut soŋ.kʰraːm', '夜功'],
  ['saraburi', 'สระบุรี', 'Saraburi', 'sa.ra.bu.riː', '北标'],
  ['satun', 'สตูล', 'Satun', 'sa.tuːn', '沙敦'],
  ['singburi', 'สิงห์บุรี', 'Sing Buri', 'siŋ bu.riː', '信武里'],
  ['sisaket', 'ศรีสะเกษ', 'Si Sa Ket', 'siː sa.keːt', '四色菊'],
  ['songkhla', 'สงขลา', 'Songkhla', 'soŋ.kʰlaː', '宋卡'],
  ['sukhothai', 'สุโขทัย', 'Sukhothai', 'su.kʰoː.tʰaj', '素可泰'],
  ['suphanburi', 'สุพรรณบุรี', 'Suphan Buri', 'su.pʰan bu.riː', '素攀武里'],
  ['suratthani', 'สุราษฎร์ธานี', 'Surat Thani', 'su.raːt tʰaː.niː', '素叻他尼'],
  ['surin', 'สุรินทร์', 'Surin', 'su.rin', '素林'],
  ['tak', 'ตาก', 'Tak', 'taːk', '达'],
  ['trang', 'ตรัง', 'Trang', 'traŋ', '董里'],
  ['trat', 'ตราด', 'Trat', 'traːt', '达叻'],
  ['ubonratchathani', 'อุบลราชธานี', 'Ubon Ratchathani', 'ʔu.bon raːt.tɕʰa.tʰaː.niː', '乌汶'],
  ['udonthani', 'อุดรธานี', 'Udon Thani', 'ʔu.dɔːn tʰaː.niː', '乌隆他尼'],
  ['uthaithani', 'อุทัยธานี', 'Uthai Thani', 'ʔu.tʰaj tʰaː.niː', '乌泰他尼'],
  ['uttaradit', 'อุตรดิตถ์', 'Uttaradit', 'ʔut.ta.ra.dit', '程逸'],
  ['yala', 'ยะลา', 'Yala', 'ja.laː', '惹拉'],
  ['yasothon', 'ยโสธร', 'Yasothon', 'ja.soː.tʰɔːn', '益梭通'],
  ['bangkok-full', 'กรุงเทพมหานคร', 'Krung Thep Maha Nakhon', 'kruŋ tʰeːp ma.haː na.kʰɔːn', '曼谷特别行政区', 'Bangkok'],
];
type City = [string, string, string, string, string, number, number];
const cities: City[] = [
  ['pattaya', 'พัทยา', 'Phatthaya', 'pʰat.tʰa.jaː', '芭堤雅', 100.883, 12.935],
  ['hatyai', 'หาดใหญ่', 'Hat Yai', 'haːt jaj', '合艾', 100.468, 7.009],
  ['huahin', 'หัวหิน', 'Hua Hin', 'hua hin', '华欣', 99.959, 12.568],
  ['maesot', 'แม่สอด', 'Mae Sot', 'mɛː sɔːt', '美索', 98.57, 16.714],
  ['maesai', 'แม่สาย', 'Mae Sai', 'mɛː saːj', '美赛', 99.883, 20.433],
  ['sriracha', 'ศรีราชา', 'Si Racha', 'siː raː.tɕʰaː', '是拉差', 100.931, 13.166],
  ['laemchabang', 'แหลมฉบัง', 'Laem Chabang', 'lɛːm tɕʰa.baŋ', '林查班', 100.883, 13.083],
  ['pakkret', 'ปากเกร็ด', 'Pak Kret', 'paːk kret', '巴革', 100.502, 13.913],
  ['rangsit', 'รังสิต', 'Rangsit', 'raŋ sit', '兰实', 100.617, 13.984],
  ['betong', 'เบตง', 'Betong', 'beː.toŋ', '勿洞', 101.073, 5.774],
  ['aranyaprathet', 'อรัญประเทศ', 'Aranyaprathet', 'ʔa.ran.ja.pra.tʰeːt', '亚兰', 102.501, 13.693],
  ['sattahip', 'สัตหีบ', 'Sattahip', 'sat.ta.hiːp', '梭桃邑', 100.901, 12.666],
  ['chaam', 'ชะอำ', 'Cha-am', 'tɕʰa.ʔam', '七岩', 99.967, 12.8],
];

export function addThaiPlaces(course: Course): Course {
  const items = [...course.items];
  const prerequisites = items.filter(item => item.kind !== 'word').map(item => item.id);
  const mainPlaces = new Set(['chiangmai', 'chiangrai', 'phuket', 'krabi', 'khonkaen', 'sukhothai', 'chonburi']);
  const regionIds: string[] = [];
  for (const [id, glyph, roman, ipa, chinese, boundary] of provinces) {
    const existing = items.find(item => item.kind === 'word' && item.glyph === glyph);
    const regionId = boundary || `${roman} Province`;
    if (!Object.hasOwn(geometry.regions, regionId)) throw new Error(`Missing boundary: ${regionId}`);
    const item: Knowledge = existing || {
      id: `th-place-${id}`, courseId: 'thai', kind: 'word', glyph, roman, ipa,
      meaning: `${chinese}${id === 'bangkok-full' ? '' : '府'}`, title: `${chinese} · ${roman}`,
      explanation: '泰国一级行政区名称。按整个词识别拼写与读音；宽式 IPA 不标声调。地图红色区域为该行政区的大致范围。',
      group: '地名扩展 · 一级行政区', requires: prerequisites, sources: ['rtgs', 'tat', 'thai-places', 'thai-boundaries'],
      pronunciation: { speech: { text: glyph, label: '地名' } },
    };
    item.place = { type: 'region', regionId };
    item.extra = !mainPlaces.has(id);
    if (!existing) items.push(item);
    regionIds.push(item.id);
  }
  const cityIds = cities.map(([id, glyph, roman, ipa, chinese, lon, lat]) => {
    // Identical city/province spellings share one lexical entry and must not create
    // ambiguous answer choices. Main province entries already teach that spelling.
    if (items.some(item => item.glyph === glyph)) return '';
    const item: Knowledge = {
      id: `th-city-${id}`, courseId: 'thai', kind: 'word', glyph, roman, ipa,
      meaning: chinese, title: `${chinese} · ${roman}`, group: '地名扩展 · 城市',
      explanation: '泰国城市地名。红点为市区的大致位置，不代表行政边界；宽式 IPA 不标声调。',
      requires: prerequisites, sources: ['rtgs', 'tat', 'thai-places'],
      extra: true, place: { type: 'city', coordinates: [lon, lat] },
      pronunciation: { speech: { text: glyph, label: '地名' } },
      conventionalNames: id === 'pattaya' ? ['Pattaya'] : id === 'sriracha' ? ['Sri Racha'] : undefined,
    };
    items.push(item); return item.id;
  }).filter(Boolean);
  const bangkok = items.find(item => item.id === 'th-word-bangkok')!;
  bangkok.place = { type: 'city', coordinates: [100.502, 13.756] };
  const extraUnits: Unit[] = [];
  for (let offset = 0; offset < regionIds.length; offset += 13) {
    extraUnits.push({
      id: `thai-places-${offset / 13 + 1}`, title: `一级行政区 · 第 ${offset / 13 + 1} 组`,
      subtitle: '府名与地图位置', phase: '地名额外课', items: regionIds.slice(offset, offset + 13),
      note: '泰国 76 个府与曼谷特别行政区。已经练过的词不再重复初见，最后有综合复习。',
    });
  }
  extraUnits.push({ id: 'thai-cities', title: '更多城市', subtitle: '沿海、边境与都市圈',
    phase: '地名额外课', items: cityIds, note: '辨认大城市及重要街景目的地的完整拼写；红点表示市区位置。' });
  return { ...course, items, extraUnits, geography: {
    ...geometry, projection: { ...geometry.projection, translate: geometry.projection.translate as [number, number] },
  } };
}
