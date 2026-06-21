export type QuizQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  category: "RÈGLES" | "HISTOIRE" | "CHAMPIONNATS" | "CLUB" | "ANECDOTE";
};

export const QUIZ_BANK: QuizQuestion[] = [
  // ── RÈGLES ──────────────────────────────────────────────────────────────
  {
    id: "r1",
    question: "Combien de joueurs composent une équipe sur le terrain ?",
    options: ["9", "10", "11", "12"],
    answer: 2,
    category: "RÈGLES",
  },
  {
    id: "r2",
    question: "À quelle distance du but se tire un penalty ?",
    options: ["9 mètres", "11 mètres", "13 mètres", "16,5 mètres"],
    answer: 1,
    category: "RÈGLES",
  },
  {
    id: "r3",
    question: "Combien de remplacements sont autorisés par équipe dans un match officiel (règle actuelle) ?",
    options: ["3", "4", "5", "6"],
    answer: 2,
    category: "RÈGLES",
  },
  {
    id: "r4",
    question: "Quelle est la durée réglementaire d'un match de football ?",
    options: ["80 minutes", "85 minutes", "90 minutes", "95 minutes"],
    answer: 2,
    category: "RÈGLES",
  },
  {
    id: "r5",
    question: "Combien de cartons jaunes entraînent une expulsion directe ?",
    options: ["1", "2", "3", "4"],
    answer: 1,
    category: "RÈGLES",
  },
  {
    id: "r6",
    question: "Que signifie l'acronyme « VAR » dans le football moderne ?",
    options: [
      "Validation Arbitrale Rapide",
      "Video Assistant Referee",
      "Vérification Automatique des Règles",
      "Vidéo Assistante Réclamation",
    ],
    answer: 1,
    category: "RÈGLES",
  },
  {
    id: "r7",
    question: "Combien de points vaut une victoire en championnat ?",
    options: ["1", "2", "3", "4"],
    answer: 2,
    category: "RÈGLES",
  },
  {
    id: "r8",
    question: "Quelle est la largeur réglementaire d'un but de football ?",
    options: ["6,32 m", "7,32 m", "8,32 m", "9,32 m"],
    answer: 1,
    category: "RÈGLES",
  },
  {
    id: "r9",
    question: "Quelle est la durée totale d'une prolongation (les deux mi-temps) ?",
    options: ["20 minutes", "25 minutes", "30 minutes", "40 minutes"],
    answer: 2,
    category: "RÈGLES",
  },
  {
    id: "r10",
    question: "Lors d'un corner, où est placé le ballon ?",
    options: [
      "Sur la ligne de touche",
      "Sur le point de penalty",
      "Dans l'arc de coin",
      "Au centre du terrain",
    ],
    answer: 2,
    category: "RÈGLES",
  },

  // ── HISTOIRE ─────────────────────────────────────────────────────────────
  {
    id: "h1",
    question: "Quel pays a remporté le plus de Coupes du Monde (5 titres) ?",
    options: ["Allemagne", "Italie", "Brésil", "Argentine"],
    answer: 2,
    category: "HISTOIRE",
  },
  {
    id: "h2",
    question: "En quelle année la France a-t-elle remporté sa première Coupe du Monde ?",
    options: ["1994", "1996", "1998", "2000"],
    answer: 2,
    category: "HISTOIRE",
  },
  {
    id: "h3",
    question: "Quel pays a remporté la Coupe du Monde 2022 au Qatar ?",
    options: ["France", "Brésil", "Croatie", "Argentine"],
    answer: 3,
    category: "HISTOIRE",
  },
  {
    id: "h4",
    question: "Qui est le meilleur buteur de l'histoire des Coupes du Monde (16 buts) ?",
    options: ["Ronaldo (Brésil)", "Gerd Müller", "Miroslav Klose", "Just Fontaine"],
    answer: 2,
    category: "HISTOIRE",
  },
  {
    id: "h5",
    question: "En quelle année a été fondée la FIFA ?",
    options: ["1900", "1904", "1908", "1912"],
    answer: 1,
    category: "HISTOIRE",
  },
  {
    id: "h6",
    question: "Combien de fois la France a-t-elle remporté la Coupe du Monde ?",
    options: ["1 fois", "2 fois", "3 fois", "4 fois"],
    answer: 1,
    category: "HISTOIRE",
  },
  {
    id: "h7",
    question: "Quel pays a accueilli la première Coupe du Monde de football en 1930 ?",
    options: ["France", "Italie", "Argentine", "Uruguay"],
    answer: 3,
    category: "HISTOIRE",
  },
  {
    id: "h8",
    question: "Quel pays a codifié les règles du football moderne en 1863 ?",
    options: ["France", "Espagne", "Angleterre", "Écosse"],
    answer: 2,
    category: "HISTOIRE",
  },

  // ── CHAMPIONNATS ─────────────────────────────────────────────────────────
  {
    id: "c1",
    question: "Quel club a remporté le plus de Ligues des Champions ?",
    options: ["FC Barcelone", "Bayern Munich", "AC Milan", "Real Madrid"],
    answer: 3,
    category: "CHAMPIONNATS",
  },
  {
    id: "c2",
    question: "En quelle année l'Olympique de Marseille a-t-il remporté la Ligue des Champions ?",
    options: ["1991", "1993", "1995", "1997"],
    answer: 1,
    category: "CHAMPIONNATS",
  },
  {
    id: "c3",
    question: "Qui détient le record du nombre de Ballons d'Or ?",
    options: ["Cristiano Ronaldo", "Lionel Messi", "Zinedine Zidane", "Ronaldinho"],
    answer: 1,
    category: "CHAMPIONNATS",
  },
  {
    id: "c4",
    question: "Quel est le stade du Paris Saint-Germain ?",
    options: ["Stade de France", "Parc des Princes", "Vélodrome", "Groupama Stadium"],
    answer: 1,
    category: "CHAMPIONNATS",
  },
  {
    id: "c5",
    question: "Quel club français a remporté 7 titres consécutifs de Ligue 1 (2002-2008) ?",
    options: ["PSG", "Marseille", "Lyon", "Monaco"],
    answer: 2,
    category: "CHAMPIONNATS",
  },
  {
    id: "c6",
    question: "Lors de quel Mondial a eu lieu la « main de Dieu » de Maradona ?",
    options: ["1982 (Espagne)", "1986 (Mexique)", "1990 (Italie)", "1994 (USA)"],
    answer: 1,
    category: "CHAMPIONNATS",
  },

  // ── CLUB ─────────────────────────────────────────────────────────────────
  {
    id: "cl1",
    question: "Dans quel département (numéro) se situe Saint-Just-Malmont ?",
    options: ["Loire (42)", "Haute-Loire (43)", "Puy-de-Dôme (63)", "Ardèche (07)"],
    answer: 1,
    category: "CLUB",
  },
  {
    id: "cl2",
    question: "Dans quelle région administrative se situe la Haute-Loire ?",
    options: ["Occitanie", "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Provence-Alpes-Côte d'Azur"],
    answer: 1,
    category: "CLUB",
  },
  {
    id: "cl3",
    question: "Avec quelle commune l'ASSJM forme-t-elle son entente sportive (ASSDJ) ?",
    options: ["Saint-Pal-de-Mons", "Bas-en-Basset", "Saint-Didier-en-Velay", "Montfaucon-en-Velay"],
    answer: 2,
    category: "CLUB",
  },
  {
    id: "cl4",
    question: "Dans quelle division évolue l'équipe première de l'ASSDJ ?",
    options: ["Régional 3", "Départemental 2", "Départemental 3", "Régional 1"],
    answer: 2,
    category: "CLUB",
  },
  {
    id: "cl5",
    question: "Quel district gère les compétitions de l'ASSDJ ?",
    options: ["District Puy-de-Dôme", "District Haute-Loire", "District Loire", "District Ardèche"],
    answer: 1,
    category: "CLUB",
  },

  // ── ANECDOTES ────────────────────────────────────────────────────────────
  {
    id: "a1",
    question: "Dans quel pays se trouve le célèbre stade Maracanã ?",
    options: ["Argentine", "Brésil", "Uruguay", "Chili"],
    answer: 1,
    category: "ANECDOTE",
  },
  {
    id: "a2",
    question: "Quel gardien est célèbre pour avoir inventé le « coup du scorpion » ?",
    options: ["Manuel Neuer", "Gianluigi Buffon", "René Higuita", "Oliver Kahn"],
    answer: 2,
    category: "ANECDOTE",
  },
  {
    id: "a3",
    question: "Quel joueur est surnommé « La Pulga » (La Puce) ?",
    options: ["Cristiano Ronaldo", "Neymar", "Lionel Messi", "Kylian Mbappé"],
    answer: 2,
    category: "ANECDOTE",
  },
  {
    id: "a4",
    question: "Quel joueur français a inscrit un doublé de la tête en finale du Mondial 1998 ?",
    options: ["Thierry Henry", "Zinedine Zidane", "Emmanuel Petit", "Laurent Blanc"],
    answer: 1,
    category: "ANECDOTE",
  },
  {
    id: "a5",
    question: "Quelle nation détient le record de buts dans un match officiel (149-0 en 2002) ?",
    options: ["Cameroun", "Nigeria", "Madagascar", "Tanzanie"],
    answer: 2,
    category: "ANECDOTE",
  },
];
