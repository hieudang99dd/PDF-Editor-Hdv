const WINANSI_SAFE = /^[\u0000-\u007f -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ\r\n\t]*$/;

export function needsFontEmbedding(text) {
  return !WINANSI_SAFE.test(text ?? '');
}

export const SCRIPT_FONTS = [
  [
    /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/,
    [
      'GeezaPro',
      'AlNile',
      'NotoNaskhArabic',
      'NotoSansArabic',
      'ArialUnicodeMS',
    ],
  ],
  [
    /[֐-׿יִ-ﭏ]/,
    ['ArialHebrew', 'NotoSansHebrew', 'LucidaGrande', 'ArialUnicodeMS'],
  ],
  [
    /[ऀ-ॿ]/,
    [
      'KohinoorDevanagari-Regular',
      'DevanagariMT',
      'NotoSansDevanagari',
      'ITFDevanagari',
    ],
  ],
  [/[ঀ-৿]/, ['KohinoorBangla-Regular', 'BanglaMN', 'NotoSansBengali']],
  [
    /[਀-੿]/,
    [
      'GurmukhiMN',
      'GurmukhiSangamMN',
      'Raavi',
      'NirmalaUI',
      'NotoSansGurmukhi',
    ],
  ],
  [
    /[઀-૿]/,
    [
      'KohinoorGujarati-Regular',
      'GujaratiSangamMN',
      'GujaratiMT',
      'Shruti',
      'NirmalaUI',
      'NotoSansGujarati',
    ],
  ],
  [
    /[଀-୿]/,
    ['OriyaMN', 'OriyaSangamMN', 'Kalinga', 'NirmalaUI', 'NotoSansOriya'],
  ],
  [
    /[஀-௿]/,
    [
      'TamilMN',
      'TamilSangamMN',
      'InaiMathi',
      'Latha',
      'NirmalaUI',
      'NotoSansTamil',
    ],
  ],
  [
    /[ఀ-౿]/,
    [
      'KohinoorTelugu-Regular',
      'TeluguMN',
      'TeluguSangamMN',
      'Gautami',
      'NirmalaUI',
      'NotoSansTelugu',
    ],
  ],
  [
    /[ಀ-೿]/,
    ['KannadaMN', 'KannadaSangamMN', 'Tunga', 'NirmalaUI', 'NotoSansKannada'],
  ],
  [
    /[ഀ-ൿ]/,
    [
      'MalayalamMN',
      'MalayalamSangamMN',
      'Kartika',
      'NirmalaUI',
      'NotoSansMalayalam',
    ],
  ],
  [
    /[඀-෿]/,
    [
      'SinhalaMN',
      'SinhalaSangamMN',
      'IskoolaPota',
      'NirmalaUI',
      'NotoSansSinhala',
    ],
  ],
  [/[฀-๿]/, ['Thonburi', 'SukhumvitSet-Text', 'NotoSansThai']],
  [
    /[຀-໿]/,
    ['LaoMN', 'LaoSangamMN', 'DokChampa', 'LeelawadeeUI', 'NotoSansLao'],
  ],
  [/[က-႟]/, ['MyanmarMN', 'MyanmarSangamMN', 'MyanmarText', 'NotoSansMyanmar']],
  [/[ក-៿]/, ['KhmerMN', 'KhmerSangamMN', 'KhmerUI', 'NotoSansKhmer']],
  [/[԰-֏]/, ['Mshtakan', 'NotoSansArmenian', 'Sylfaen', 'ArialUnicodeMS']],
  [/[Ⴀ-ჿ]/, ['NotoSansGeorgian', 'Sylfaen', 'ArialUnicodeMS']],
  [
    /[ሀ-፿]/,
    ['KefaIII-Regular', 'Kefa-Regular', 'NotoSansEthiopic', 'ArialUnicodeMS'],
  ],
  [/[ༀ-࿿]/, ['Kailasa', 'MicrosoftHimalaya', 'NotoSansTibetan']],
  [/[Ꭰ-᏿]/, ['PlantagenetCherokee', 'NotoSansCherokee']],
  [/[܀-ݏ]/, ['NotoSansSyriac-Regular', 'EstrangeloEdessa', 'ArialUnicodeMS']],
  [/[ހ-޿]/, ['NotoSansThaana', 'MVBoli', 'ArialUnicodeMS']],
  [
    /[Ḁ-ỿ]/,
    ['ArialUnicodeMS', 'TimesNewRomanPSMT', 'Arial', 'NotoSans-Regular'],
  ],
  [
    /[぀-ヿㇰ-ㇿ]/,
    [
      'HiraginoSans-W3',
      'HiraKakuProN-W3',
      'NotoSansJP-Regular',
      'ArialUnicodeMS',
    ],
  ],
  [
    /[가-힯ᄀ-ᇿ]/,
    ['AppleSDGothicNeo-Regular', 'NotoSansKR-Regular', 'ArialUnicodeMS'],
  ],
  [
    /[一-鿿㐀-䶿]/,
    [
      'PingFangSC-Regular',
      'STSong',
      'HiraginoSans-W3',
      'NotoSansSC-Regular',
      'ArialUnicodeMS',
    ],
  ],
  [/[Ѐ-ӿ]/, ['HelveticaNeue', 'ArialUnicodeMS', 'NotoSans-Regular']],
  [/[Ͱ-Ͽ]/, ['HelveticaNeue', 'ArialUnicodeMS', 'NotoSans-Regular']],
];

