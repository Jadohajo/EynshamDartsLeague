import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Trash2, Shuffle } from "lucide-react";
import BulkScheduler from "../components/BulkScheduler";
import ScoreEntry from "../components/ScoreEntry";

export default function Fixtures() {
  const [divisions, setDivisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [scoreFixture, setScoreFixture] = useState(null);
  const [filterDiv, setFilterDiv] = useState("all");
  const [form, setForm] = useState({ division_id: "", home_team_id: "", away_team_id: "", date: "", week_number: 1 });
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [d, t, f, p] = await Promise.all([
      base44.entities.Division.list(),
      base44.entities.Team.list(),
      base44.entities.Fixture.list("-date", 100),
      base44.entities.Player.list(),
    ]);
    setDivisions(d);
    setTeams(t);
    setFixtures(f);
    setPlayers(p);
    setLoading(false);
  }

  async function handleCreate() {
    await base44.entities.Fixture.create({
      ...form,
      status: "scheduled",
      home_singles_wins: 0, away_singles_wins: 0,
      home_doubles_wins: 0, away_doubles_wins: 0,
      home_captains_win: 0, away_captains_win: 0,
      home_total_legs: 0, away_total_legs: 0,
    });
    setForm({ division_id: "", home_team_id: "", away_team_id: "", date: "", week_number: 1 });
    setCreateOpen(false);
    loadData();
  }

  async function handleDelete(id) {
    await base44.entities.Fixture.delete(id);
    loadData();
  }

  const getTeamName = (id) => teams.find((t) => t.id === id)?.name || "TBD";
  const getDivName = (id) => divisions.find((d) => d.id === id)?.name || "—";
  const divTeams = form.division_id ? teams.filter((t) => t.division_id === form.division_id) : [];

  const filtered = filterDiv === "all" ? fixtures : fixtures.filter((f) => f.division_id === filterDiv);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Fixtures</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and record match results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setBulkOpen(true)} disabled={teams.length < 2}>
            <Shuffle className="h-4 w-4" /> Bulk Schedule
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={teams.length < 2}>
              <Plus className="h-4 w-4" /> New Fixture
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wide">Create Fixture</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Division</Label>
                <Select value={form.division_id} onValueChange={(v) => setForm({ ...form, division_id: v, home_team_id: "", away_team_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Home Team</Label>
                  <Select value={form.home_team_id} onValueChange={(v) => setForm({ ...form, home_team_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Home" /></SelectTrigger>
                    <SelectContent>
                      {divTeams.filter((t) => t.id !== form.away_team_id).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Away Team</Label>
                  <Select value={form.away_team_id} onValueChange={(v) => setForm({ ...form, away_team_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Away" /></SelectTrigger>
                    <SelectContent>
                      {divTeams.filter((t) => t.id !== form.home_team_id).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>Week Number</Label>
                  <Input type="number" min={1} value={form.week_number} onChange={(e) => setForm({ ...form, week_number: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!form.division_id || !form.home_team_id || !form.away_team_id || !form.date} className="w-full">
                Create Fixture
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {divisions.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button variant={filterDiv === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterDiv("all")}>All</Button>
          {divisions.map((d) => (
            <Button key={d.id} variant={filterDiv === d.id ? "default" : "outline"} size="sm" onClick={() => setFilterDiv(d.id)}>
              {d.name}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No fixtures yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const homeTotalWins = (f.home_singles_wins || 0) + (f.home_doubles_wins || 0) + (f.home_captains_win || 0);
            const awayTotalWins = (f.away_singles_wins || 0) + (f.away_doubles_wins || 0) + (f.away_captains_win || 0);
            return (
              <Card key={f.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getDivName(f.division_id)}</span>
                        <span>·</span>
                        <span>Week {f.week_number || "—"}</span>
                        <span>·</span>
                        <span>{f.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          f.status === "completed" ? "bg-primary/10 text-primary" :
                          f.status === "in_progress" ? "bg-secondary/20 text-secondary-foreground" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {f.status === "completed" ? "Final" : f.status === "in_progress" ? "Live" : "Scheduled"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-heading font-bold uppercase tracking-wide">{getTeamName(f.home_team_id)}</p>
                        <p className="text-xs text-muted-foreground">Home</p>
                      </div>
                      <div className="text-center px-6">
                        {f.status !== "scheduled" ? (
                          <p className="font-heading text-2xl font-bold">{homeTotalWins} — {awayTotalWins}</p>
                        ) : (
                          <p className="font-heading text-lg text-muted-foreground">vs</p>
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-heading font-bold uppercase tracking-wide">{getTeamName(f.away_team_id)}</p>
                        <p className="text-xs text-muted-foreground">Away</p>
                      </div>
                    </div>

                    {f.status === "completed" && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-muted-foreground">Singles</p>
                          <p className="font-bold">{f.home_singles_wins || 0} — {f.away_singles_wins || 0}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-muted-foreground">Doubles</p>
                          <p className="font-bold">{f.home_doubles_wins || 0} — {f.away_doubles_wins || 0}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-muted-foreground">Captain's</p>
                          <p className="font-bold">{f.home_captains_win || 0} — {f.away_captains_win || 0}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 justify-end">
                      {f.status !== "completed" && (
                        <Button variant="outline" size="sm" onClick={() => setScoreFixture(f)}>
                          Enter Result
                        </Button>
                      )}
                      {f.status === "completed" && (
                        <Button variant="outline" size="sm" onClick={() => setScoreFixture(f)}>
                          Edit Result
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {scoreFixture && (
        <ScoreEntry
          fixture={scoreFixture}
          homeTeamName={getTeamName(scoreFixture.home_team_id)}
          awayTeamName={getTeamName(scoreFixture.away_team_id)}
          homePlayers={players.filter(p => p.team_id === scoreFixture.home_team_id)}
          awayPlayers={players.filter(p => p.team_id === scoreFixture.away_team_id)}
          onClose={() => setScoreFixture(null)}
          onSave={() => { setScoreFixture(null); loadData(); }}
        />
      )}

      <BulkScheduler
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        divisions={divisions}
        teams={teams}
        onScheduled={loadData}
      />
    </div>
  );
}