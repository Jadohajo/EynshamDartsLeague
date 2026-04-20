import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trophy, Star, TrendingUp, Users, Crosshair, ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import { deriveTeamStats, deriveSinglesTeamStats, deriveDoublesTeamStats, deriveCaptainsTeamStats, derive180sLeaderboard, deriveCheckoutLeaderboard, derivePlayerStats, derivePlayerRankings } from "@/lib/statsHelpers";
import { Link } from "react-router-dom";

const TABS = ["Standings", "Player Stats", "Player Rankings", "Team Stats", "180s", "Checkouts"];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function getDayOfWeek(date) { return (date.getDay() + 6) % 7; }

export default function PublicDashboard() {
  const [divisions, setDivisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Standings");
  const [rankingDivision, setRankingDivision] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Division.list(),
      base44.entities.Team.list(),
      base44.entities.Fixture.list(),
      base44.entities.Player.list(),
    ]).then(([divs, t, f, p]) => {
      setDivisions(divs);
      setTeams(t);
      setFixtures(f);
      setPlayers(p);
      if (divs.length) { setSelectedDivision(divs[0].id); setRankingDivision(divs[0].id); }
      setLoading(false);
    });
  }, []);

  const divisionTeamIds = useMemo(() => {
    if (!selectedDivision) return null;
    return new Set(teams.filter(t => t.division_id === selectedDivision).map(t => t.id));
  }, [teams, selectedDivision]);

  const filteredFixtures = useMemo(() => {
    if (!selectedDivision) return fixtures;
    return fixtures.filter(f => f.division_id === selectedDivision);
  }, [fixtures, selectedDivision]);

  const approvedFixtures = useMemo(() => filteredFixtures.filter(f => f.approval_status === "approved"), [filteredFixtures]);
  const teamStats = useMemo(() => deriveTeamStats(approvedFixtures, teams), [approvedFixtures, teams]);
  const singlesStats = useMemo(() => deriveSinglesTeamStats(approvedFixtures, teams), [approvedFixtures, teams]);
  const doublesStats = useMemo(() => deriveDoublesTeamStats(approvedFixtures, teams), [approvedFixtures, teams]);
  const captainsStats = useMemo(() => deriveCaptainsTeamStats(approvedFixtures, teams), [approvedFixtures, teams]);
  const playerStats = useMemo(() => derivePlayerStats(approvedFixtures), [approvedFixtures]);
  const allPlayerRankings = useMemo(() => derivePlayerRankings(fixtures.filter(f => f.approval_status === 'approved'), players, teams), [fixtures, players, teams]);
  const playerRankings = useMemo(() => rankingDivision ? allPlayerRankings.filter(p => p.division_id === rankingDivision) : allPlayerRankings, [allPlayerRankings, rankingDivision]);
  const leaderboard180 = useMemo(() => derive180sLeaderboard(approvedFixtures), [approvedFixtures]);
  const checkoutLeaderboard = useMemo(() => deriveCheckoutLeaderboard(approvedFixtures), [approvedFixtures]);

  const fixturesByDate = useMemo(() => {
    const map = {};
    fixtures.forEach(f => {
      if (!f.date) return;
      if (!map[f.date]) map[f.date] = [];
      map[f.date].push(f);
    });
    return map;
  }, [fixtures]);

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const offset = getDayOfWeek(first);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const selectedFixtures = selectedDate ? (fixturesByDate[selectedDate] || []) : [];
  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "TBD";
  const getDivName = (id) => divisions.find(d => d.id === id)?.name || "—";

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementPopup />
      {/* Header */}
      <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69d802d487fdb2f65d24198e/2add1838e_ceb4cd67-33f4-4f7d-af3a-4d884fa9f231.jpeg" alt="EDDL Logo" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <h1 className="font-heading text-sm font-bold tracking-widest uppercase text-sidebar-foreground">Eynsham &amp; District Darts League</h1>
              <p className="text-xs text-sidebar-foreground/50 font-heading tracking-wider uppercase">Season 2025/26</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
          <Link to="/rules" className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            Rules & Info
          </Link>
          <Link to="/admin" className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            Admin →
          </Link>
          </div>
          </div>
          </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Fixture Calendar Banner */}
        <button onClick={() => setCalendarOpen(o => !o)} className="w-full text-left">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-primary/20">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-base uppercase tracking-wide group-hover:text-primary transition-colors">Fixture Calendar</p>
                  <p className="text-xs text-muted-foreground">{fixtures.filter(f => f.status !== "completed").length} upcoming · {fixtures.filter(f => f.status === "completed").length} played</p>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${calendarOpen ? "rotate-90" : ""}`} />
            </CardContent>
          </Card>
        </button>

        {calendarOpen && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <button onClick={e => { e.stopPropagation(); prevMonth(); }} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
                    <CardTitle className="font-heading uppercase tracking-wide text-base">{MONTHS[viewMonth]} {viewYear}</CardTitle>
                    <button onClick={e => { e.stopPropagation(); nextMonth(); }} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(d => (
                      <div key={d} className="text-center text-xs font-heading font-bold uppercase text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={`empty-${i}`} />;
                      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                      const count = fixturesByDate[dateStr]?.length || 0;
                      const hasFixtures = count > 0;
                      const isSelected = selectedDate === dateStr;
                      const isToday = dateStr === now.toISOString().slice(0, 10);
                      return (
                        <button key={dateStr} onClick={e => { e.stopPropagation(); setSelectedDate(isSelected ? null : dateStr); }}
                          className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors
                            ${isSelected ? "bg-primary text-primary-foreground" :
                              hasFixtures ? "bg-primary/10 hover:bg-primary/20 text-primary" :
                              isToday ? "border-2 border-primary" : "hover:bg-muted"}`}
                        >
                          <span>{day}</span>
                          {hasFixtures && <span className="text-[9px] font-bold leading-none mt-0.5">{count}g</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/15 inline-block" /> Fixture</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary inline-block" /> Selected</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                    <CalIcon className="h-4 w-4" />
                    {selectedDate ? `Matchday — ${selectedDate}` : "Select a Date"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground">Click a highlighted date to see fixtures.</p>
                  ) : selectedFixtures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No fixtures on this date.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedFixtures.map(f => {
                        const hw = (f.home_singles_wins||0)+(f.home_doubles_wins||0)+(f.home_captains_win||0);
                        const aw = (f.away_singles_wins||0)+(f.away_doubles_wins||0)+(f.away_captains_win||0);
                        return (
                          <div key={f.id} className="rounded-lg border border-border p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{getDivName(f.division_id)}</span>
                              <span className={`px-2 py-0.5 rounded-full font-medium ${f.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{f.status === "completed" ? "Final" : "Scheduled"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-heading font-bold text-sm flex-1 truncate">{getTeamName(f.home_team_id)}</span>
                              <span className="font-heading font-bold text-base shrink-0">{f.status !== "scheduled" ? `${hw} – ${aw}` : "vs"}</span>
                              <span className="font-heading font-bold text-sm flex-1 text-right truncate">{getTeamName(f.away_team_id)}</span>
                            </div>
                            {f.status === "completed" && (
                              <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                                <div className="bg-muted/50 rounded p-1"><p className="text-muted-foreground">Singles</p><p className="font-bold">{f.home_singles_wins||0}–{f.away_singles_wins||0}</p></div>
                                <div className="bg-muted/50 rounded p-1"><p className="text-muted-foreground">Doubles</p><p className="font-bold">{f.home_doubles_wins||0}–{f.away_doubles_wins||0}</p></div>
                                <div className="bg-muted/50 rounded p-1"><p className="text-muted-foreground">Captain's</p><p className="font-bold">{f.home_captains_win||0}–{f.away_captains_win||0}</p></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="font-heading uppercase tracking-wide text-sm">All Fixtures</CardTitle></CardHeader>
              <CardContent className="p-0">
                {fixtures.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No fixtures scheduled.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {[...fixtures].sort((a, b) => (a.date||"").localeCompare(b.date||"")).map(f => {
                      const hw = (f.home_singles_wins||0)+(f.home_doubles_wins||0)+(f.home_captains_win||0);
                      const aw = (f.away_singles_wins||0)+(f.away_doubles_wins||0)+(f.away_captains_win||0);
                      return (
                        <div key={f.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 shrink-0">
                            <div className="text-xs text-muted-foreground whitespace-nowrap w-24">{f.date}</div>
                            <div className="text-xs text-muted-foreground hidden sm:block">{getDivName(f.division_id)}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-1 justify-center min-w-0 px-2">
                            <span className="font-medium text-sm truncate text-right flex-1">{getTeamName(f.home_team_id)}</span>
                            <span className="font-heading font-bold text-sm shrink-0 w-16 text-center">{f.status !== "scheduled" ? `${hw}–${aw}` : "vs"}</span>
                            <span className="font-medium text-sm truncate flex-1">{getTeamName(f.away_team_id)}</span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${f.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{f.status === "completed" ? "Final" : "Sched."}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Fixtures Played", value: fixtures.filter(f => f.status === "completed").length, icon: Crosshair, tab: "Player Rankings" },
            { label: "Divisions", value: divisions.length, icon: Trophy, tab: "Standings" },
            { label: "Teams", value: teams.length, icon: Users, tab: "Team Stats" },
            { label: "Top 180", value: leaderboard180[0]?.total ?? "–", icon: Star, tab: "180s" },
          ].map(s => (
            <button key={s.label} onClick={() => setActiveTab(s.tab)} className="text-left w-full">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-heading font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {/* Division Filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedDivision(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedDivision === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>All Divisions</button>
          {divisions.map(d => (
            <button key={d.id} onClick={() => setSelectedDivision(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDivision === d.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>{d.name}</button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Standings */}
        {activeTab === "Standings" && (
          <div className="space-y-6">
            {[{ title: "Singles League", subtitle: "Ranked by wins then leg difference · max 4 wins per fixture", data: singlesStats, getName: t => t.name },
              { title: "Doubles League", subtitle: "Ranked by wins then leg difference · max 2 wins per fixture", data: doublesStats, getName: t => t.name },
              { title: "Captain's Singles League", subtitle: "Ranked by wins then leg difference · max 1 win per fixture", data: captainsStats, getName: t => { const team = teams.find(tm => tm.id === t.id); return team?.captain || team?.name || t.name; } },
            ].map(({ title, subtitle, data, getName }) => {
              const rows = selectedDivision ? data.filter(t => t.division_id === selectedDivision) : data;
              return (
                <Card key={title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading uppercase tracking-wide text-sm">{title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            {["#","Name","Played","Won","Lost","Legs F","Legs A","Leg Diff"].map(h => (
                              <th key={h} className="px-3 py-2.5 font-heading uppercase tracking-wide text-xs text-left first:pl-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-6 text-muted-foreground text-sm">No results yet</td></tr>
                          ) : rows.map((t, i) => (
                            <tr key={t.id} className={`border-b border-border/50 ${ i === 0 ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                              <td className="px-4 py-2.5 text-muted-foreground font-heading">{i + 1}</td>
                              <td className="px-3 py-2.5 font-medium">{getName(t)}</td>
                              <td className="px-3 py-2.5 text-center">{t.played}</td>
                              <td className="px-3 py-2.5 text-center text-green-600 font-medium">{t.won}</td>
                              <td className="px-3 py-2.5 text-center text-red-500">{t.lost}</td>
                              <td className="px-3 py-2.5 text-center">{t.legs_for}</td>
                              <td className="px-3 py-2.5 text-center">{t.legs_against}</td>
                              <td className={`px-3 py-2.5 text-center font-heading font-bold text-base ${t.legs_for - t.legs_against >= 0 ? "text-green-600" : "text-red-500"}`}>{t.legs_for - t.legs_against > 0 ? "+" : ""}{t.legs_for - t.legs_against}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Player Stats */}
        {activeTab === "Player Stats" && (
          <Card>
            <CardHeader><CardTitle className="font-heading uppercase tracking-wide text-sm">Player Statistics — Singles &amp; Doubles</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Player","Type","P","W","L","Legs F","Legs A","180s","Best CO"].map(h => (
                        <th key={h} className="px-3 py-3 font-heading uppercase tracking-wide text-xs text-left first:pl-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.filter(p => p.types.some(t => t === "singles" || t === "doubles")).length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">No player data yet</td></tr>
                    ) : playerStats.filter(p => p.types.some(t => t === "singles" || t === "doubles")).map((p, i) => (
                       <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                         <td className="px-4 py-2.5 font-medium">{p.name}</td>
                         <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.types.filter(t => t !== "captains").join(", ")}</td>
                        <td className="px-3 py-2.5 text-center">{p.played}</td>
                        <td className="px-3 py-2.5 text-center text-green-600 font-medium">{p.won}</td>
                        <td className="px-3 py-2.5 text-center text-red-500">{p.lost}</td>
                        <td className="px-3 py-2.5 text-center">{p.legs_for}</td>
                        <td className="px-3 py-2.5 text-center">{p.legs_against}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-secondary">{p.s180s}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-primary">{p.best_checkout || "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Rankings */}
        {activeTab === "Player Rankings" && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setRankingDivision(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  rankingDivision === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}>All Divisions</button>
              {divisions.map(d => (
                <button key={d.id} onClick={() => setRankingDivision(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    rankingDivision === d.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}>{d.name}</button>
              ))}
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading uppercase tracking-wide text-sm">Player Rankings</CardTitle>
                <p className="text-xs text-muted-foreground">100 pts per singles win · 50 pts per doubles win</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {["#","Player","Team","Played","Singles W","Doubles W","Points"].map(h => (
                          <th key={h} className="px-3 py-2.5 font-heading uppercase tracking-wide text-xs text-left first:pl-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {playerRankings.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No ranking data yet</td></tr>
                      ) : playerRankings.map((p, i) => (
                        <tr key={p.id} className={`border-b border-border/50 ${i === 0 ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                          <td className="px-4 py-2.5 font-heading font-bold text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium">{p.name}</td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.team_name}</td>
                          <td className="px-3 py-2.5 text-center">{p.played}</td>
                          <td className="px-3 py-2.5 text-center text-green-600 font-medium">{p.singles_wins}</td>
                          <td className="px-3 py-2.5 text-center text-green-600 font-medium">{p.doubles_wins}</td>
                          <td className="px-3 py-2.5 font-heading font-bold text-base text-primary">{p.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Stats */}
        {activeTab === "Team Stats" && (
          <Card>
            <CardHeader><CardTitle className="font-heading uppercase tracking-wide text-sm">Team Statistics</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Team","Division","P","W","L","Legs F","Legs A"].map(h => (
                        <th key={h} className="px-3 py-3 font-heading uppercase tracking-wide text-xs text-left first:pl-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamStats.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No team data yet</td></tr>
                    ) : teamStats.map((t, i) => {
                      const div = divisions.find(d => d.id === t.division_id);
                      return (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-medium">{t.name}</td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{div?.name ?? "–"}</td>
                          <td className="px-3 py-2.5 text-center">{t.played}</td>
                          <td className="px-3 py-2.5 text-center text-green-600 font-medium">{t.won}</td>
                          <td className="px-3 py-2.5 text-center text-red-500">{t.lost}</td>
                          <td className="px-3 py-2.5 text-center">{t.legs_for}</td>
                          <td className="px-3 py-2.5 text-center">{t.legs_against}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 180s Leaderboard */}
        {activeTab === "180s" && (
          <Card>
            <CardHeader><CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2"><Star className="h-4 w-4 text-secondary" />180s Leaderboard</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 font-heading uppercase tracking-wide text-xs text-left">#</th>
                      <th className="px-4 py-3 font-heading uppercase tracking-wide text-xs text-left">Player</th>
                      <th className="px-4 py-3 font-heading uppercase tracking-wide text-xs text-center">Total 180s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard180.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-muted-foreground text-sm">No 180s recorded yet</td></tr>
                    ) : leaderboard180.map((p, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i === 0 ? "bg-secondary/10" : "hover:bg-muted/30"}`}>
                        <td className="px-4 py-3 font-heading font-bold text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-center font-heading font-bold text-xl text-secondary">{p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkout Leaderboard */}
        {activeTab === "Checkouts" && (
          <Card>
            <CardHeader><CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Highest Checkouts</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 font-heading uppercase tracking-wide text-xs text-left">#</th>
                      <th className="px-4 py-3 font-heading uppercase tracking-wide text-xs text-left">Player</th>
                      <th className="px-4 py-3 font-heading uppercase tracking-wide text-xs text-center">Highest Checkout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutLeaderboard.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-muted-foreground text-sm">No checkouts recorded yet</td></tr>
                    ) : checkoutLeaderboard.map((p, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i === 0 ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                        <td className="px-4 py-3 font-heading font-bold text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-center font-heading font-bold text-xl text-primary">{p.checkout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}