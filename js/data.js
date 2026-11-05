// 선수 데이터
// P(이름, 등번호, 키cm, 능력치, 3점계수, 체격, 피부(0밝음~5어두움), 헤어, 머리색, 수염, 특징)
// 헤어: bald buzz short fade curly twists locs afro flow
// 머리색: k 검정, b 갈색, l 밝은갈색/금발, r 적갈색, g 회색, p 핑크(염색), w 탈색
// 수염: n 없음, s 수염자국, b 짧은수염, f 풍성한수염
// 특징: band 헤어밴드, sleeveL/sleeveR 암슬리브, legS 레그슬리브, tatA 팔문신, tatB 양팔문신, knee 무릎보호대,
//       mg 마우스가드, uni 일자눈썹, lefty 왼손잡이, long 긴팔다리, goggles 고글
function P(n, num, cm, ovr, three, build, skin, hair, hc, beard, x = '') {
  return { n, num, cm, ovr, three, build, skin, hair, hc, beard, x: x ? x.split(' ') : [] };
}

export const SPURS = {
  ab: 'SAS', name: '샌안토니오 스퍼스', coach: 'Mitch Johnson',
  starters: [
    P("De'Aaron Fox", 4, 191, 86, 0.95, 0.9, 4, 'fade', 'k', 's', 'tatA'),
    P('Stephon Castle', 5, 198, 82, 0.86, 1.0, 4, 'twists', 'k', 'n'),
    P('Devin Vassell', 24, 196, 80, 1.08, 0.94, 3, 'locs', 'k', 'n', 'sleeveL'),
    P('Harrison Barnes', 40, 203, 78, 1.05, 1.06, 4, 'buzz', 'k', 'b'),
    P('Victor Wembanyama', 1, 224, 97, 1.02, 0.86, 5, 'twists', 'k', 'n', 'long'),
  ],
  bench: [
    P('Dylan Harper', 2, 196, 80, 0.95, 0.98, 4, 'curly', 'k', 'n'),
    P('Keldon Johnson', 3, 196, 78, 0.95, 1.12, 4, 'short', 'k', 's', 'tatB'),
    P('Jeremy Sochan', 10, 203, 77, 0.8, 1.0, 2, 'short', 'p', 'n'),
    P('Julian Champagnie', 30, 203, 76, 1.05, 1.0, 4, 'buzz', 'k', 's'),
    P('Luke Kornet', 7, 218, 74, 0.7, 0.9, 0, 'flow', 'b', 's'),
  ],
};

