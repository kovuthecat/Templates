# 2026-09-12 — Une seule voie d'orchestration ; hooks testés avant publication ; `.git` hors synchro

## Décision

1. **La voie headless (`claude -p`) est retirée** de `/orchestrer-plan` — sous-agent devient la
   **seule** voie, quel que soit `Env.` de l'index. L'orchestrateur tourne en Sonnet `high` : les
   sous-agents héritent de l'effort ambiant, ce que le headless ne faisait que dupliquer pour
   survivre à une fenêtre fermée — au prix d'incidents d'outillage (allowlist, trust dialog, refus
   d'`Edit`, classificateur de sortie). Repli pastille hors Desktop : inchangé.
2. **`tests/tester-hooks.mjs`** (racine du dépôt, jamais vendoré) rejoue les quatre hooks sur des
   dépôts git jetables. `publier.mjs` refuse de publier — `--dry-run` compris — si ce test échoue.
3. **`.git` sous un dossier synchronisé** (Synology Drive, OneDrive, Dropbox, iCloud) : le hook
   `SessionStart` le signale tant que le témoin `.git/info/synchro-exclue` n'existe pas ;
   `/nouveau-projet` et `/migrer-projet` posent la question et le témoin à l'instanciation.
4. **N1 en session orchestrée** : `/verif-visuelle` ne retente `navigate` vers `localhost` qu'une
   fois — refusé → mode B, ligne relayée par l'orchestrateur. Le mot `pastille` sur la ligne « en
   clair » d'une session force le repli pastille même en Desktop, pour un N1 structurant.

## Contexte

Seize incidents remontés depuis le 2026-08-30 par quatre projets : allowlist headless incomplète
avant même `pytest` (Chords, `2026-09-09-headless-permissions-allow-sans-pytest.md`) ; `.git`
corrompu par une reprise de synchro en écriture (torrent-uploader,
`2026-09-11-git-corrompu-synology-drive.md`) ; N1 refusé en sous-agent orchestré, deux fois
(torrent-uploader, `2026-09-10/11-navigation-localhost-refusee*.md`). L'orchestrateur tourne en
Sonnet `high` depuis la 0.25.0/0.25.1 : la seule raison du headless (régler un effort différent par
session) avait déjà disparu. **Alternative écartée** : corriger l'allowlist plutôt que retirer la
voie — l'incident couvre l'outillage entier (trust dialog, refus d'outil, sortie non lisible), pas
une seule case à réparer.

## Ce qui change

`orchestrer-plan` (Étapes 2-6), `WORKFLOW.md` §3/§5b/§9a/§9b, `nouveau-plan`, `fin-de-tache`,
`migrer-projet`, `nouveau-projet`, `choisir-mecanisme`, `maj-workflow`, `verif-visuelle`,
`project-settings.json`, `hooks/sessionstart-contexte.mjs`, `bin/publier.mjs`, nouveau
`tests/tester-hooks.mjs`.

## Ce qui ne change pas, et comment réintroduire une voie headless

L'historique (`CHANGELOG.md`, décisions passées) cite `claude -p` tel quel ; le repli pastille et la
mécanique de vague/verrou (`WORKFLOW.md` §4b) sont inchangés. Si l'effort par session redevient
nécessaire un jour : rouvrir cette décision plutôt que la rétablir en silence — l'outillage qui la
rendait fiable (allowlist, sonde, classificateur) n'existe plus.
