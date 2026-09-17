// Erreur simulée au format tsc, jamais une commande introuvable — l'anti-raccourci de S2/T3 exige
// que l'assertion porte sur le TEXTE extrait, pas seulement sur le code de sortie.
console.error('src/app.ts(3,5): error TS2345: Type mismatch');
process.exit(1);
