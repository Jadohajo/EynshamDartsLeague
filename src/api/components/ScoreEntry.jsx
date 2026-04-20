import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

function LegCounter({ value, onChange, max }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0}
        className="h-7 w-7 rounded border border-input flex items-center justify-center hover:bg-muted disabled:opacity-30">
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-6 text-center font-heading font-bold text-base">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="h-7 w-7 rounded border border-input flex items-center justify-center hover:bg-muted disabled:opacity-30">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function PlayerSelect({ label, value, onChange, players }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      {players && players.length > 0 ? (
        <select
          value={value ?? ""}
          onChange={e => onChange(e.target.value)}
          className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 py-0.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select player</option>
          {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      ) : (
        <Input value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder="Player name" className="h-7 text-xs" />
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={className}>
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <Input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="h-7 text-xs"
        min={type === "number" ? 0 : undefined}
      />
    </div>
  );
}

function Section({ title, subtitle, summary, children }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-heading font-bold uppercase tracking-wide text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="font-heading font-bold text-lg text-primary">{summary}</span>
      </div>
      {children}
    </div>
  );
}

function SinglesMatchRow({ match, onChange, maxLegs, homeTeam, awayTeam, index, homePlayers, awayPlayers }) {
  const set = (field, val) => onChange({ ...match, [field]: val });
  return (
    <div className="border border-border/50 rounded-lg p-2 mb-2 last:mb-0 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Match {index + 1}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-primary">{homeTeam}</p>
          <PlayerSelect label="Player" value={match.home_player} onChange={v => set("home_player", v)} players={homePlayers} />
          <div><p className="text-[10px] text-muted-foreground mb-0.5">Legs won (max {maxLegs})</p>
            <LegCounter value={match.home_legs || 0} onChange={v => set("home_legs", v)} max={maxLegs} /></div>
          <Field label="180s" value={match.home_180s} onChange={v => set("home_180s", v)} type="number" placeholder="0" />
          <Field label="Highest checkout" value={match.home_checkout} onChange={v => set("home_checkout", v)} type="number" placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-secondary-foreground">{awayTeam}</p>
          <PlayerSelect label="Player" value={match.away_player} onChange={v => set("away_player", v)} players={awayPlayers} />
          <div><p className="text-[10px] text-muted-foreground mb-0.5">Legs won (max {maxLegs})</p>
            <LegCounter value={match.away_legs || 0} onChange={v => set("away_legs", v)} max={maxLegs} /></div>
          <Field label="180s" value={match.away_180s} onChange={v => set("away_180s", v)} type="number" placeholder="0" />
          <Field label="Highest checkout" value={match.away_checkout} onChange={v => set("away_checkout", v)} type="number" placeholder="0" />
        </div>
      </div>
    </div>
  );
}

function DoublesMatchRow({ match, onChange, maxLegs, homeTeam, awayTeam, index, homePlayers, awayPlayers }) {
  const set = (field, val) => onChange({ ...match, [field]: val });
  return (
    <div className="border border-border/50 rounded-lg p-2 mb-2 last:mb-0 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Match {index + 1}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-primary">{homeTeam}</p>
          <PlayerSelect label="Player 1" value={match.home_player1} onChange={v => set("home_player1", v)} players={homePlayers} />
          <PlayerSelect label="Player 2" value={match.home_player2} onChange={v => set("home_player2", v)} players={homePlayers} />
          <div><p className="text-[10px] text-muted-foreground mb-0.5">Legs won (max {maxLegs})</p>
            <LegCounter value={match.home_legs || 0} onChange={v => set("home_legs", v)} max={maxLegs} /></div>
          <Field label="180s" value={match.home_180s} onChange={v => set("home_180s", v)} type="number" placeholder="0" />
          <Field label="Highest checkout" value={match.home_checkout} onChange={v => set("home_checkout", v)} type="number" placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-secondary-foreground">{awayTeam}</p>
          <PlayerSelect label="Player 1" value={match.away_player1} onChange={v => set("away_player1", v)} players={awayPlayers} />
          <PlayerSelect label="Player 2" value={match.away_player2} onChange={v => set("away_player2", v)} players={awayPlayers} />
          <div><p className="text-[10px] text-muted-foreground mb-0.5">Legs won (max {maxLegs})</p>
            <LegCounter value={match.away_legs || 0} onChange={v => set("away_legs", v)} max={maxLegs} /></div>
          <Field label="180s" value={match.away_180s} onChange={v => set("away_180s", v)} type="number" placeholder="0" />
          <Field label="Highest checkout" value={match.away_checkout} onChange={v => set("away_checkout", v)} type="number" placeholder="0" />
        </div>
      </div>
    </div>
  );
}

