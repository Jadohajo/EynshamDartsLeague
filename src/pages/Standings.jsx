import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, CheckCircle, Clock, Save } from "lucide-react";
import { deriveSinglesTeamStats, deriveDoublesTeamStats, deriveCaptainsTeamStats } from "@/lib/statsHelpers";

export default function Standings() {
  const [divisions, setDivisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiv, setSelectedDiv] = useState("all");
  const [pendingOverrides, setPendingOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState([]);

  async function load() {
    const [d, t, f, o] = await Promise.all([
      base44.entities.Division.list(),
      base44.entities.Team.list(),
      base44.entities.Fixture.list("-date", 500),
      base44.entities.PositionOverride.list(),
    ]);
    setDivisions(d);
    setTeams(t);
    setFixtures(f);
    setOverrides(o);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const pendingFixtures = useMemo(() =>
    fixtures.filter(f => f.status === "completed" && f.approval_status !== "approved"),
    [fixtures]
  );

  const approvedFixtures = useMemo(() =>
    fixtures.filter(f => f.approval_status === "approved"),
    [fixtures]
  );

  const singlesStats = useMemo(() => deriveSinglesTeamStats(approvedFixtures, teams), [approvedFixtures, teams]);
  const doublesStats = useMemo(() => deriveDoublesTeamStats(approvedFixtures, teams), [approvedFixtures, teams]);
  const captainsStats = useMemo(() => deriveCaptainsTeamStats(approvedFixtures, teams), [approvedFixtures, teams]);

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "TBD";
  const getDivName = (id) => divisions.find(d => d.id === id)?.name || "—";

  function applyOverrides(rows, leagueType) {
    const overrideMap = {};
    overrides.forEach(o => {
      if (o.league_type === leagueType) overrideMap[o.team_id] = o.manual_position;
    });
    // Merge pending unsaved overrides
    Object.entries(pendingOverrides).forEach(([key, val]) => {
      const [type, teamId] = key.split("|");
      if (type === leagueType) overrideMap[teamId] = val;
    });
    const withOverrides = rows.map((r, i) => ({
      ...r,
      displayPos: overrideMap[r.id] ?? (i + 1),
    }));
    return withOverrides.sort((a, b) => a.displayPos - b.displayPos);
  }

  function setOverrideVal(leagueType, teamId, val) {
    setPendingOverrides(prev => ({ ...prev, [`${leagueType}|${teamId}`]: Number(val) }));
  }

  async function saveOverrides() {
    setSaving(true);
    for (const [key, position] of Object.entries(pendingOverrides)) {
      const [league_type, team_id] = key.split("|");
      const existing = overrides.find(o => o.team_id === team_id && o.league_type === league_type);
      const team = teams.find(t => t.id === team_id);
      if (!team) continue;
      if (existing) {
        await base44.entities.PositionOverride.update(existing.id, { manual_position: position });
      } else {
        await base44.entities.PositionOverride.create({
          division_id: team.division_id,
          team_id,
          league_type,
          manual_position: position,
        });
      }
    }
    setPendingOverrides({});
    await load();
    setSaving(false);
  }

  async function approveSelected() {
    setApproving(true);
    await Promise.all(
      selectedForApproval.map(id => base44.entities.Fixture.update(id, { approval_status: "approved" }))
    );
    setSelectedForApproval([]);
    await load();
    setApproving(false);
  }

  async function approveAll() {
    setApproving(true);
    await Promise.all(
      pendingFixtures.map(f => base44.entities.Fixture.update(f.id, { approval_status: "approved" }))
    );
    await load();
    setApproving(false);
  }

  const filteredDivisions = selectedDiv === "all" ? divisions : divisions.filter(d => d.id === selectedDiv);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const hasPendingOverrides = Object.keys(pendingOverrides).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Standings Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve results and manage league positions</p>
      </div>

      {/* Pending Results Approval */}
      {pendingFixtures.length > 0 && (
        <Card className="border-secondary/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                Pending Approval ({pendingFixtures.length})
              </CardTitle>
              <div className="flex gap-2">
                {selectedForApproval.length > 0 && (
                  <Button size="sm" variant="outline" onClick={approveSelected} disabled={approving}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve Selected ({selectedForApproval.length})
                  </Button>
                )}
                <Button size="sm" onClick={approveAll} disabled={approving}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {approving ? "Approving..." : "Approve All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingFixtures.map(f => {
                const homeTotalWins = (f.home_singles_wins||0)+(f.home_doubles_wins||0)+(f.home_captains_win||0);
                const awayTotalWins = (f.away_singles_wins||0)+(f.away_doubles_wins||0)+(f.away_captains_win||0);
                const isSelected = selectedForApproval.includes(f.id);
                return (
                  <div key={f.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    onClick={() => setSelectedForApproval(prev =>
                      prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id]
                    )}
                  >
                    <input type="checkbox" checked={isSelected} readOnly className="rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {getTeamName(f.home_team_id)} <span className="font-heading font-bold">{homeTotalWins}–{awayTotalWins}</span> {getTeamName(f.away_team_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">{getDivName(f.division_id)} · {f.date}</p>
                    </div>
                    <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full font-medium">Pending</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingFixtures.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <CheckCircle className="h-4 w-4 text-green-500" />
          All completed results have been approved.
        </div>
      )}

      {/* Division filter */}
      {divisions.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button variant={selectedDiv === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedDiv("all")}>All Divisions</Button>
          {divisions.map(d => (
            <Button key={d.id} variant={selectedDiv === d.id ? "default" : "outline"} size="sm" onClick={() => setSelectedDiv(d.id)}>
              {d.name}
            </Button>
          ))}
        </div>
      )}

      {/* Standings with position override */}
      {[
        { title: "Singles League", type: "singles", data: singlesStats },
        { title: "Doubles League", type: "doubles", data: doublesStats },
        { title: "Captain's Singles League", type: "captains", data: captainsStats, getCaptain: true },
      ].map(({ title, type, data, getCaptain }) => {
        const rows = filteredDivisions.flatMap(div =>
          applyOverrides(data.filter(t => t.division_id === div.id), type)
        );
        return (
          <Card key={type}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-secondary" />
                  {title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Set position # to override ranking</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2.5 font-heading text-xs text-left w-10">Pos</th>
                      <th className="px-3 py-2.5 font-heading text-xs text-left">Name</th>
                      <th className="px-3 py-2.5 font-heading text-xs text-center">P</th>
                      <th className="px-3 py-2.5 font-heading text-xs text-center">W</th>
                      <th className="px-3 py-2.5 font-heading text-xs text-center">L</th>
                      <th className="px-3 py-2.5 font-heading text-xs text-center">LD</th>
                      <th className="px-3 py-2.5 font-heading text-xs text-center w-24">Override #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-6 text-muted-foreground text-sm">No approved results yet</td></tr>
                    ) : rows.map((t) => {
                      const overrideKey = `${type}|${t.id}`;
                      const hasOverride = overrides.find(o => o.team_id === t.id && o.league_type === type);
                      const displayName = getCaptain ? (teams.find(tm => tm.id === t.id)?.captain || t.name) : t.name;
                      return (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-3 py-2 font-heading font-bold text-muted-foreground">
                            {hasOverride && !pendingOverrides[overrideKey] ? (
                              <span className="text-secondary">{t.displayPos}</span>
                            ) : pendingOverrides[overrideKey] ? (
                              <span className="text-secondary">{pendingOverrides[overrideKey]}</span>
                            ) : t.displayPos}
                          </td>
                          <td className="px-3 py-2 font-medium">{displayName}</td>
                          <td className="px-3 py-2 text-center">{t.played}</td>
                          <td className="px-3 py-2 text-center text-green-600 font-medium">{t.won}</td>
                          <td className="px-3 py-2 text-center text-red-500">{t.lost}</td>
                          <td className={`px-3 py-2 text-center font-bold ${(t.legs_for-t.legs_against)>=0?"text-green-600":"text-red-500"}`}>
                            {t.legs_for-t.legs_against>0?"+":""}{t.legs_for-t.legs_against}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={1}
                              placeholder="Auto"
                              value={pendingOverrides[overrideKey] ?? (hasOverride?.manual_position ?? "")}
                              onChange={e => setOverrideVal(type, t.id, e.target.value)}
                              className="h-7 text-xs w-20"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {hasPendingOverrides && (
        <div className="flex justify-end">
          <Button onClick={saveOverrides} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Position Overrides"}
          </Button>
        </div>
      )}
    </div>
  );
}