export const TEAMS = {
  LAL: { name: 'LA 레이커스', starters: [
    P('Luka Dončić', 77, 201, 95, 1.1, 1.16, 0, 'flow', 'b', 'b', 'knee'),
    P('Austin Reaves', 15, 196, 84, 1.05, 0.93, 0, 'short', 'r', 'n'),
    P('LeBron James', 23, 206, 91, 1.0, 1.18, 4, 'buzz', 'k', 'f', 'tatB'),
    P('Rui Hachimura', 28, 203, 80, 1.0, 1.06, 3, 'short', 'k', 'n'),
    P('Deandre Ayton', 5, 211, 81, 0.6, 1.12, 4, 'buzz', 'k', 'n')],
    bench: [P('Marcus Smart', 36, 191, 78, 0.95, 1.08, 4, 'fade', 'k', 'b', 'tatA'), P('Jarred Vanderbilt', 2, 203, 75, 0.6, 0.95, 4, 'locs', 'k', 'n', 'sleeveR'), P('Jaxson Hayes', 11, 213, 74, 0.4, 0.9, 4, 'buzz', 'k', 'n')] },
  BOS: { name: '보스턴 셀틱스', starters: [
    P('Payton Pritchard', 11, 185, 82, 1.12, 0.98, 0, 'short', 'b', 's'),
    P('Derrick White', 9, 193, 84, 1.05, 0.96, 0, 'bald', 'b', 'b'),
    P('Jaylen Brown', 7, 198, 89, 0.98, 1.08, 5, 'buzz', 'k', 'f'),
    P('Jayson Tatum', 0, 203, 93, 1.06, 1.02, 3, 'buzz', 'k', 'b', 'tatA'),
    P('Neemias Queta', 88, 213, 77, 0.4, 1.08, 4, 'buzz', 'k', 'n')],
    bench: [P('Anfernee Simons', 4, 191, 81, 1.12, 0.9, 4, 'fade', 'k', 's', 'tatA'), P('Sam Hauser', 30, 201, 77, 1.18, 1.0, 0, 'short', 'b', 's'), P('Luka Garza', 52, 208, 73, 0.9, 1.15, 0, 'short', 'b', 'b')] },
  GSW: { name: '골든스테이트 워리어스', starters: [
    P('Stephen Curry', 30, 188, 94, 1.3, 0.9, 2, 'short', 'k', 's', 'mg'),
    P('Brandin Podziemski', 2, 196, 79, 1.02, 0.96, 0, 'flow', 'l', 'n'),
    P('Jimmy Butler', 10, 201, 87, 0.85, 1.06, 4, 'buzz', 'k', 'b'),
    P('Draymond Green', 23, 198, 80, 0.85, 1.12, 4, 'buzz', 'k', 'f'),
    P('Al Horford', 20, 206, 79, 1.0, 1.12, 3, 'buzz', 'g', 'b')],
    bench: [P('Jonathan Kuminga', 1, 201, 79, 0.8, 1.08, 5, 'short', 'k', 'n'), P('Buddy Hield', 7, 193, 77, 1.2, 1.0, 4, 'buzz', 'k', 'b'), P('Moses Moody', 4, 196, 76, 1.05, 1.0, 4, 'twists', 'k', 'n')] },
  MIL: { name: '밀워키 벅스', starters: [
    P('Kevin Porter Jr.', 7, 193, 80, 0.95, 0.95, 4, 'locs', 'k', 'n'),
    P('Gary Trent Jr.', 5, 196, 78, 1.1, 1.02, 4, 'buzz', 'k', 'b'),
    P('Kyle Kuzma', 18, 203, 79, 0.95, 0.98, 3, 'twists', 'w', 'b', 'tatB'),
    P('Giannis Antetokounmpo', 34, 211, 96, 0.6, 1.12, 5, 'buzz', 'k', 's', 'long'),
    P('Myles Turner', 3, 211, 82, 1.0, 1.05, 4, 'buzz', 'k', 'b')],
    bench: [P('Bobby Portis', 9, 208, 78, 1.0, 1.12, 4, 'short', 'k', 'f', 'tatB'), P('AJ Green', 20, 193, 74, 1.2, 0.92, 0, 'short', 'b', 'n'), P('Taurean Prince', 12, 198, 74, 1.05, 1.04, 4, 'locs', 'k', 'b')] },
  DEN: { name: '덴버 너게츠', starters: [
    P('Jamal Murray', 27, 193, 87, 1.05, 0.98, 2, 'curly', 'k', 'b', 'band'),
    P('Christian Braun', 0, 198, 80, 0.95, 0.98, 0, 'flow', 'l', 'n'),
    P('Cameron Johnson', 23, 203, 80, 1.1, 1.0, 3, 'short', 'k', 'n'),
    P('Aaron Gordon', 32, 203, 82, 0.9, 1.14, 4, 'buzz', 'k', 'b', 'tatB'),
    P('Nikola Jokić', 15, 211, 98, 1.0, 1.24, 0, 'short', 'b', 's')],
    bench: [P('Bruce Brown', 11, 193, 76, 0.9, 1.06, 4, 'buzz', 'k', 'b'), P('Jonas Valančiūnas', 17, 211, 77, 0.6, 1.25, 0, 'buzz', 'b', 's'), P('Peyton Watson', 8, 203, 75, 0.85, 0.92, 4, 'twists', 'k', 'n')] },
  PHX: { name: '피닉스 선즈', starters: [
    P('Jalen Green', 4, 193, 82, 0.98, 0.92, 3, 'curly', 'k', 'n'),
    P('Devin Booker', 1, 196, 91, 1.08, 0.98, 2, 'short', 'k', 's', 'tatA'),
    P('Grayson Allen', 8, 193, 77, 1.08, 0.98, 0, 'short', 'b', 'n'),
    P('Dillon Brooks', 3, 198, 78, 0.95, 1.06, 4, 'buzz', 'k', 'b'),
    P('Mark Williams', 15, 213, 79, 0.3, 1.08, 4, 'buzz', 'k', 'n')],
    bench: [P('Collin Gillespie', 12, 185, 74, 1.1, 0.95, 0, 'short', 'b', 's'), P("Royce O'Neale", 0, 198, 75, 1.05, 1.08, 4, 'buzz', 'k', 'f'), P('Ryan Dunn', 0, 203, 73, 0.75, 1.0, 4, 'short', 'k', 'n')] },
  MIA: { name: '마이애미 히트', starters: [
    P('Norman Powell', 24, 191, 82, 1.08, 1.0, 4, 'buzz', 'k', 'b'),
    P('Tyler Herro', 14, 196, 85, 1.1, 0.94, 0, 'short', 'k', 's', 'tatB'),
    P('Andrew Wiggins', 22, 201, 80, 0.95, 0.98, 4, 'curly', 'k', 'b'),
    P('Bam Adebayo', 13, 206, 87, 0.6, 1.14, 4, 'buzz', 'k', 'b'),
    P("Kel'el Ware", 7, 213, 78, 0.7, 0.98, 4, 'locs', 'k', 'n')],
    bench: [P('Davion Mitchell', 45, 183, 75, 0.95, 1.05, 4, 'buzz', 'k', 's'), P('Jaime Jaquez Jr.', 11, 198, 77, 0.9, 1.04, 1, 'short', 'k', 'n'), P('Nikola Jović', 5, 208, 75, 1.0, 0.95, 0, 'short', 'b', 'n')] },
  NYK: { name: '뉴욕 닉스', starters: [
    P('Jalen Brunson', 11, 188, 92, 1.06, 1.02, 3, 'buzz', 'k', 'b'),
    P('Josh Hart', 3, 193, 80, 0.9, 1.04, 4, 'buzz', 'k', 'f'),
    P('Mikal Bridges', 25, 198, 83, 1.0, 0.92, 5, 'buzz', 'k', 'n', 'long'),
    P('OG Anunoby', 8, 201, 83, 1.0, 1.08, 5, 'buzz', 'k', 's'),
    P('Karl-Anthony Towns', 32, 213, 89, 1.12, 1.12, 2, 'buzz', 'k', 'b', 'tatB')],
    bench: [P('Miles McBride', 2, 188, 76, 1.05, 1.0, 4, 'short', 'k', 'n'), P('Mitchell Robinson', 23, 213, 77, 0.2, 1.05, 5, 'twists', 'k', 'n'), P('Jordan Clarkson', '00', 196, 77, 1.0, 0.95, 2, 'flow', 'k', 's', 'tatB')] },
  PHI: { name: '필라델피아 76ers', starters: [
    P('Tyrese Maxey', 0, 188, 88, 1.05, 0.92, 4, 'buzz', 'k', 'n'),
    P('VJ Edgecombe', 77, 196, 78, 0.95, 0.96, 4, 'short', 'k', 'n'),
    P('Kelly Oubre Jr.', 9, 203, 78, 0.95, 0.96, 4, 'locs', 'k', 'n', 'tatB'),
    P('Paul George', 8, 203, 84, 1.06, 0.98, 3, 'buzz', 'k', 'b', 'sleeveR'),
    P('Joel Embiid', 21, 213, 92, 0.95, 1.28, 4, 'buzz', 'k', 'b', 'knee')],
    bench: [P('Quentin Grimes', 5, 196, 77, 1.05, 1.02, 3, 'short', 'k', 'n'), P('Jared McCain', 20, 188, 77, 1.12, 0.94, 3, 'flow', 'k', 'n'), P('Andre Drummond', 1, 211, 74, 0.2, 1.26, 4, 'buzz', 'k', 'b')] },
  DAL: { name: '댈러스 매버릭스', starters: [
    P('Kyrie Irving', 11, 188, 89, 1.1, 0.94, 3, 'short', 'k', 'b', 'tatB band'),
    P('Klay Thompson', 31, 198, 80, 1.15, 1.0, 2, 'short', 'k', 's'),
    P('Cooper Flagg', 32, 206, 84, 0.95, 0.98, 0, 'short', 'l', 'n'),
    P('P.J. Washington', 25, 201, 79, 1.0, 1.08, 4, 'curly', 'k', 'b'),
    P('Anthony Davis', 3, 208, 91, 0.75, 1.08, 4, 'buzz', 'k', 'b', 'uni sleeveL long')],
    bench: [P("D'Angelo Russell", 5, 193, 77, 1.05, 0.96, 3, 'fade', 'k', 's', 'tatA'), P('Dereck Lively II', 2, 216, 77, 0.2, 0.95, 4, 'short', 'k', 'n'), P('Naji Marshall', 13, 201, 75, 0.85, 1.04, 4, 'buzz', 'k', 'b')] },
  OKC: { name: '오클라호마시티 썬더', starters: [
    P('Shai Gilgeous-Alexander', 2, 198, 97, 1.02, 0.9, 4, 'short', 'k', 's', 'long'),
    P('Luguentz Dort', 5, 193, 79, 1.0, 1.12, 4, 'buzz', 'k', 'b'),
    P('Jalen Williams', 8, 198, 86, 1.0, 1.02, 3, 'short', 'k', 's'),
    P('Chet Holmgren', 7, 216, 86, 1.05, 0.8, 0, 'short', 'l', 'n', 'long'),
    P('Isaiah Hartenstein', 55, 213, 80, 0.5, 1.18, 0, 'flow', 'b', 'b')],
    bench: [P('Alex Caruso', 9, 196, 78, 1.0, 1.0, 0, 'bald', 'b', 's'), P('Cason Wallace', 22, 193, 77, 1.02, 0.98, 4, 'short', 'k', 'n'), P('Aaron Wiggins', 21, 198, 75, 1.0, 1.0, 4, 'buzz', 'k', 's')] },
  MIN: { name: '미네소타 팀버울브스', starters: [
    P('Mike Conley', 10, 185, 78, 1.08, 0.95, 3, 'buzz', 'k', 's'),
    P('Anthony Edwards', 5, 193, 93, 1.08, 1.1, 4, 'short', 'k', 's', 'tatA'),
    P('Jaden McDaniels', 3, 206, 80, 0.95, 0.85, 4, 'short', 'k', 'n', 'long'),
    P('Julius Randle', 30, 203, 84, 0.95, 1.18, 4, 'buzz', 'k', 'b', 'lefty tatB'),
    P('Rudy Gobert', 27, 216, 82, 0.1, 1.0, 4, 'short', 'k', 's', 'long')],
    bench: [P('Naz Reid', 11, 206, 80, 1.05, 1.15, 4, 'short', 'k', 'n'), P('Donte DiVincenzo', 0, 193, 77, 1.1, 1.0, 0, 'short', 'b', 'b'), P('Rob Dillingham', 4, 185, 74, 1.0, 0.86, 4, 'curly', 'k', 'n')] },
  // ── 약팀 (2024-25 시즌 하위권) ──
  UTA: { name: '유타 재즈', starters: [
    P('Isaiah Collier', 13, 191, 73, 0.75, 1.02, 4, 'short', 'k', 'n'),
    P('Keyonte George', 3, 193, 76, 1.0, 0.95, 4, 'twists', 'k', 'n'),
    P('Ace Bailey', 19, 208, 75, 0.95, 0.86, 4, 'short', 'k', 'n', 'long'),
    P('Lauri Markkanen', 23, 213, 84, 1.08, 0.98, 0, 'flow', 'l', 's'),
    P('Walker Kessler', 24, 213, 77, 0.1, 1.08, 0, 'short', 'b', 'n')],
    bench: [P('Jusuf Nurkić', 30, 211, 74, 0.6, 1.26, 0, 'short', 'b', 'b'), P('Svi Mykhailiuk', 10, 201, 72, 1.1, 0.95, 0, 'short', 'b', 's'), P('Brice Sensabaugh', 28, 198, 72, 1.05, 1.06, 4, 'locs', 'k', 'n')] },
  WAS: { name: '워싱턴 위저즈', starters: [
    P('CJ McCollum', 3, 191, 79, 1.08, 0.98, 4, 'buzz', 'k', 'f'),
    P('Bilal Coulibaly', 0, 198, 75, 0.88, 0.95, 5, 'short', 'k', 'n', 'long'),
    P('Kyshawn George', 18, 203, 73, 0.95, 0.94, 3, 'short', 'k', 'n'),
    P('Khris Middleton', 22, 201, 76, 1.02, 1.04, 4, 'buzz', 'k', 'b'),
    P('Alex Sarr', 20, 213, 76, 0.75, 0.85, 5, 'short', 'k', 'n', 'long')],
    bench: [P('Bub Carrington', 8, 193, 72, 0.98, 0.92, 4, 'curly', 'k', 'n'), P('Tre Johnson', 12, 196, 73, 1.08, 0.95, 4, 'short', 'k', 'n'), P('Marvin Bagley III', 35, 208, 72, 0.6, 1.05, 4, 'twists', 'k', 'n')] },
};

