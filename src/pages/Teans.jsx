import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, UserPlus, ChevronDown, ChevronUp, Crown, ArrowRightLeft, FolderInput } from "lucide-react";

export default function Teams() {
  const [divisions, setDivisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamOpen, setTeamOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: "", division_id: "", venue: "", captain: "" });
  const [playerForm, setPlayerForm] = useState({ name: "", team_id: "", is_captain: false });
  // Move team
  const [moveTeamOpen, setMoveTeamOpen] = useState(false);
  const [movingTeam, setMovingTeam] = useState(null);
  const [newDivisionId, setNewDivisionId] = useState("");
  // Transfer player
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferPlayer, setTransferPlayer] = useState(null);
  const [transferTargetTeam, setTransferTargetTeam] = useState("");
  const [transferError, setTransferError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [d, t, p, f] = await Promise.all([
      base44.entities.Division.list(),
      base44.entities.Team.list(),
      base44.entities.Player.list(),
      base44.entities.Fixture.list(),
    ]);
    setDivisions(d);
    setTeams(t);
    setPlayers(p);
    setFixtures(f);
    setLoading(false);
  }

  async function handleCreateTeam() {
    await base44.entities.Team.create(teamForm);
    setTeamForm({ name: "", division_id: "", venue: "", captain: "" });
    setTeamOpen(false);
    loadData();
  }

  async function handleCreatePlayer() {
    await base44.entities.Player.create(playerForm);
    setPlayerForm({ name: "", team_id: "", is_captain: false });
    setPlayerOpen(false);
    loadData();
  }

  async function handleDeleteTeam(id) {
    await base44.entities.Team.delete(id);
    loadData();
  }

  async function handleDeletePlayer(id) {
    await base44.entities.Player.delete(id);
    loadData();
  }

  async function handleMoveTeam() {
    await base44.entities.Team.update(movingTeam.id, { division_id: newDivisionId });
    setMoveTeamOpen(false);
    setMovingTeam(null);
    setNewDivisionId("");
    loadData();
  }

  function hasPlayerPlayed(player) {
    // Check if player name appears in any completed fixture for their current team
    return fixtures.some(f => {
      if (f.status !== "completed") return false;
      const allNames = [
        ...(f.singles_matches || []).flatMap(m => [m.home_player, m.away_player]),
        ...(f.doubles_matches || []).flatMap(m => [m.home_player1, m.home_player2, m.away_player1, m.away_player2]),
        f.captains_match?.home_player,
        f.captains_match?.away_player,
      ].filter(Boolean).map(n => n?.toLowerCase().trim());
      return allNames.includes(player.name.toLowerCase().trim());
    });
  }

  async function handleTransferPlayer() {
    if (hasPlayerPlayed(transferPlayer)) {
      setTransferError("This player has already played in a fixture this season and cannot be transferred.");
      return;
    }
    await base44.entities.Player.update(transferPlayer.id, { team_id: transferTargetTeam });
    setTransferOpen(false);
    setTransferPlayer(null);
    setTransferTargetTeam("");
    setTransferError("");
    loadData();
  }

  const getDivName = (id) => divisions.find((d) => d.id === id)?.name || "—";
  const getTeamPlayers = (teamId) => players.filter((p) => p.team_id === teamId);

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
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Teams & Players</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage teams and their rosters</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={teams.length === 0}>
                <UserPlus className="h-4 w-4" /> Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading uppercase tracking-wide">Add Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Player Name</Label>
                  <Input value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <Label>Team</Label>
                  <Select value={playerForm.team_id} onValueChange={(v) => setPlayerForm({ ...playerForm, team_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isCaptain" checked={playerForm.is_captain} onChange={(e) => setPlayerForm({ ...playerForm, is_captain: e.target.checked })} className="rounded" />
                  <Label htmlFor="isCaptain">Team Captain</Label>
                </div>
                <Button onClick={handleCreatePlayer} disabled={!playerForm.name || !playerForm.team_id} className="w-full">Add Player</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading uppercase tracking-wide">New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Team Name</Label>
                  <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="e.g. The Red Lion" />
                </div>
                <div>
                  <Label>Division</Label>
                  <Select value={teamForm.division_id} onValueChange={(v) => setTeamForm({ ...teamForm, division_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                    <SelectContent>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Home Venue</Label>
                  <Input value={teamForm.venue} onChange={(e) => setTeamForm({ ...teamForm, venue: e.target.value })} placeholder="e.g. The Red Lion, Eynsham" />
                </div>
                <Button onClick={handleCreateTeam} disabled={!teamForm.name || !teamForm.division_id} className="w-full">Create Team</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No teams yet. Create a division first, then add teams.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => {
            const teamPlayers = getTeamPlayers(team.id);
            const isExpanded = expandedTeam === team.id;
            return (
              <Card key={team.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold uppercase tracking-wide">{team.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">{getDivName(team.division_id)}</Badge>
                          {team.venue && <span>· {team.venue}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        teamPlayers.length >= 4 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      }`}>
                        {teamPlayers.length} player{teamPlayers.length !== 1 ? "s" : ""}
                        {teamPlayers.length < 4 && " (min 4)"}
                      </span>
                      <Button variant="ghost" size="icon" title="Move to different division" onClick={(e) => { e.stopPropagation(); setMovingTeam(team); setNewDivisionId(team.division_id); setMoveTeamOpen(true); }}>
                        <FolderInput className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4">
                      {teamPlayers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No players added yet.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {teamPlayers.map((p) => (
                            <div key={p.id} className="flex items-center justify-between py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{p.name}</span>
                                {p.is_captain && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Crown className="h-3 w-3" /> Captain
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Transfer player" onClick={() => { setTransferPlayer(p); setTransferTargetTeam(""); setTransferError(""); setTransferOpen(true); }}>
                                  <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePlayer(p.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Move Team Dialog */}
      <Dialog open={moveTeamOpen} onOpenChange={setMoveTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wide">Move Team to Division</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Moving: <strong>{movingTeam?.name}</strong></p>
            <div>
              <Label>New Division</Label>
              <Select value={newDivisionId} onValueChange={setNewDivisionId}>
                <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                <SelectContent>
                  {divisions.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.season})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMoveTeam} disabled={!newDivisionId || newDivisionId === movingTeam?.division_id} className="w-full">Move Team</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Player Dialog */}
      <Dialog open={transferOpen} onOpenChange={v => { setTransferOpen(v); setTransferError(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wide">Transfer Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Transferring: <strong>{transferPlayer?.name}</strong></p>
            {transferError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{transferError}</p>}
            <div>
              <Label>Transfer to Team</Label>
              <Select value={transferTargetTeam} onValueChange={setTransferTargetTeam}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.filter(t => t.id !== transferPlayer?.team_id).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({getDivName(t.division_id)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTransferPlayer} disabled={!transferTargetTeam} className="w-full">Confirm Transfer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}