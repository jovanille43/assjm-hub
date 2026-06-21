import { Hero } from "@/components/home/hero";
import { FeaturesSection } from "@/components/home/features-section";
import { ClubIntro } from "@/components/home/club-intro";
import { NewsSection } from "@/components/home/news-section";
import { NextMatch } from "@/components/home/next-match";
import { ResultsSection } from "@/components/home/results-section";
import { StandingsSection } from "@/components/home/standings-section";
import { SponsorsSection } from "@/components/home/sponsors-section";
import { GallerySection } from "@/components/home/gallery-section";
import { ContactSection } from "@/components/home/contact-section";
import {
  getClubStats,
  getGallery,
  getLatestNews,
  getNextMatch,
  getRecentResults,
  getSponsors,
  getStandings,
  getTopScorers,
} from "@/lib/data";

// Données issues de la base à chaque requête.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, news, nextMatch, results, standings, sponsors, gallery, scorers] =
    await Promise.all([
      getClubStats(),
      getLatestNews(3),
      getNextMatch(),
      getRecentResults(5),
      getStandings(),
      getSponsors(),
      getGallery(6),
      getTopScorers(3),
    ]);

  const nextMatchInfo = nextMatch
    ? {
        opponent: nextMatch.opponent,
        dateISO: nextMatch.date.toISOString(),
        venue: nextMatch.venue,
        competition: nextMatch.competition,
        teamName: nextMatch.team.name,
      }
    : null;

  return (
    <>
      <Hero stats={stats} />
      <FeaturesSection />
      <ClubIntro />
      <NewsSection news={news} />
      <NextMatch match={nextMatchInfo} />
      <ResultsSection results={results} scorers={scorers} />
      <StandingsSection standings={standings} />
      <SponsorsSection sponsors={sponsors} />
      <GallerySection items={gallery} />
      <ContactSection />
    </>
  );
}