// 선수별 개인기 (moves: 드리블 무브, shots: 슛 종류, dunks: 덩크 종류, tag: 화면 표시용 별명)
// moves: cross 크로스오버, btl 비하인드더레그, behind 비하인드백, hesi 헤지테이션, spin 스핀, euro 유로스텝, stepback 스텝백, jab 잽스텝
// shots: jumper, pullup, fade 페이드어웨이, stepback 스텝백, hook 훅슛, floater 플로터
// dunks: oneHand, twoHand, tomahawk, windmill
export const SIGNATURE = {
  'Victor Wembanyama': { moves: ['spin', 'stepback', 'euro', 'btl'], shots: ['fade', 'stepback', 'hook', 'pullup'], dunks: ['oneHand', 'tomahawk', 'twoHand'], tag: '에일리언 · 스텝백 & 스핀' },
  "De'Aaron Fox": { moves: ['hesi', 'cross', 'spin', 'euro'], shots: ['floater', 'pullup'], dunks: ['oneHand', 'tomahawk'], tag: '스피드 돌파' },
  'Stephon Castle': { moves: ['euro', 'cross', 'spin'], shots: ['pullup', 'floater'], dunks: ['twoHand', 'tomahawk'] },
  'Devin Vassell': { moves: ['btl', 'hesi', 'stepback'], shots: ['fade', 'pullup'], dunks: ['oneHand'] },
  'Harrison Barnes': { moves: ['jab', 'cross'], shots: ['pullup', 'fade'], dunks: ['twoHand'] },
  'Dylan Harper': { moves: ['hesi', 'euro', 'btl'], shots: ['floater', 'pullup'], dunks: ['oneHand', 'windmill'] },
  'Luka Dončić': { moves: ['stepback', 'hesi', 'btl', 'behind'], shots: ['stepback', 'fade', 'floater'], dunks: ['twoHand'], tag: '스텝백 3점' },
  'LeBron James': { moves: ['spin', 'cross', 'euro'], shots: ['fade', 'pullup'], dunks: ['tomahawk', 'twoHand', 'windmill'], tag: '킹 · 토마호크' },
  'Austin Reaves': { moves: ['hesi', 'stepback'], shots: ['floater', 'stepback'], dunks: ['oneHand'] },
  'Stephen Curry': { moves: ['btl', 'behind', 'cross', 'stepback'], shots: ['pullup', 'stepback'], dunks: ['oneHand'], tag: '딥 쓰리 · 드리블 콤보' },
  'Jimmy Butler': { moves: ['jab', 'spin'], shots: ['fade', 'pullup'], dunks: ['twoHand'] },
  'Giannis Antetokounmpo': { moves: ['euro', 'spin'], shots: ['hook', 'pullup'], dunks: ['twoHand', 'tomahawk', 'windmill'], tag: '그리스 괴인 · 유로스텝' },
  'Nikola Jokić': { moves: ['jab', 'spin'], shots: ['hook', 'fade', 'floater'], dunks: ['twoHand'], tag: '훅슛 & 원풋 페이더웨이' },
  'Jamal Murray': { moves: ['hesi', 'btl', 'stepback'], shots: ['floater', 'fade', 'pullup'], dunks: ['oneHand'] },
  'Aaron Gordon': { moves: ['spin'], shots: ['hook'], dunks: ['windmill', 'tomahawk', 'twoHand'] },
  'Kyrie Irving': { moves: ['btl', 'behind', 'cross', 'spin', 'hesi'], shots: ['floater', 'fade', 'stepback'], dunks: ['oneHand'], tag: '앵클 브레이커' },
  'Anthony Davis': { moves: ['spin', 'jab'], shots: ['hook', 'fade', 'pullup'], dunks: ['twoHand', 'tomahawk'] },
  'Cooper Flagg': { moves: ['euro', 'spin', 'cross'], shots: ['pullup', 'fade'], dunks: ['tomahawk', 'windmill'] },
  'Klay Thompson': { moves: ['jab'], shots: ['pullup', 'jumper'], dunks: ['oneHand'] },
  'Joel Embiid': { moves: ['jab', 'spin'], shots: ['fade', 'hook'], dunks: ['twoHand'], tag: '드림 셰이크' },
  'Tyrese Maxey': { moves: ['cross', 'hesi', 'euro'], shots: ['floater', 'pullup'], dunks: ['oneHand'] },
  'VJ Edgecombe': { moves: ['euro', 'cross'], shots: ['pullup'], dunks: ['windmill', 'tomahawk'] },
  'Paul George': { moves: ['btl', 'stepback'], shots: ['stepback', 'fade'], dunks: ['tomahawk'] },
  'Jalen Brunson': { moves: ['hesi', 'spin', 'jab'], shots: ['fade', 'floater'], dunks: ['oneHand'], tag: '피벗 마스터' },
  'Karl-Anthony Towns': { moves: ['jab', 'spin'], shots: ['pullup', 'hook'], dunks: ['twoHand'] },
  'Jayson Tatum': { moves: ['stepback', 'btl', 'jab'], shots: ['stepback', 'fade'], dunks: ['tomahawk'] },
  'Jaylen Brown': { moves: ['spin', 'euro', 'cross'], shots: ['pullup'], dunks: ['tomahawk', 'windmill'] },
  'Devin Booker': { moves: ['jab', 'hesi', 'btl'], shots: ['fade', 'pullup'], dunks: ['oneHand'], tag: '미드레인지 장인' },
  'Jalen Green': { moves: ['cross', 'euro'], shots: ['pullup'], dunks: ['windmill', 'tomahawk'] },
  'Tyler Herro': { moves: ['hesi', 'stepback'], shots: ['stepback', 'floater'], dunks: ['oneHand'] },
  'Bam Adebayo': { moves: ['spin'], shots: ['hook', 'floater'], dunks: ['twoHand'] },
  'Kyle Kuzma': { moves: ['jab', 'spin'], shots: ['fade'], dunks: ['tomahawk'] },
  'Mikal Bridges': { moves: ['jab'], shots: ['pullup', 'fade'], dunks: ['oneHand'] },
  'Kevin Porter Jr.': { moves: ['btl', 'behind', 'stepback'], shots: ['stepback', 'fade'], dunks: ['windmill'] },
  "D'Angelo Russell": { moves: ['hesi', 'btl'], shots: ['floater', 'pullup'], dunks: ['oneHand'] },
  'Shai Gilgeous-Alexander': { moves: ['hesi', 'spin', 'euro', 'cross'], shots: ['pullup', 'floater', 'fade'], dunks: ['oneHand'], tag: 'MVP · 미드레인지 헤지' },
  'Jalen Williams': { moves: ['euro', 'spin', 'hesi'], shots: ['pullup', 'floater'], dunks: ['tomahawk', 'oneHand'] },
  'Chet Holmgren': { moves: ['spin', 'stepback'], shots: ['pullup', 'hook', 'fade'], dunks: ['oneHand', 'twoHand'], tag: '7피트 슈터 · 블록' },
  'Isaiah Hartenstein': { moves: ['jab'], shots: ['floater', 'hook'], dunks: ['twoHand'] },
  'Alex Caruso': { moves: ['hesi', 'cross'], shots: ['pullup'], dunks: ['oneHand'] },
  'Anthony Edwards': { moves: ['cross', 'hesi', 'euro', 'stepback'], shots: ['pullup', 'stepback', 'fade'], dunks: ['tomahawk', 'windmill', 'oneHand'], tag: '앤트맨 · 포스터 덩크' },
  'Julius Randle': { moves: ['spin', 'jab'], shots: ['fade', 'pullup'], dunks: ['twoHand'], tag: '왼손 파워 포워드' },
  'Rudy Gobert': { moves: ['jab'], shots: ['hook'], dunks: ['twoHand', 'oneHand'], tag: '블록 장인 · 림 프로텍터' },
  'Jaden McDaniels': { moves: ['euro', 'cross'], shots: ['pullup'], dunks: ['tomahawk'] },
  'Naz Reid': { moves: ['jab', 'spin'], shots: ['pullup', 'fade'], dunks: ['twoHand'] },
  'Mike Conley': { moves: ['hesi', 'btl'], shots: ['floater', 'pullup'], dunks: ['oneHand'] },
  'Lauri Markkanen': { moves: ['stepback', 'jab'], shots: ['stepback', 'fade', 'pullup'], dunks: ['twoHand', 'oneHand'], tag: '7피트 핀란드 슈터' },
  'Keyonte George': { moves: ['hesi', 'btl', 'stepback'], shots: ['pullup', 'stepback'], dunks: ['oneHand'] },
  'Ace Bailey': { moves: ['spin', 'stepback'], shots: ['fade', 'pullup'], dunks: ['tomahawk'] },
  'Walker Kessler': { moves: ['jab'], shots: ['hook'], dunks: ['twoHand'], tag: '블록 머신' },
  'CJ McCollum': { moves: ['hesi', 'btl', 'jab'], shots: ['fade', 'floater', 'pullup'], dunks: ['oneHand'], tag: '미드레인지 베테랑' },
  'Alex Sarr': { moves: ['spin'], shots: ['hook', 'pullup'], dunks: ['twoHand', 'tomahawk'] },
  'Bilal Coulibaly': { moves: ['euro', 'cross'], shots: ['pullup'], dunks: ['windmill', 'tomahawk'] },
  'Khris Middleton': { moves: ['jab', 'hesi'], shots: ['fade', 'pullup'], dunks: ['oneHand'] },
};
