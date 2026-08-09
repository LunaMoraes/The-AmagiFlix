import { OTHER_CATEGORY_ID } from "./app";

export interface CategoryRule {
  id: string;
  label: string;
  priority: number;
  patterns: RegExp[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  { id: "naruto", label: "Naruto & Boruto", priority: 10, patterns: [/\bnaruto\b/i, /\bboruto\b/i, /\bsasuke\b/i, /\bitachi\b/i, /\bmadara\b/i, /\bkakashi\b/i, /\bakatsuki\b/i, /\bhokage\b/i, /\bminato\b/i, /\bkaguya\b/i, /\bsakura\b/i, /\bjiraiya\b/i, /\bhinata\b/i, /\bkurama\b/i, /\bkushina\b/i, /\buchiha\b/i, /\bshisui\b/i, /\bdanzo\b/i, /\bteam\s*7\b/i, /\bjinchuriki\b/i, /\bobito\b/i, /\byahiko\b/i, /\bhyuga\b/i, /\bkonoha\b/i] },
  { id: "avatar", label: "Avatar", priority: 20, patterns: [/\bavatar(?:\s*:\s*the last airbender)?\b/i, /\baang\b/i, /\bzuko\b/i, /\bazula\b/i, /\bkorra\b/i] },
  { id: "one-piece", label: "One Piece", priority: 30, patterns: [/\bone piece\b/i, /\bluffy\b/i, /\broronoa zoro\b/i, /\bstraw hats?\b/i] },
  { id: "dragon-ball", label: "Dragon Ball", priority: 40, patterns: [/\bdragon ball\b/i, /\bgoku\b/i, /\bvegeta\b/i, /\bfrieza\b/i] },
  { id: "my-hero-academia", label: "My Hero Academia", priority: 50, patterns: [/\bmy hero academia\b/i, /\bdeku\b/i, /\ball might\b/i, /\bbakugo\b/i] },
  { id: "demon-slayer", label: "Demon Slayer", priority: 60, patterns: [/\bdemon slayer\b/i, /\btanjiro\b/i, /\bnezuko\b/i, /\bhashira\b/i] },
  { id: "jujutsu-kaisen", label: "Jujutsu Kaisen", priority: 70, patterns: [/\bjujutsu kaisen\b/i, /\bsatoru gojo\b/i, /\bsukuna\b/i, /\byuji itadori\b/i] },
  { id: "attack-on-titan", label: "Attack on Titan", priority: 80, patterns: [/\battack on titan\b/i, /\beren yeager\b/i, /\bmikasa\b/i, /\blevi ackerman\b/i] },
  { id: "pokemon", label: "Pokémon", priority: 90, patterns: [/\bpok[eé]mon\b/i, /\bash ketchum\b/i, /\bpikachu\b/i] },
  { id: "bleach", label: "Bleach", priority: 100, patterns: [/\bbleach\b/i, /\bichigo\b/i, /\baizen\b/i] },
  { id: "invincible", label: "Invincible", priority: 110, patterns: [/\binvincible\b/i, /\bomni[ -]man\b/i, /\bmark grayson\b/i] },
  { id: "wizarding-world", label: "Wizarding World", priority: 120, patterns: [/\bharry potter\b/i, /\bhogwarts\b/i, /\bvoldemort\b/i, /\bdumbledore\b/i] },
  { id: "dc", label: "DC", priority: 140, patterns: [/\bdc comics\b/i, /\bbatman\b/i, /\bsuperman\b/i, /\bjustice league\b/i, /\bthe joker\b/i] },
  { id: "star-wars", label: "Star Wars", priority: 150, patterns: [/\bstar wars\b/i, /\bdarth vader\b/i, /\bjedi\b/i, /\bsith\b/i] },
  { id: OTHER_CATEGORY_ID, label: "Uncategorized Full Movies", priority: 1000, patterns: [] },
];

export const getCategoryLabel = (id: string) => CATEGORY_RULES.find((rule) => rule.id === id)?.label ?? id;