const defaultSingles = () => ({ home_player: "", away_player: "", home_legs: 0, away_legs: 0, home_180s: 0, away_180s: 0, home_checkout: 0, away_checkout: 0 });
const defaultDoubles = () => ({ home_player1: "", home_player2: "", away_player1: "", away_player2: "", home_legs: 0, away_legs: 0, home_180s: 0, away_180s: 0, home_checkout: 0, away_checkout: 0 });
const defaultCaptains = () => ({ home_player: "", away_player: "", home_legs: 0, away_legs: 0, home_180s: 0, away_180s: 0, home_checkout: 0, away_checkout: 0 });

function countWins(matches) {
  let home = 0, away = 0;
  matches.forEach(m => { if ((m.home_legs||0) > (m.away_legs||0)) home++; else if ((m.away_legs||0) > (m.home_legs||0)) away++; });
  return { home, away };
}

export default function ScoreEntry({ fixture, homeTeamName, awayTeamName, homePlayers = [], awayPlayers = [], onClose, onSave }) {
  const [singles, setSingles] = useState(() =>
    Array.from({ length: 4 }, (_, i) => fixture.singles_matches?.[i] ?? defaultSingles())
  );
  const [doubles, setDoubles] = useState(() =>
    Array.from({ length: 2 }, (_, i) => fixture.doubles_matches?.[i] ?? defaultDoubles())
  );
  const [captains, setCaptains] = useState(() => fixture.captains_match ?? defaultCaptains());
  const [saving, setSaving] = useState(false);

  const singlesWins = countWins(singles);
  const doublesWins = countWins(doubles);
  const captainsWins = (captains.home_legs||0) > (captains.away_legs||0) ? { home: 1, away: 0 }
    : (captains.away_legs||0) > (captains.home_legs||0) ? { home: 0, away: 1 } : { home: 0, away: 0 };

  const totalHomeLegs = [...singles, ...doubles, captains].reduce((s, m) => s + (m.home_legs || 0), 0);
  const totalAwayLegs = [...singles, ...doubles, captains].reduce((s, m) => s + (m.away_legs || 0), 0);

  async function handleSave() {
    setSaving(true);
    await base44.entities.Fixture.update(fixture.id, {
      singles_matches: singles,
      doubles_matches: doubles,
      captains_match: captains,
      home_singles_wins: singlesWins.home,
      away_singles_wins: singlesWins.away,
      home_doubles_wins: doublesWins.home,
      away_doubles_wins: doublesWins.away,
      home_captains_win: captainsWins.home,
      away_captains_win: captainsWins.away,
      home_total_legs: totalHomeLegs,
      away_total_legs: totalAwayLegs,
      status: "completed",
    });
    setSaving(false);
    onSave();
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wide text-center">Enter Match Result</DialogTitle>
          <p className="text-center text-sm text-muted-foreground">{homeTeamName} vs {awayTeamName}</p>
        </DialogHeader>

        <div className="space-y-4">
          <Section title="Singles" subtitle="4 matches · first to 3 legs" summary={`${singlesWins.home} – ${singlesWins.away}`}>
            {singles.map((m, i) => (
              <SinglesMatchRow key={i} index={i} match={m} maxLegs={3}
                homeTeam={homeTeamName} awayTeam={awayTeamName}
                homePlayers={homePlayers} awayPlayers={awayPlayers}
                onChange={v => setSingles(s => s.map((x, j) => j === i ? v : x))} />
            ))}
          </Section>

          <Section title="Doubles" subtitle="2 matches · first to 2 legs" summary={`${doublesWins.home} – ${doublesWins.away}`}>
            {doubles.map((m, i) => (
              <DoublesMatchRow key={i} index={i} match={m} maxLegs={2}
                homeTeam={homeTeamName} awayTeam={awayTeamName}
                homePlayers={homePlayers} awayPlayers={awayPlayers}
                onChange={v => setDoubles(s => s.map((x, j) => j === i ? v : x))} />
            ))}
          </Section>

          <Section title="Captain's Singles" subtitle="1 match · first to 2 legs · captains only" summary={`${captainsWins.home} – ${captainsWins.away}`}>
            <SinglesMatchRow index={0} match={captains} maxLegs={2}
              homeTeam={homeTeamName} awayTeam={awayTeamName}
              homePlayers={homePlayers.filter(p => p.is_captain)}
              awayPlayers={awayPlayers.filter(p => p.is_captain)}
              onChange={setCaptains} />
          </Section>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-heading font-bold uppercase tracking-wide text-xs mb-2">Totals</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div><p className="text-muted-foreground">Singles</p><p className="font-bold">{singlesWins.home} – {singlesWins.away}</p></div>
              <div><p className="text-muted-foreground">Doubles</p><p className="font-bold">{doublesWins.home} – {doublesWins.away}</p></div>
              <div><p className="text-muted-foreground">Total Legs</p><p className="font-bold">{totalHomeLegs} – {totalAwayLegs}</p></div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Result"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}