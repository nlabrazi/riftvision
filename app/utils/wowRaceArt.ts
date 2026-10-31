// Visuels des races publiés par Blizzard : https://worldofwarcraft.blizzard.com/fr-fr/game/races
const raceArt: Record<number, string> = {
  1: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt272a38ad27f37328/682b6c7423403a6e3f16f4e5/Human.png',
  2: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt88a8b95c54b38b1f/682b6c5104555b80321d9a10/Orc.png',
  3: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltbfb7f37c16b14f90/682b6c7428988a617682dfed/Dwarf.png',
  4: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt0140ed3547d708db/682b6c7498d9912d26d86213/NightElf.png',
  5: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltf5fa4e4e547921f6/682b6c50e9dfeb0a51c93d55/Undead.png',
  6: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltb290e199b134fd39/682b6c50cbbe8b127e298f30/Tauren.png',
  7: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltee4327ab01c9bab5/682b6c73ca63593586147c29/gNOME.png',
  8: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltc1be443a819e02e2/682b6c50744b3be8b4fd76a6/Troll.png',
  9: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltca6c2f6341f42b63/682b6c51bd7bfb64709f7584/Goblin.png',
  10: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt697c6d7738f9dae5/682b6c50d5acb5478c2501b8/BloodElf.png',
  11: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt6b343d73acd25277/682b6c744ed3ffac805337ec/Dranei.png',
  22: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltd7c03761e81f8137/682b6c7323403a416f16f4e1/Worgen.png',
  24: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt962bf7d7289bad5f/682b6c73d5acb5e68a2501c4/Pandaren_Alliance.png',
  25: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt962bf7d7289bad5f/682b6c73d5acb5e68a2501c4/Pandaren_Alliance.png',
  26: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltc3dd9762d2e5d030/682b6c50d975a1783a2711b5/Pandaren_Horde.png',
  27: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltcdb940670fcf30d9/682b6c62d5acb5a6a62501bc/Nightborne.png',
  28: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt29d5eea5f9922c94/682b6c63bd7bfb454e9f7588/HighmountainTauren.png',
  29: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltf724873d431b4cb9/682b6c626ea2dd4c1f217c32/VoidElf.png',
  30: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt4a74fb6e0f248290/682b6c6304555b6d7c1d9a14/LightforgedDranei.png',
  31: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt8ccd3c1cd477ca22/682b6c62f13ef540ccc763c4/Zandalari.png',
  32: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt3394808c911802b9/682b6c63d5acb52f592501c0/Kultiran.png',
  34: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltbebd9701b648dedb/682b6c69a6d4b0481e3de802/DarkIronDwarf.png',
  35: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt9912652e5c0ac464/682b6c62cbbe8b798b298f34/Vulpera.png',
  36: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltac83e65ea8cd321c/682b6c62e9dfeb57cec93d59/Mag_harOrc.png',
  37: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltccd60805a7b936b5/682b6c62d975a17f832711b9/Mechagnome.png',
  52: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt42d8d2b3243b13a5/682b6c74bd7bfb4f709f758c/Dracthyr_Alliance.png',
  70: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltfd0fa7a999ef0269/682b6c504ed3ff70be5337e8/Dracthyr_Horde.png',
  84: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltcbcb2b64ada8f870/682b6c6328988ab1bb82dfe9/Earthen_Horde.png',
  85: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/blt9aa9a3d9b6130db3/682b6c69cbbe8b6731298f38/Earthen_Alliance.png',
  86: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltac525802660fd99d/69a24aeb04090066da6de2e9/Haranir_Alliance_Card.png',
  91: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltfeb87ce044f8770f/69a259060856d8f953e82ab8/Haranir_Horde_Card.png',
}

export function wowRaceArt(id: number): string | null {
  return raceArt[id] ?? null
}
