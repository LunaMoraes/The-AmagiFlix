import { OTHER_CATEGORY_ID, OTHER_SHOWS_CATEGORY_ID } from "./app";

export type SubcategoryId = "full-movie" | "series" | "one-shot";

export interface SubcategoryRule {
  id: SubcategoryId;
  label: string;
}

export const DEFAULT_SUBCATEGORIES: SubcategoryRule[] = [
  { id: "full-movie", label: "Full Movie" },
  { id: "series", label: "Series" },
  { id: "one-shot", label: "One-shot" },
];

export interface CategoryRule {
  id: string;
  label: string;
  priority: number;
  patterns: RegExp[];
  subcategories?: SubcategoryRule[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  { id: "naruto", label: "Naruto & Boruto", priority: 10, subcategories: DEFAULT_SUBCATEGORIES, patterns: [/\bnaruto\b/i, /\bboruto\b/i, /\bsasuke\b/i, /\bitachi\b/i, /\bmadara\b/i, /\bkakashi\b/i, /\bakatsuki\b/i, /\bhokage\b/i, /\bminato\b/i, /\bkaguya\b/i, /\bsakura\b/i, /\bjiraiya\b/i, /\bhinata\b/i, /\bkurama\b/i, /\bkushina\b/i, /\buchiha\b/i, /\bshisui\b/i, /\bdanzo\b/i, /\bteam\s*7\b/i, /\bjinchuriki\b/i, /\bobito\b/i, /\byahiko\b/i, /\bhyuga\b/i, /\bkonoha\b/i, /\bhiruzen\b/i, /\borochimaru\b/i, /\bgaara\b/i, /\bsunagakure\b/i, /\bkimimaro\b/i, /\brin(?:\s+nohara)?\b/i, /\buzumaki\b/i, /\bkarura\b/i, /\bone[ -]?tails?\b/i, /\bnine[ -]?tails?\b/i, /\btailed beasts?\b/i, /\brock lee\b/i, /\bhashirama\b/i, /\bsenju\b/i, /\bsakumo(?:\s+hatake)?\b/i, /\bcurse of hatred\b/i, /\bneji\b/i, /\bhaku\b/i, /\bzabuza\b/i, /\bblack zetsu\b/i] },
  { id: "avatar", label: "Avatar", priority: 20, patterns: [/\bavatar(?:\s*:\s*the last airbender)?\b/i, /\baang\b/i, /\bzuko\b/i, /\bazula\b/i, /\bkorra\b/i, /\broku\b/i, /\bsozin\b/i, /\biroh\b/i, /\bfire lord\b/i] },
  { id: "one-piece", label: "One Piece", priority: 30, patterns: [/\bone piece\b/i, /\bluffy\b/i, /\broronoa zoro\b/i, /\bstraw hats?\b/i] },
  { id: "dragon-ball", label: "Dragon Ball", priority: 40, patterns: [/\bdragon ball\b/i, /\bgoku\b/i, /\bvegeta\b/i, /\bfrieza\b/i, /\bgohan\b/i, /\buub\b/i, /\bsuper saiyan\b/i, /\btournament of power\b/i] },
  { id: "my-hero-academia", label: "My Hero Academia", priority: 50, patterns: [/\bmy hero academia\b/i, /\bdeku\b/i, /\ball might\b/i, /\bbakugo\b/i] },
  { id: "demon-slayer", label: "Demon Slayer", priority: 60, patterns: [/\bdemon slayer\b/i, /\btanjiro\b/i, /\bnezuko\b/i, /\bhashira\b/i] },
  { id: "jujutsu-kaisen", label: "Jujutsu Kaisen", priority: 70, patterns: [/\bjujutsu kaisen\b/i, /\bsatoru gojo\b/i, /\bsukuna\b/i, /\byuji itadori\b/i] },
  { id: "attack-on-titan", label: "Attack on Titan", priority: 80, patterns: [/\battack on titan\b/i, /\beren(?:\s+(?:yeager|jaeger))?\b/i, /\bmikasa\b/i, /\blevi ackerman\b/i, /\breiner\b/i, /\bbert(?:holdt|olt)\b/i, /\bzeke\b/i, /\berwin\b/i, /\bfounding titan\b/i, /\bcolossal titan\b/i] },
  { id: "pokemon", label: "Pokémon", priority: 90, patterns: [/\bpok[eé]mon\b/i, /\bash ketchum\b/i, /\bpikachu\b/i] },
  { id: "bleach", label: "Bleach", priority: 100, patterns: [/\bbleach\b/i, /\bichigo\b/i, /\baizen\b/i] },
  { id: "jojo", label: "JoJo's Bizarre Adventure", priority: 103, patterns: [/\bjojo(?:'s)? bizarre adventure\b/i, /\bjonathan joestar\b/i, /\bdio brando\b/i, /\bjonathan was adopted by the brandos\b/i] },
  { id: "one-punch-man", label: "One-Punch Man", priority: 105, patterns: [/\bone[ -]punch man\b/i, /\bsaitama\b/i, /\bgenos\b/i] },
  { id: "kpop-demon-hunters", label: "KPop Demon Hunters", priority: 108, patterns: [/\bk[ -]?pop demon hunters?\b/i, /\bhuntr\/x\b/i, /\brumi\b/i, /\bjinu\b/i, /\bsaja boys?\b/i] },
  { id: "invincible", label: "Invincible", priority: 110, patterns: [/\binvincible\b/i, /\bomni[ -]man\b/i, /\bmark grayson\b/i] },
  { id: "wizarding-world", label: "Wizarding World", priority: 120, patterns: [/\bharry potter\b/i, /\bhogwarts\b/i, /\bvoldemort\b/i, /\bdumbledore\b/i] },
  { id: "hunger-games", label: "The Hunger Games", priority: 125, patterns: [/\bthe hunger games\b/i, /\bkatniss\b/i, /\bpeeta\b/i, /\bpanem\b/i] },
  { id: "game-of-thrones", label: "Game of Thrones", priority: 130, patterns: [/\bgame of thrones\b/i, /\bjon snow\b/i, /\bdaenerys\b/i, /\bwesteros\b/i] },
  { id: "avengers", label: "Avengers", priority: 135, patterns: [/\bavengers?\b/i, /\bthanos\b/i, /\binfinity stones?\b/i] },
  { id: "dc", label: "DC", priority: 140, patterns: [/\bdc comics\b/i, /\bbatman\b/i, /\bsuperman\b/i, /\bjustice league\b/i, /\bthe joker\b/i] },
  { id: "star-wars", label: "Star Wars", priority: 150, patterns: [/\bstar wars\b/i, /\bdarth\b/i, /\banakin\b/i, /\byoda\b/i, /\bpalpatine\b/i, /\bpadm[eé]\b/i, /\bwindu\b/i, /\bgrievous\b/i, /\b66\b/i, /\bjedi\b/i, /\bsith\b/i, /\bluke(?:\s+skywalker)?\b/i, /\bobi[ -]?wan\b/i, /\bkenobi\b/i, /\bqui[ -]?gon\b/i, /\bleia\b/i, /\bmandalor(?:ian)?\b/i] },
  { id: OTHER_CATEGORY_ID, label: "Uncategorized Full Movies", priority: 1000, patterns: [] },
  { id: OTHER_SHOWS_CATEGORY_ID, label: "Uncategorized Shows", priority: 1010, patterns: [] },
];

export const getCategoryLabel = (id: string) => CATEGORY_RULES.find((rule) => rule.id === id)?.label ?? id;
