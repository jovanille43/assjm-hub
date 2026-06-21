import { PrismaClient, type Player } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DAY = 86_400_000;
const now = Date.now();
// Date à J+n, avec une heure de coup d'envoi réaliste (15h00 par défaut).
const dPlus = (n: number) => {
  const d = new Date(now + n * DAY);
  d.setHours(15, 0, 0, 0);
  return d;
};

async function main() {
  console.log("🌱 Nettoyage de la base...");
  // Ordre enfants -> parents
  await db.userBadge.deleteMany();
  await db.badge.deleteMany();
  await db.like.deleteMany();
  await db.comment.deleteMany();
  await db.post.deleteMany();
  await db.vote.deleteMany();
  await db.convocation.deleteMany();
  await db.matchStat.deleteMany();
  await db.match.deleteMany();
  await db.event.deleteMany();
  await db.galleryItem.deleteMany();
  await db.album.deleteMany();
  await db.standing.deleteMany();
  await db.sponsor.deleteMany();
  await db.newsArticle.deleteMany();
  await db.teamStaff.deleteMany();
  await db.player.deleteMany();
  await db.team.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  const password = bcrypt.hashSync("assjm2026", 10);

  console.log("👤 Utilisateurs...");
  const admin = await db.user.create({
    data: { email: "admin@assjm.fr", name: "Comité ASSJM", role: "ADMIN", hashedPassword: password, points: 0 },
  });
  const coach = await db.user.create({
    data: { email: "coach@assjm.fr", name: "Sébastien Faure", role: "COACH", hashedPassword: password, points: 320 },
  });
  await db.user.create({
    data: { email: "dirigeant@assjm.fr", name: "Marie Chambon", role: "DIRIGEANT", hashedPassword: password, points: 180 },
  });
  const parent = await db.user.create({
    data: { email: "parent@assjm.fr", name: "Nathalie Roche", role: "PARENT", hashedPassword: password },
  });
  const supporter = await db.user.create({
    data: { email: "supporter@assjm.fr", name: "Julien Mounier", role: "SUPPORTER", hashedPassword: password, points: 75 },
  });
  const joueurUser1 = await db.user.create({
    data: { email: "leo@assjm.fr", name: "Léo Berger", role: "JOUEUR", hashedPassword: password, points: 540, pronoBoosts: 2 },
  });
  const joueurUser2 = await db.user.create({
    data: { email: "hugo@assjm.fr", name: "Hugo Vialette", role: "JOUEUR", hashedPassword: password, points: 460 },
  });

  console.log("⚽ Équipes...");
  const seniorsA = await db.team.create({
    data: { name: "Séniors A", slug: "seniors-a", category: "SENIOR_A", description: "Le fer de lance du club, en Départemental 3 (District Haute-Loire).", color: "#E11D2A" },
  });
  const seniorsB = await db.team.create({
    data: { name: "Séniors B", slug: "seniors-b", category: "SENIOR_B", description: "L'équipe réserve, vivier de talents." },
  });
  const u15 = await db.team.create({
    data: { name: "U15", slug: "u15", category: "U15", description: "Nos jeunes pousses pleines d'avenir." },
  });
  const veterans = await db.team.create({
    data: { name: "Vétérans", slug: "veterans", category: "VETERAN", description: "L'expérience et la convivialité avant tout." },
  });
  const ecole = await db.team.create({
    data: { name: "École de foot", slug: "ecole-de-foot", category: "U11", description: "Là où tout commence, dans la joie et le jeu." },
  });

  console.log("🧑‍🏫 Staff...");
  await db.teamStaff.createMany({
    data: [
      { teamId: seniorsA.id, name: "Sébastien Faure", role: "COACH" },
      { teamId: seniorsA.id, name: "Karim Belaïd", role: "ADJOINT" },
      { teamId: u15.id, name: "Thomas Granjon", role: "COACH" },
      { teamId: veterans.id, name: "Patrick Dumas", role: "COACH" },
    ],
  });

  console.log("🏃 Joueurs...");
  type P = {
    firstName: string; lastName: string; position: string; number: number;
    pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number;
    userId?: string; upgradeLevel?: number;
  };
  const roster: P[] = [
    { firstName: "Maxime", lastName: "Pélissier", position: "GK", number: 1, pace: 58, shooting: 40, passing: 62, dribbling: 50, defending: 78, physical: 76 },
    { firstName: "Léo", lastName: "Berger", position: "DEF", number: 4, pace: 74, shooting: 55, passing: 72, dribbling: 66, defending: 84, physical: 80, userId: joueurUser1.id, upgradeLevel: 1 },
    { firstName: "Antoine", lastName: "Reynaud", position: "DEF", number: 5, pace: 70, shooting: 48, passing: 70, dribbling: 60, defending: 85, physical: 82 },
    { firstName: "Romain", lastName: "Chovet", position: "DEF", number: 2, pace: 80, shooting: 52, passing: 73, dribbling: 70, defending: 79, physical: 74 },
    { firstName: "Kévin", lastName: "Masson", position: "DEF", number: 3, pace: 76, shooting: 50, passing: 71, dribbling: 64, defending: 81, physical: 78 },
    { firstName: "Hugo", lastName: "Vialette", position: "MID", number: 8, pace: 78, shooting: 74, passing: 84, dribbling: 82, defending: 66, physical: 72, userId: joueurUser2.id },
    { firstName: "Lucas", lastName: "Granger", position: "MID", number: 6, pace: 72, shooting: 66, passing: 82, dribbling: 76, defending: 74, physical: 75 },
    { firstName: "Mathéo", lastName: "Sauvignet", position: "MID", number: 10, pace: 82, shooting: 80, passing: 86, dribbling: 87, defending: 58, physical: 68 },
    { firstName: "Théo", lastName: "Brunel", position: "MID", number: 7, pace: 85, shooting: 72, passing: 78, dribbling: 83, defending: 60, physical: 70 },
    { firstName: "Nathan", lastName: "Chapelle", position: "FWD", number: 9, pace: 86, shooting: 86, passing: 70, dribbling: 82, defending: 42, physical: 78 },
    { firstName: "Enzo", lastName: "Marchand", position: "FWD", number: 11, pace: 88, shooting: 82, passing: 72, dribbling: 85, defending: 40, physical: 70 },
    { firstName: "Dylan", lastName: "Forest", position: "FWD", number: 17, pace: 84, shooting: 80, passing: 68, dribbling: 80, defending: 44, physical: 74 },
    { firstName: "Quentin", lastName: "Delorme", position: "MID", number: 14, pace: 75, shooting: 64, passing: 79, dribbling: 74, defending: 70, physical: 73 },
    { firstName: "Bastien", lastName: "Royet", position: "DEF", number: 15, pace: 71, shooting: 46, passing: 68, dribbling: 58, defending: 80, physical: 81 },
    { firstName: "Adrien", lastName: "Coste", position: "GK", number: 16, pace: 55, shooting: 38, passing: 60, dribbling: 48, defending: 75, physical: 74 },
    { firstName: "Yanis", lastName: "Faye", position: "FWD", number: 19, pace: 87, shooting: 78, passing: 66, dribbling: 81, defending: 38, physical: 69 },
  ];

  const players: Player[] = [];
  for (const p of roster) {
    players.push(
      await db.player.create({
        data: {
          firstName: p.firstName,
          lastName: p.lastName,
          position: p.position,
          number: p.number,
          teamId: seniorsA.id,
          userId: p.userId,
          pace: p.pace,
          shooting: p.shooting,
          passing: p.passing,
          dribbling: p.dribbling,
          defending: p.defending,
          physical: p.physical,
          upgradeLevel: p.upgradeLevel ?? 0,
        },
      }),
    );
  }
  // Quelques joueurs dans d'autres équipes (pour les effectifs)
  await db.player.createMany({
    data: [
      { firstName: "Tom", lastName: "Rivière", position: "MID", number: 8, teamId: u15.id },
      { firstName: "Noah", lastName: "Allard", position: "FWD", number: 9, teamId: u15.id },
      { firstName: "Gérard", lastName: "Pradier", position: "DEF", number: 5, teamId: veterans.id },
      { firstName: "Christophe", lastName: "Bernard", position: "FWD", number: 11, teamId: veterans.id },
    ],
  });

  const byName = (last: string) => players.find((p) => p.lastName === last)!;

  console.log("📅 Matchs & résultats...");
  // Matchs terminés (avec stats) — les stats nourrissent le moteur de badges :
  // Chapelle réalise un triplé (hat_trick), Vialette totalise 5 passes (passeur),
  // Berger marque son premier but et dispute tous les matchs (le_mur).
  const finished = [
    { opp: "FC Monistrol", venue: "HOME", sf: 3, sa: 1, d: -7, scorers: [["Chapelle", 1], ["Sauvignet", 1], ["Berger", 1]] as [string, number][], assists: ["Vialette", "Brunel"] },
    { opp: "AS Aurec", venue: "AWAY", sf: 2, sa: 2, d: -14, scorers: [["Marchand", 1], ["Chapelle", 1]] as [string, number][], assists: ["Sauvignet", "Vialette"] },
    { opp: "Olympique Bas-en-Basset", venue: "HOME", sf: 4, sa: 0, d: -21, scorers: [["Chapelle", 3], ["Marchand", 1]] as [string, number][], assists: ["Vialette", "Brunel", "Sauvignet"] },
    { opp: "Sucs et Lignon", venue: "AWAY", sf: 1, sa: 2, d: -28, scorers: [["Sauvignet", 1]] as [string, number][], assists: ["Vialette"] },
    { opp: "Velay FC", venue: "HOME", sf: 2, sa: 1, d: -35, scorers: [["Marchand", 1], ["Forest", 1]] as [string, number][], assists: ["Granger", "Vialette"] },
  ];

  // Ossature présente à chaque match (minutes jouées sans but ni passe)
  const CORE_LINEUP = ["Pélissier", "Berger", "Reynaud", "Chovet", "Masson", "Granger", "Delorme"];

  for (const f of finished) {
    const goalScorers = new Map<string, number>();
    f.scorers.forEach(([n, g]) => goalScorers.set(n, g));
    const assisters = new Map<string, number>();
    f.assists.forEach((n) => assisters.set(n, (assisters.get(n) ?? 0) + 1));

    const involved = new Set<string>([
      ...goalScorers.keys(),
      ...assisters.keys(),
      ...CORE_LINEUP,
    ]);
    const statsData = [...involved].map((last) => {
      const player = byName(last);
      const goals = goalScorers.get(last) ?? 0;
      return {
        playerId: player.id,
        goals,
        assists: assisters.get(last) ?? 0,
        minutes: 90,
        rating: 6.5 + goals * 0.8,
        isMvp: goals >= 2,
      };
    });

    const match = await db.match.create({
      data: {
        teamId: seniorsA.id,
        opponent: f.opp,
        venue: f.venue,
        scoreFor: f.sf,
        scoreAgainst: f.sa,
        status: "FINISHED",
        competition: "Départemental 3 · District Haute-Loire",
        date: dPlus(f.d),
        location: f.venue === "HOME" ? "Stade municipal de St-Just-Malmont" : `Stade de ${f.opp}`,
        stats: { create: statsData },
      },
    });

    // Convocations honorées sur les matchs joués → badges de présence
    await db.convocation.createMany({
      data: statsData.map((s) => ({
        matchId: match.id,
        playerId: s.playerId,
        status: "ACCEPTED",
        respondedAt: new Date(match.date.getTime() - 2 * DAY),
      })),
    });
  }

  // Matchs à venir
  const nextMatch = await db.match.create({
    data: {
      teamId: seniorsA.id,
      opponent: "US Pont-Salomon",
      venue: "HOME",
      status: "SCHEDULED",
      competition: "Départemental 3 · District Haute-Loire",
      date: dPlus(9),
      location: "Stade municipal de St-Just-Malmont",
    },
  });
  await db.match.create({
    data: { teamId: seniorsA.id, opponent: "FC Dunières", venue: "AWAY", status: "SCHEDULED", competition: "Départemental 3 · District Haute-Loire", date: dPlus(16) },
  });
  await db.match.create({
    data: { teamId: u15.id, opponent: "Tournoi de fin de saison", venue: "HOME", status: "SCHEDULED", competition: "Tournoi", date: dPlus(23) },
  });

  console.log("✅ Convocations...");
  for (const player of players.slice(0, 14)) {
    const i = players.indexOf(player);
    await db.convocation.create({
      data: {
        matchId: nextMatch.id,
        playerId: player.id,
        status: i < 11 ? "ACCEPTED" : i < 13 ? "PENDING" : "DECLINED",
        reason: i >= 13 ? "Blessé" : undefined,
        respondedAt: i < 11 ? new Date() : undefined,
      },
    });
  }

  console.log("🗓️ Événements...");
  await db.event.createMany({
    data: [
      { type: "TRAINING", title: "Entraînement Séniors", start: dPlus(2), location: "Stade municipal", teamId: seniorsA.id },
      { type: "TRAINING", title: "Entraînement Séniors", start: dPlus(4), location: "Stade municipal", teamId: seniorsA.id },
      { type: "MATCH", title: "ASSJM vs US Pont-Salomon", start: dPlus(9), location: "Stade municipal", teamId: seniorsA.id },
      { type: "MEETING", title: "Réunion des dirigeants", start: dPlus(6), location: "Club house" },
      { type: "EVENT", title: "Soirée de fin de saison 🎉", start: dPlus(30), location: "Salle des fêtes" },
    ],
  });

  console.log("🏆 Classement (vraie poule D3, résultats à renseigner par le staff)...");
  // Poule réelle du club en Départemental 3 (District Haute-Loire). Les chiffres
  // sont à 0 : la référence à jour reste le classement officiel FFF (lien in-app).
  const standings: { teamName: string; ours?: boolean }[] = [
    { teamName: "AS Aurec" },
    { teamName: "Bas-en-Basset" },
    { teamName: "Les Villettes" },
    { teamName: "Retournac-Beauzac (B)" },
    { teamName: "Riotord" },
    { teamName: "AS Saint-Just-Malmont", ours: true },
    { teamName: "Saint-Ferréol-d'Auroure" },
    { teamName: "Sainte-Sigolène (B)" },
    { teamName: "Saint-Victor-Malescours" },
    { teamName: "Sucs et Lignon (C)" },
    { teamName: "US2MR (B)" },
  ];
  let rank = 1;
  for (const s of standings) {
    await db.standing.create({
      data: {
        competition: "Départemental 3 · District Haute-Loire",
        teamName: s.teamName,
        teamId: s.ours ? seniorsA.id : undefined,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0,
        points: 0,
        rank: rank++,
        isOurClub: !!s.ours,
      },
    });
  }

  console.log("📰 Actualités...");
  await db.newsArticle.createMany({
    data: [
      { slug: "victoire-eclatante-contre-bas-en-basset", title: "Victoire éclatante 4-0 contre Bas-en-Basset", excerpt: "Nos Séniors A déroulent à domicile et confirment leur place sur le podium.", content: "Une démonstration collective devant un public conquis...", category: "RÉSULTAT", authorName: "Comité ASSJM", publishedAt: dPlus(-20) },
      { slug: "reprise-des-entrainements", title: "La reprise approche : toutes les infos", excerpt: "Dates, horaires et nouveautés pour la saison qui arrive. Préparez vos crampons !", content: "Le club vous donne rendez-vous...", category: "CLUB", authorName: "Comité ASSJM", publishedAt: dPlus(-9) },
      { slug: "soiree-de-fin-de-saison", title: "Soirée de fin de saison : on vous attend !", excerpt: "Repas, remise des trophées et ambiance garantie pour clôturer une belle année.", content: "Rendez-vous à la salle des fêtes...", category: "ÉVÉNEMENT", authorName: "Marie Chambon", publishedAt: dPlus(-3) },
      { slug: "nos-u15-en-finale", title: "Nos U15 se qualifient pour la finale du tournoi", excerpt: "Une génération prometteuse qui fait la fierté de l'école de foot.", content: "Bravo aux jeunes...", category: "JEUNES", authorName: "Thomas Granjon", publishedAt: dPlus(-15) },
    ],
  });

  console.log("🤝 Sponsors...");
  await db.sponsor.createMany({
    data: [
      { name: "Boulangerie Chambon", tier: "GOLD", order: 1 },
      { name: "Garage Central", tier: "GOLD", order: 2 },
      { name: "Passementerie Vivante", tier: "PLATINUM", order: 0 },
      { name: "Café des Sports", tier: "SILVER", order: 3 },
      { name: "Intermarché St-Just", tier: "PLATINUM", order: 0 },
      { name: "Menuiserie Roche", tier: "SILVER", order: 4 },
      { name: "Pizza Malmont", tier: "PARTNER", order: 5 },
      { name: "Assurances Mounier", tier: "PARTNER", order: 6 },
    ],
  });

  console.log("📸 Galerie...");
  const album = await db.album.create({ data: { title: "Saison 2025-2026" } });
  await db.galleryItem.createMany({
    data: [
      { type: "PHOTO", caption: "Célébration après la victoire", albumId: album.id, url: "" },
      { type: "PHOTO", caption: "L'équipe Séniors A", albumId: album.id, url: "" },
      { type: "VIDEO", caption: "Le but de la semaine", albumId: album.id, url: "" },
      { type: "PHOTO", caption: "Ambiance au stade", albumId: album.id, url: "" },
      { type: "PHOTO", caption: "Nos U15 en action", albumId: album.id, url: "" },
      { type: "PHOTO", caption: "Troisième mi-temps", albumId: album.id, url: "" },
    ],
  });

  console.log("💬 Réseau social...");
  const post1 = await db.post.create({
    data: { authorId: coach.id, category: "RESULTAT", content: "Quelle performance des gars aujourd'hui ! 4-0, le travail paie. Fiers de vous 💪🔴🔵" },
  });
  await db.post.create({
    data: { authorId: joueurUser1.id, category: "MOMENT", content: "Merci aux supporters venus nombreux ce week-end, ça fait chaud au cœur ! 🙌" },
  });
  await db.comment.create({ data: { postId: post1.id, authorId: supporter.id, content: "Allez l'ASSJM ! 🔥" } });
  await db.comment.create({ data: { postId: post1.id, authorId: parent.id, content: "Bravo les garçons 👏" } });
  await db.like.createMany({
    data: [
      { postId: post1.id, userId: supporter.id },
      { postId: post1.id, userId: parent.id },
      { postId: post1.id, userId: joueurUser2.id },
    ],
  });

  console.log("🗳️ Votes...");
  // Hugo Vialette plébiscité Joueur du mois → badge joueur_mois via le moteur
  const vialette = byName("Vialette");
  await db.vote.createMany({
    data: [
      { userId: supporter.id, type: "PLAYER_OF_MONTH", targetId: vialette.id, period: "2026-06" },
      { userId: parent.id, type: "PLAYER_OF_MONTH", targetId: vialette.id, period: "2026-06" },
      { userId: admin.id, type: "PLAYER_OF_MONTH", targetId: vialette.id, period: "2026-06" },
    ],
  });

  console.log("🎖️ Badges (catalogue — attribués au mérite par src/lib/badges.ts)...");
  // Les descriptions reflètent exactement les règles du moteur (BADGE_RULES).
  // Aucun badge n'est pré-attribué : ils se débloquent à la première visite
  // du tableau de bord, selon les vraies stats de chacun.
  await Promise.all([
    // COMMON
    db.badge.create({ data: { key: "nouveau_membre", name: "Nouveau membre", description: "Bienvenue dans la famille ASSJM ! Compte créé avec succès.", icon: "🌟", rarity: "COMMON" } }),
    db.badge.create({ data: { key: "ame_vestiaire", name: "Âme du vestiaire", description: "10 contributions dans la vie du club (posts, commentaires, messages).", icon: "💬", rarity: "COMMON" } }),
    db.badge.create({ data: { key: "fan_fidele", name: "Fan fidèle", description: "10 likes donnés dans le fil du club.", icon: "👍", rarity: "COMMON" } }),
    db.badge.create({ data: { key: "premier_but", name: "Premier but", description: "Marquer son premier but de la saison avec l'ASSJM.", icon: "⚽", rarity: "COMMON" } }),
    // RARE
    db.badge.create({ data: { key: "buteur", name: "Buteur", description: "5 buts marqués en compétition officielle.", icon: "🎯", rarity: "RARE" } }),
    db.badge.create({ data: { key: "passeur", name: "Passeur décisif", description: "5 passes décisives délivrées en saison.", icon: "🅰️", rarity: "RARE" } }),
    db.badge.create({ data: { key: "present", name: "Toujours là !", description: "Répondre présent à 3 convocations.", icon: "✅", rarity: "RARE" } }),
    db.badge.create({ data: { key: "en_feu", name: "En feu !", description: "Marquer 2 buts dans un même match.", icon: "🔥", rarity: "RARE" } }),
    db.badge.create({ data: { key: "le_mur", name: "Le Mur", description: "Défenseur ou gardien : disputer 3 matchs.", icon: "🧱", rarity: "RARE" } }),
    // EPIC
    db.badge.create({ data: { key: "capitaine", name: "Capitaine virtuel", description: "Être désigné homme du match (MVP).", icon: "👑", rarity: "EPIC" } }),
    db.badge.create({ data: { key: "joueur_mois", name: "Joueur du mois", description: "Recevoir 3 votes « Joueur du mois » de la communauté.", icon: "🏅", rarity: "EPIC" } }),
    db.badge.create({ data: { key: "lion", name: "Le Lion", description: "10 présences confirmées en match.", icon: "🦁", rarity: "EPIC" } }),
    db.badge.create({ data: { key: "hat_trick", name: "Triplé de légende", description: "Marquer 3 buts dans un même match.", icon: "🎩", rarity: "EPIC" } }),
    // LEGENDARY
    db.badge.create({ data: { key: "all_star", name: "All-Star ASSJM", description: "Toutes les stats de ta carte au-dessus de 80.", icon: "⭐", rarity: "LEGENDARY" } }),
    db.badge.create({ data: { key: "legende_club", name: "Légende du club", description: "100 matchs disputés sous les couleurs de l'ASSJM.", icon: "🏆", rarity: "LEGENDARY" } }),
  ]);


  console.log("⚔️ Duel de pénaltys en attente...");
  // Hugo défie Léo : un défi en attente côté Léo (mise escrowée).
  await db.duel.create({
    data: {
      challengerId: joueurUser2.id,
      opponentId: joueurUser1.id,
      stake: 20,
      challengerShots: "0,5,2,3,4",
      challengerDives: "4,1,5,0,2",
      status: "PENDING",
    },
  });
  await db.user.update({ where: { id: joueurUser2.id }, data: { points: { decrement: 20 } } });

  console.log("🔔 Notifications de démo...");
  await db.notification.createMany({
    data: [
      { userId: joueurUser1.id, type: "DUEL", icon: "⚔️", title: "Nouveau défi de pénaltys !", body: "Hugo Vialette te défie (mise 20 pts).", link: "/dashboard/duels" },
      { userId: joueurUser1.id, type: "INFO", icon: "👋", title: "Bienvenue sur ASSJM HUB", body: "Découvre les jeux et fais évoluer ta carte FUT.", link: "/dashboard/jeux" },
    ],
  });

  console.log("\n✅ Seed terminé !");
  console.log("   Comptes de démo (mot de passe : assjm2026) :");
  console.log("   • admin@assjm.fr · coach@assjm.fr · leo@assjm.fr ...");
}

main()
  .catch((e) => {
    console.error("❌ Erreur de seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
