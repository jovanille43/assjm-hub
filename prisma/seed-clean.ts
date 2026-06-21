/**
 * Seed « départ propre » — pour passer de la démo à la vraie vie du club.
 *
 *   npm run db:clean
 *
 * Vide TOUTES les données de démonstration (faux joueurs, matchs, posts,
 * actus, votes, convocations…) et ne conserve que :
 *   • les 5 équipes du club (vides, prêtes à recevoir les vrais joueurs)
 *   • le catalogue des 15 badges (attribués au mérite par le moteur)
 *   • un compte administrateur : admin@assjm.fr / assjm2026
 *
 * Ensuite : connexion en admin → Back-office → « Effectif & stats »
 * → « Ajouter un joueur » pour saisir le vrai effectif.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🧹 Suppression de toutes les données de démonstration...");
  // Ordre enfants -> parents
  await db.pushSubscription.deleteMany();
  await db.playerRating.deleteMany();
  await db.matchAward.deleteMany();
  await db.notification.deleteMany();
  await db.prediction.deleteMany();
  await db.duel.deleteMany();
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
  await db.message.deleteMany();
  await db.channel.deleteMany();
  await db.teamStaff.deleteMany();
  await db.player.deleteMany();
  await db.team.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  console.log("👤 Compte administrateur...");
  const password = bcrypt.hashSync("assjm2026", 10);
  await db.user.create({
    data: {
      email: "admin@assjm.fr",
      name: "Comité ASSJM",
      role: "ADMIN",
      hashedPassword: password,
    },
  });

  console.log("⚽ Équipes (vides, prêtes pour le vrai effectif)...");
  await db.team.createMany({
    data: [
      { name: "Séniors A", slug: "seniors-a", category: "SENIOR_A", description: "Le fer de lance du club.", color: "#E11D2A" },
      { name: "Séniors B", slug: "seniors-b", category: "SENIOR_B", description: "L'équipe réserve, vivier de talents." },
      { name: "U15", slug: "u15", category: "U15", description: "Nos jeunes pousses pleines d'avenir." },
      { name: "Vétérans", slug: "veterans", category: "VETERAN", description: "L'expérience et la convivialité avant tout." },
      { name: "École de foot", slug: "ecole-de-foot", category: "U11", description: "Là où tout commence, dans la joie et le jeu." },
    ],
  });

  console.log("🎖️ Catalogue des badges (attribution au mérite)...");
  await db.badge.createMany({
    data: [
      // COMMON
      { key: "nouveau_membre", name: "Nouveau membre", description: "Bienvenue dans la famille ASSJM ! Compte créé avec succès.", icon: "🌟", rarity: "COMMON" },
      { key: "ame_vestiaire", name: "Âme du vestiaire", description: "10 contributions dans la vie du club (posts, commentaires, messages).", icon: "💬", rarity: "COMMON" },
      { key: "fan_fidele", name: "Fan fidèle", description: "10 likes donnés dans le fil du club.", icon: "👍", rarity: "COMMON" },
      { key: "premier_but", name: "Premier but", description: "Marquer son premier but de la saison avec l'ASSJM.", icon: "⚽", rarity: "COMMON" },
      // RARE
      { key: "buteur", name: "Buteur", description: "5 buts marqués en compétition officielle.", icon: "🎯", rarity: "RARE" },
      { key: "passeur", name: "Passeur décisif", description: "5 passes décisives délivrées en saison.", icon: "🅰️", rarity: "RARE" },
      { key: "present", name: "Toujours là !", description: "Répondre présent à 3 convocations.", icon: "✅", rarity: "RARE" },
      { key: "en_feu", name: "En feu !", description: "Marquer 2 buts dans un même match.", icon: "🔥", rarity: "RARE" },
      { key: "le_mur", name: "Le Mur", description: "Défenseur ou gardien : disputer 3 matchs.", icon: "🧱", rarity: "RARE" },
      // EPIC
      { key: "capitaine", name: "Capitaine virtuel", description: "Être désigné homme du match (MVP).", icon: "👑", rarity: "EPIC" },
      { key: "joueur_mois", name: "Joueur du mois", description: "Recevoir 3 votes « Joueur du mois » de la communauté.", icon: "🏅", rarity: "EPIC" },
      { key: "lion", name: "Le Lion", description: "10 présences confirmées en match.", icon: "🦁", rarity: "EPIC" },
      { key: "hat_trick", name: "Triplé de légende", description: "Marquer 3 buts dans un même match.", icon: "🎩", rarity: "EPIC" },
      // LEGENDARY
      { key: "all_star", name: "All-Star ASSJM", description: "Toutes les stats de ta carte au-dessus de 80.", icon: "⭐", rarity: "LEGENDARY" },
      { key: "legende_club", name: "Légende du club", description: "100 matchs disputés sous les couleurs de l'ASSJM.", icon: "🏆", rarity: "LEGENDARY" },
    ],
  });

  console.log("\n✅ Base prête pour la vraie saison !");
  console.log("   • Connexion : admin@assjm.fr / assjm2026 (change le mot de passe !)");
  console.log("   • Back-office → « Effectif & stats » → Ajouter un joueur");
  console.log("   • Les membres créent leur compte sur /inscription");
}

main()
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
