import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function startOfMonth(year, month) { return new Date(year, month, 1); }
function getDayOfWeek(date) { return (date.getDay() + 6) % 7; } // 0=Mon

export default function Calendar() {
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    Promise.all([
      base44.entities.Fixture.list("-date", 500),
      base44.entities.Team.list(),
      base44.entities.Division.list(),
    ]).then(([f, t, d]) => {
      setFixtures(f);
      setTeams(t);
      setDivisions(d);
      setLoading(false);
    });
  }, []);

  const fixturesByDate = useMemo(() => {
    const map = {};
    fixtures.forEach(f => {
      if (!f.date) return;
      if (!map[f.date]) map[f.date] = [];
      map[f.date].push(f);
    });
    return map;
  }, [fixtures]);

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

  const calendarDays = useMemo(() => {
    const first = startOfMonth(viewYear, viewMonth);
    const offset = getDayOfWeek(first);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const selectedFixtures = selectedDate ? (fixturesByDate[selectedDate] || []) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Fixture Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">Full season schedule</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="font-heading uppercase tracking-wide text-base">
                {MONTHS[viewMonth]} {viewYear}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
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
                const hasFixtures = !!fixturesByDate[dateStr]?.length;
                const count = fixturesByDate[dateStr]?.length || 0;
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === now.toISOString().slice(0, 10);
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors
                      ${isSelected ? "bg-primary text-primary-foreground" :
                        hasFixtures ? "bg-primary/10 hover:bg-primary/20 text-primary" :
                        isToday ? "border-2 border-primary" :
                        "hover:bg-muted"}`}
                  >
                    <span>{day}</span>
                    {hasFixtures && !isSelected && (
                      <span className="text-[9px] font-bold leading-none mt-0.5">{count} game{count > 1 ? "s" : ""}</span>
                    )}
                    {hasFixtures && isSelected && (
                      <span className="text-[9px] font-bold leading-none mt-0.5">{count} game{count > 1 ? "s" : ""}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary/15 inline-block" /> Fixture scheduled</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary inline-block" /> Selected</span>
            </div>
          </CardContent>
        </Card>

        {/* Matchday panel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
              <CalIcon className="h-4 w-4" />
              {selectedDate ? `Matchday — ${selectedDate}` : "Select a Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">Click a highlighted date on the calendar to see the day's fixtures.</p>
            ) : selectedFixtures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fixtures on this date.</p>
            ) : (
              <div className="space-y-3">
                {selectedFixtures.map(f => {
                  const homeTotalWins = (f.home_singles_wins||0)+(f.home_doubles_wins||0)+(f.home_captains_win||0);
                  const awayTotalWins = (f.away_singles_wins||0)+(f.away_doubles_wins||0)+(f.away_captains_win||0);
                  return (
                    <div key={f.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{getDivName(f.division_id)}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          f.status === "completed" ? "bg-primary/10 text-primary" :
                          f.status === "in_progress" ? "bg-secondary/20 text-secondary-foreground" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {f.status === "completed" ? "Final" : f.status === "in_progress" ? "Live" : "Scheduled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-bold text-sm flex-1 truncate">{getTeamName(f.home_team_id)}</span>
                        <span className="font-heading font-bold text-base shrink-0">
                          {f.status !== "scheduled" ? `${homeTotalWins} – ${awayTotalWins}` : "vs"}
                        </span>
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

      {/* Full fixture list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading uppercase tracking-wide text-sm">All Fixtures</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fixtures.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No fixtures scheduled.</p>
          ) : (
            <div className="divide-y divide-border">
              {[...fixtures].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(f => {
                const homeTotalWins = (f.home_singles_wins||0)+(f.home_doubles_wins||0)+(f.home_captains_win||0);
                const awayTotalWins = (f.away_singles_wins||0)+(f.away_doubles_wins||0)+(f.away_captains_win||0);
                return (
                  <div key={f.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0 w-24">{f.date}</div>
                      <div className="text-xs text-muted-foreground shrink-0">{getDivName(f.division_id)}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-center min-w-0 px-2">
                      <span className="font-medium text-sm truncate text-right flex-1">{getTeamName(f.home_team_id)}</span>
                      <span className="font-heading font-bold text-sm shrink-0 w-16 text-center">
                        {f.status !== "scheduled" ? `${homeTotalWins}–${awayTotalWins}` : "vs"}
                      </span>
                      <span className="font-medium text-sm truncate flex-1">{getTeamName(f.away_team_id)}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      f.status === "completed" ? "bg-primary/10 text-primary" :
                      f.status === "in_progress" ? "bg-secondary/20 text-secondary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {f.status === "completed" ? "Final" : f.status === "in_progress" ? "Live" : "Sched."}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}