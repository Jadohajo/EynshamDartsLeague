import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Shuffle, X, Plus } from "lucide-react";

function generateRoundRobin(teams) {
  const list = [...teams];
  if (list.length % 2 !== 0) list.push(null);
  const size = list.length;
  const fixed = list[0];
  const rotating = list.slice(1);
  const rounds = [];
  for (let r = 0; r < size - 1; r++) {
    const rot = r === 0 ? rotating : [
      ...rotating.slice(rotating.length - r),
      ...rotating.slice(0, rotating.length - r),
    ];
    const full = [fixed, ...rot];
    const round = [];
    for (let i = 0; i < size / 2; i++) {
      const home = full[i], away = full[size - 1 - i];
      if (home !== null && away !== null) round.push({ home, away });
    }
    rounds.push(round);
  }
  return rounds;
}

function buildSchedule(teams, timesPlayEachOther) {
  const baseRounds = generateRoundRobin(teams);
  const allRounds = [];
  for (let pass = 0; pass < timesPlayEachOther; pass++) {
    const flip = pass % 2 === 1;
    baseRounds.forEach(round => {
      allRounds.push(round.map(m => flip ? { home: m.away, away: m.home } : { ...m }));
    });
  }
  // Enforce no team home >2 in a row
  const lastHome = {};
  teams.forEach(t => lastHome[t.id] = 0);
  allRounds.forEach(round => {
    round.forEach(match => {
      if ((lastHome[match.home.id] || 0) >= 2) {
        const tmp = match.home; match.home = match.away; match.away = tmp;
      }
      lastHome[match.home.id] = (lastHome[match.home.id] || 0) + 1;
      lastHome[match.away.id] = 0;
    });
  });
  return allRounds;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Assign matchday dates starting from startDate, 1 week apart,
 * skipping any blackout dates. If a slot is blacked out, push to next non-blackout day.
 * Stops assigning if we exceed endDate.
 */
function assignMatchdayDates(totalRounds, startDate, endDate, blackoutSet) {
  const dates = [];
  let current = startDate;
  for (let i = 0; i < totalRounds; i++) {
    // Find next non-blackout date from current
    let candidate = i === 0 ? current : addDays(dates[dates.length - 1], 7);
    while (blackoutSet.has(candidate)) {
      candidate = addDays(candidate, 1);
    }
    if (endDate && candidate > endDate) return null; // exceeded season end
    dates.push(candidate);
    current = candidate;
  }
  return dates;
}

export default function BulkScheduler({ open, onClose, divisions, teams, onScheduled }) {
  const [divisionId, setDivisionId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timesPlayEachOther, setTimesPlayEachOther] = useState(2);
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [blackoutInput, setBlackoutInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dateError, setDateError] = useState("");

  const divTeams = useMemo(() => teams.filter(t => t.division_id === divisionId), [teams, divisionId]);
  const blackoutSet = useMemo(() => new Set(blackoutDates), [blackoutDates]);

  function addBlackout() {
    if (!blackoutInput) return;
    if (!blackoutDates.includes(blackoutInput)) {
      setBlackoutDates(prev => [...prev, blackoutInput].sort());
    }
    setBlackoutInput("");
    setPreview(null);
  }

  function removeBlackout(date) {
    setBlackoutDates(prev => prev.filter(d => d !== date));
    setPreview(null);
  }

  function handlePreview() {
    setDateError("");
    if (!divisionId || !startDate || divTeams.length < 2) return;
    const rounds = buildSchedule(divTeams, timesPlayEachOther);
    const matchdayDates = assignMatchdayDates(rounds.length, startDate, endDate || null, blackoutSet);
    if (!matchdayDates) {
      setDateError("Not enough room in the season window to fit all matchdays. Extend the end date or reduce rounds.");
      return;
    }
    const fixtures = [];
    rounds.forEach((round, roundIdx) => {
      const date = matchdayDates[roundIdx];
      round.forEach(match => {
        fixtures.push({
          division_id: divisionId,
          home_team_id: match.home.id,
          away_team_id: match.away.id,
          date,
          week_number: roundIdx + 1,
          status: "scheduled",
          approval_status: "pending",
          home_singles_wins: 0, away_singles_wins: 0,
          home_doubles_wins: 0, away_doubles_wins: 0,
          home_captains_win: 0, away_captains_win: 0,
          home_total_legs: 0, away_total_legs: 0,
        });
      });
    });
    setPreview(fixtures);
  }

  async function handleGenerate() {
    if (!preview) return;
    setGenerating(true);
    await base44.entities.Fixture.bulkCreate(preview);
    setGenerating(false);
    setPreview(null);
    setDivisionId(""); setStartDate(""); setEndDate(""); setBlackoutDates([]);
    onClose();
    onScheduled();
  }

  const totalFixtures = preview?.length ?? 0;
  const totalWeeks = preview ? Math.max(...preview.map(f => f.week_number)) : 0;
  const seasonEnd = preview ? [...preview].sort((a,b) => b.date.localeCompare(a.date))[0]?.date : null;

  const homeAwayCounts = useMemo(() => {
    if (!preview) return null;
    const counts = {};
    divTeams.forEach(t => counts[t.id] = { name: t.name, home: 0, away: 0 });
    preview.forEach(f => {
      if (counts[f.home_team_id]) counts[f.home_team_id].home++;
      if (counts[f.away_team_id]) counts[f.away_team_id].away++;
    });
    return Object.values(counts);
  }, [preview, divTeams]);

  function resetPreview() { setPreview(null); setDateError(""); }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wide flex items-center gap-2">
            <Shuffle className="h-4 w-4" /> Bulk Schedule Season
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Division */}
          <div>
            <Label>Division</Label>
            <Select value={divisionId} onValueChange={v => { setDivisionId(v); resetPreview(); }}>
              <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
              <SelectContent>
                {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {divisionId && divTeams.length < 2 && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Need at least 2 teams in this division.
              </p>
            )}
            {divisionId && divTeams.length >= 2 && (
              <p className="text-xs text-muted-foreground mt-1">{divTeams.length} teams found</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Season Start Date</Label>
              <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); resetPreview(); }} />
            </div>
            <div>
              <Label>Season End Date</Label>
              <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); resetPreview(); }} />
              <p className="text-[10px] text-muted-foreground mt-1">Optional — validates schedule fits</p>
            </div>
          </div>

          {/* Times to play */}
          <div>
            <Label>Times to Play Each Other</Label>
            <Input
              type="number" min={1} max={4} value={timesPlayEachOther}
              onChange={e => { setTimesPlayEachOther(parseInt(e.target.value) || 1); resetPreview(); }}
              className="w-32"
            />
            <p className="text-[10px] text-muted-foreground mt-1">2 = each team plays home & away once</p>
          </div>

          {/* Blackout dates */}
          <div>
            <Label>Unavailable Dates</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Add dates to skip (competitions, holidays, etc.)</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={blackoutInput}
                onChange={e => setBlackoutInput(e.target.value)}
                className="flex-1"
                min={startDate || undefined}
                max={endDate || undefined}
              />
              <Button type="button" variant="outline" size="sm" onClick={addBlackout} disabled={!blackoutInput}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {blackoutDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {blackoutDates.map(d => (
                  <span key={d} className="flex items-center gap-1 bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full">
                    {d}
                    <button onClick={() => removeBlackout(d)} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {dateError && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {dateError}
            </div>
          )}

          <Button
            variant="outline" className="w-full"
            disabled={!divisionId || !startDate || divTeams.length < 2}
            onClick={handlePreview}
          >
            Preview Schedule
          </Button>

          {preview && homeAwayCounts && (
            <div className="space-y-3">
              <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                <p className="font-heading font-bold uppercase tracking-wide text-xs">Schedule Summary</p>
                <p>{totalFixtures} fixtures across {totalWeeks} matchdays</p>
                <p className="text-muted-foreground text-xs">{startDate} → {seasonEnd}</p>
                {blackoutDates.length > 0 && (
                  <p className="text-muted-foreground text-xs">{blackoutDates.length} blackout date{blackoutDates.length > 1 ? "s" : ""} skipped</p>
                )}
              </div>

              <div>
                <p className="font-heading text-xs font-bold uppercase tracking-wide mb-2">Home / Away Balance</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-3 py-2">Team</th>
                        <th className="text-center px-3 py-2">Home</th>
                        <th className="text-center px-3 py-2">Away</th>
                        <th className="text-center px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {homeAwayCounts.map(t => (
                        <tr key={t.name} className="border-b border-border/50">
                          <td className="px-3 py-1.5 font-medium">{t.name}</td>
                          <td className="px-3 py-1.5 text-center">{t.home}</td>
                          <td className="px-3 py-1.5 text-center">{t.away}</td>
                          <td className="px-3 py-1.5 text-center font-bold">{t.home + t.away}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? "Creating fixtures..." : `Create ${totalFixtures} Fixtures`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}