import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Calendar, Trophy, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({ divisions: 0, teams: 0, players: 0, fixtures: 0 });
  const [recentFixtures, setRecentFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [divisions, teamsList, players, fixtures] = await Promise.all([
        base44.entities.Division.list(),
        base44.entities.Team.list(),
        base44.entities.Player.list(),
        base44.entities.Fixture.list("-date", 5),
      ]);
      setStats({
        divisions: divisions.length,
        teams: teamsList.length,
        players: players.length,
        fixtures: fixtures.length,
      });
      setTeams(teamsList);
      setRecentFixtures(fixtures);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const getTeamName = (id) => teams.find((t) => t.id === id)?.name || "TBD";

  const statCards = [
    { label: "Divisions", value: stats.divisions, icon: Shield, link: "/admin/divisions" },
    { label: "Teams", value: stats.teams, icon: Users, link: "/admin/teams" },
    { label: "Players", value: stats.players, icon: Target, link: "/admin/teams" },
    { label: "Fixtures", value: stats.fixtures, icon: Calendar, link: "/admin/fixtures" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight uppercase">
          Eynsham District Darts League
        </h1>
        <p className="text-muted-foreground mt-1">Season 2025/26 Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} to={s.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-heading font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg uppercase tracking-wide">Recent Fixtures</CardTitle>
        </CardHeader>
        <CardContent>
          {recentFixtures.length === 0 ? (
            <p className="text-muted-foreground text-sm">No fixtures scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {recentFixtures.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {getTeamName(f.home_team_id)} <span className="text-muted-foreground mx-2">vs</span> {getTeamName(f.away_team_id)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.date}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    f.status === "completed" ? "bg-primary/10 text-primary" :
                    f.status === "in_progress" ? "bg-secondary/20 text-secondary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {f.status === "completed" ? "Completed" : f.status === "in_progress" ? "In Progress" : "Scheduled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <h3 className="font-heading text-lg uppercase tracking-wide mb-2">Match Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-heading font-bold uppercase tracking-wide">Singles</p>
              <p className="text-primary-foreground/80 mt-1">4 matches · Best of 5 legs</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-heading font-bold uppercase tracking-wide">Doubles</p>
              <p className="text-primary-foreground/80 mt-1">2 matches · Best of 3 legs</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-heading font-bold uppercase tracking-wide">Captain's Singles</p>
              <p className="text-primary-foreground/80 mt-1">1 match · Best of 3 legs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}