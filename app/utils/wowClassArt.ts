// Illustrations des classes publiées par Blizzard : https://worldofwarcraft.blizzard.com/fr-fr/game/classes
const classArt: Record<number, string> = {
  1: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltf9f62859db695a4d/5ee3e473a7c560086afc3ffd/9WL35DUZNSG01457032148687.jpg',
  2: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt931cd3c007637bcc/5ee790ab3a8621077a04a479/ZNPM9RQETYC21457032234435.jpg',
  3: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt567c8844ced4dbc7/5ee3e411e8f74907ecce011e/QDIDT6YO6NYN1457032234749.jpg',
  4: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltceda97b65490029d/5ee3e4a218f34d710497c5c9/65H7H3XK5PFS1457032234098.jpg',
  5: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt6b4539f958b752fb/5ee78bff63a2d97093830907/MWNKR1G1Z7AD1457032234453.jpg',
  6: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt456a89c041972885/5ee3e3d363a2d9709383078b/XM82LOJR750J1457032234975.jpg',
  7: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt3001008857efcbd4/5ee7928218f34d710497c759/LPEY9SFJT7PB1457032234088.jpg',
  8: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltdd80a40a42fdc015/5ee3e44c18f34d710497c5bd/PRJHFTFZI64Z1457032234735.jpg',
  9: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt87bd56354f8c3fcd/5ee3e8c1889f917094610eb8/YDUU4KIKVCLY1457032234192.jpg',
  10: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltab8e835ed1f245ba/5ee793cb3a8621077a04a491/80E3HJ653J1M1457032234443.jpg',
  11: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt15fb42851b4eab5e/5ee3e39aa9170407eeb4b76d/1LARAZ7I3M0F1457032234809.jpg',
  12: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltecb94c367119455a/5ee79631d217327180733e77/4YSZQMC616V61457032235002.jpg',
  13: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltc4d521bd78d2e181/6351cce05e1b6d519cb60ba9/Evoker_Card.jpg',
}

export function wowClassArt(id: number): string | null {
  return classArt[id] ?? null
}
