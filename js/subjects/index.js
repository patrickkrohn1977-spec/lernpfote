// Alle Fächer. Neues Fach: Datei anlegen (wie mathe.js) und hier eintragen.
import { mathe } from './mathe.js';

export const SUBJECTS = { mathe };

// Fächer, die später dazukommen (werden auf der Startseite als „bald“ angezeigt)
export const COMING = [
  { name: 'Deutsch', icon: '📖' },
  { name: 'Englisch', icon: '🇬🇧' },
  { name: 'Biologie', icon: '🌿' },
];

// Vorgegebene Tests: werden beim nächsten Öffnen der App automatisch eingetragen.
export const PRESET_TESTS = [
  { id: 'mathe-2026-11-26', subject: 'mathe', date: '2026-11-26', topics: ['binome', 'wahrscheinlichkeit'], note: 'Mathetest' },
];
