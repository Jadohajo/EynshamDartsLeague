/**
 * Derive player stats from completed fixtures.
 * Returns array of { name, played, won, lost, legs_for, legs_against, s180s, best_checkout, type[] }
 */
export function derivePlayerStats(fixtures) {
  const players = {};

  function getOrCreate(name) {
    if (!name || !name.trim()) return null;
    const key = name.trim().toLowerCase();
    if (!players[key]) {
      players[key] = { name: name.trim(), played: 0, won: 0, lost: 0, legs_for: 0, legs_against: 0, s180s: 0, best_checkout: 0, types: new Set() };
    }
    return players[key];
  }

  function recordMatch(homeName, awayName, homeLegs, awayLegs, home180s, away180s, homeCheckout, awayCheckout, type) {
    const h = getOrCreate(homeName);
    const a = getOrCreate(awayName);
    if (h) {
      h.played++;
      h.legs_for += homeLegs || 0;
      h.legs_against += awayLegs || 0;
      h.s180s += home180s || 0;
      h.best_checkout = Math.max(h.best_checkout, homeCheckout || 0);
      h.types.add(type);
      if ((homeLegs || 0) > (awayLegs || 0)) h.won++; else h.lost++;
    }
    if (a) {
      a.played++;
      a.legs_for += awayLegs || 0;
      a.legs_against += homeLegs || 0;
      a.s180s += away180s || 0;
      a.best_checkout = Math.max(a.best_checkout, awayCheckout || 0);
      a.types.add(type);
      if ((awayLegs || 0) > (homeLegs || 0)) a.won++; else a.lost++;
    }
  }

  fixtures.filter(f => f.status === "completed").forEach(f => {
    (f.singles_matches || []).forEach(m => {
      recordMatch(m.home_player, m.away_player, m.home_legs, m.away_legs, m.home_180s, m.away_180s, m.home_checkout, m.away_checkout, "singles");
    });
    (f.doubles_matches || []).forEach(m => {
      // For doubles, record player 1 and player 2 separately sharing same result
      const homeNames = [m.home_player1, m.home_player2].filter(Boolean);
      const awayNames = [m.away_player1, m.away_player2].filter(Boolean);
      homeNames.forEach(name => {
        const p = getOrCreate(name);
        if (p) {
          p.played++;
          p.legs_for += m.home_legs || 0;
          p.legs_against += m.away_legs || 0;
          p.s180s += m.home_180s || 0;
          p.best_checkout = Math.max(p.best_checkout, m.home_checkout || 0);
          p.types.add("doubles");
          if ((m.home_legs || 0) > (m.away_legs || 0)) p.won++; else p.lost++;
        }
      });
      awayNames.forEach(name => {
        const p = getOrCreate(name);
        if (p) {
          p.played++;
          p.legs_for += m.away_legs || 0;
          p.legs_against += m.home_legs || 0;
          p.s180s += m.away_180s || 0;
          p.best_checkout = Math.max(p.best_checkout, m.away_checkout || 0);
          p.types.add("doubles");
          if ((m.away_legs || 0) > (m.home_legs || 0)) p.won++; else p.lost++;
        }
      });
    });
    if (f.captains_match) {
      const m = f.captains_match;
      recordMatch(m.home_player, m.away_player, m.home_legs, m.away_legs, m.home_180s, m.away_180s, m.home_checkout, m.away_checkout, "captains");
    }
  });

  return Object.values(players).map(p => ({ ...p, types: Array.from(p.types) }))
    .sort((a, b) => b.won - a.won || b.played - a.played);
}

/**
 * Build a blank stats map for all teams.
 */
function blankStats(teams) {
  const stats = {};
  teams.forEach(t => {
    stats[t.id] = { id: t.id, name: t.name, division_id: t.division_id, played: 0, won: 0, lost: 0, legs_for: 0, legs_against: 0, points: 0 };
  });
  return stats;
}

function sorted(stats) {
  return Object.values(stats).sort((a, b) => b.points - a.points || (b.legs_for - b.legs_against) - (a.legs_for - a.legs_against));
}

/**
 * Singles league: each singles match win = 1 point (max 4 per fixture)
 */
export function deriveSinglesTeamStats(fixtures, teams) {
  const stats = blankStats(teams);
  fixtures.filter(f => f.status === "completed").forEach(f => {
    const h = stats[f.home_team_id];
    const a = stats[f.away_team_id];
    if (!h || !a) return;
    const hWins = f.home_singles_wins || 0;
    const aWins = f.away_singles_wins || 0;
    const totalLegs = (f.singles_matches || []).reduce((s, m) => ({ h: s.h + (m.home_legs||0), a: s.a + (m.away_legs||0) }), { h: 0, a: 0 });
    if (hWins > 0 || aWins > 0) { h.played++; a.played++; }
    h.won += hWins; h.lost += aWins; h.points += hWins;
    a.won += aWins; a.lost += hWins; a.points += aWins;
    h.legs_for += totalLegs.h; h.legs_against += totalLegs.a;
    a.legs_for += totalLegs.a; a.legs_against += totalLegs.h;
  });
  return sorted(stats);
}

/**
 * Doubles league: each doubles match win = 1 point (max 2 per fixture)
 */
export function deriveDoublesTeamStats(fixtures, teams) {
  const stats = blankStats(teams);
  fixtures.filter(f => f.status === "completed").forEach(f => {
    const h = stats[f.home_team_id];
    const a = stats[f.away_team_id];
    if (!h || !a) return;
    const hWins = f.home_doubles_wins || 0;
    const aWins = f.away_doubles_wins || 0;
    const totalLegs = (f.doubles_matches || []).reduce((s, m) => ({ h: s.h + (m.home_legs||0), a: s.a + (m.away_legs||0) }), { h: 0, a: 0 });
    if (hWins > 0 || aWins > 0) { h.played++; a.played++; }
    h.won += hWins; h.lost += aWins; h.points += hWins;
    a.won += aWins; a.lost += hWins; a.points += aWins;
    h.legs_for += totalLegs.h; h.legs_against += totalLegs.a;
    a.legs_for += totalLegs.a; a.legs_against += totalLegs.h;
  });
  return sorted(stats);
}

/**
 * Captains league: captain's win = 1 point (max 1 per fixture)
 */
export function deriveCaptainsTeamStats(fixtures, teams) {
  const stats = blankStats(teams);
  fixtures.filter(f => f.status === "completed").forEach(f => {
    const h = stats[f.home_team_id];
    const a = stats[f.away_team_id];
    if (!h || !a) return;
    const hWin = f.home_captains_win || 0;
    const aWin = f.away_captains_win || 0;
    const cm = f.captains_match;
    if (hWin > 0 || aWin > 0) { h.played++; a.played++; }
    h.won += hWin; h.lost += aWin; h.points += hWin;
    a.won += aWin; a.lost += hWin; a.points += aWin;
    if (cm) {
      h.legs_for += cm.home_legs||0; h.legs_against += cm.away_legs||0;
      a.legs_for += cm.away_legs||0; a.legs_against += cm.home_legs||0;
    }
  });
  return sorted(stats);
}

/**
 * Captains league by player name (from captains_match data)
 */
export function deriveCaptainsPlayerStats(fixtures) {
  const players = {};
  function getOrCreate(name) {
    if (!name?.trim()) return null;
    const key = name.trim().toLowerCase();
    if (!players[key]) players[key] = { name: name.trim(), played: 0, won: 0, lost: 0, legs_for: 0, legs_against: 0, points: 0 };
    return players[key];
  }
  fixtures.filter(f => f.status === "completed" && f.captains_match).forEach(f => {
    const cm = f.captains_match;
    const h = getOrCreate(cm.home_player);
    const a = getOrCreate(cm.away_player);
    const hLegs = cm.home_legs || 0;
    const aLegs = cm.away_legs || 0;
    if (h) {
      h.played++; h.legs_for += hLegs; h.legs_against += aLegs;
      if (hLegs > aLegs) { h.won++; h.points++; } else { h.lost++; }
    }
    if (a) {
      a.played++; a.legs_for += aLegs; a.legs_against += hLegs;
      if (aLegs > hLegs) { a.won++; a.points++; } else { a.lost++; }
    }
  });
  return Object.values(players).sort((a, b) => b.points - a.points || (b.legs_for - b.legs_against) - (a.legs_for - a.legs_against));
}

/**
 * Overall team stats (sum of all points across singles + doubles + captains)
 */
export function deriveTeamStats(fixtures, teams) {
  const stats = blankStats(teams);
  fixtures.filter(f => f.status === "completed").forEach(f => {
    const h = stats[f.home_team_id];
    const a = stats[f.away_team_id];
    if (!h || !a) return;
    const hPts = (f.home_singles_wins||0) + (f.home_doubles_wins||0) + (f.home_captains_win||0);
    const aPts = (f.away_singles_wins||0) + (f.away_doubles_wins||0) + (f.away_captains_win||0);
    h.played++; a.played++;
    h.points += hPts; a.points += aPts;
    h.legs_for += f.home_total_legs||0; h.legs_against += f.away_total_legs||0;
    a.legs_for += f.away_total_legs||0; a.legs_against += f.home_total_legs||0;
    if (hPts > aPts) { h.won++; a.lost++; }
    else if (aPts > hPts) { a.won++; h.lost++; }
  });
  return sorted(stats);
}

/**
 * Player rankings: 100pts per singles win, 50pts per doubles win.
 * Matches player names from fixture data to Player entity records.
 */
export function derivePlayerRankings(fixtures, players, teams) {
  const stats = {};

  // Build lookup: normalised name -> { player, team, division_id }
  const playerMap = {};
  players.forEach(p => {
    if (!p.name?.trim()) return;
    const team = teams.find(t => t.id === p.team_id);
    playerMap[p.name.trim().toLowerCase()] = {
      id: p.id,
      name: p.name.trim(),
      team_id: p.team_id,
      team_name: team?.name || '',
      division_id: team?.division_id || null,
    };
  });

  function getOrCreate(name) {
    if (!name?.trim()) return null;
    const key = name.trim().toLowerCase();
    const info = playerMap[key];
    if (!info) return null; // only rank registered players
    if (!stats[key]) {
      stats[key] = { ...info, points: 0, singles_wins: 0, doubles_wins: 0, played: 0 };
    }
    return stats[key];
  }

  fixtures.filter(f => f.status === 'completed').forEach(f => {
    (f.singles_matches || []).forEach(m => {
      const h = getOrCreate(m.home_player);
      const a = getOrCreate(m.away_player);
      const hLegs = m.home_legs || 0;
      const aLegs = m.away_legs || 0;
      if (h) { h.played++; if (hLegs > aLegs) { h.singles_wins++; h.points += 100; } }
      if (a) { a.played++; if (aLegs > hLegs) { a.singles_wins++; a.points += 100; } }
    });
    (f.doubles_matches || []).forEach(m => {
      const hLegs = m.home_legs || 0;
      const aLegs = m.away_legs || 0;
      [m.home_player1, m.home_player2].forEach(name => {
        const p = getOrCreate(name);
        if (p) { p.played++; if (hLegs > aLegs) { p.doubles_wins++; p.points += 50; } }
      });
      [m.away_player1, m.away_player2].forEach(name => {
        const p = getOrCreate(name);
        if (p) { p.played++; if (aLegs > hLegs) { p.doubles_wins++; p.points += 50; } }
      });
    });
  });

  return Object.values(stats).sort((a, b) => b.points - a.points || b.played - a.played);
}

/**
 * Get 180s leaderboard from fixtures.
 */
export function derive180sLeaderboard(fixtures) {
  const players = {};
  const add = (name, count) => {
    if (!name?.trim()) return;
    const key = name.trim().toLowerCase();
    players[key] = { name: name.trim(), total: (players[key]?.total || 0) + (count || 0) };
  };
  fixtures.filter(f => f.status === "completed").forEach(f => {
    (f.singles_matches || []).forEach(m => { add(m.home_player, m.home_180s); add(m.away_player, m.away_180s); });
    (f.doubles_matches || []).forEach(m => {
      add(m.home_player1, m.home_180s); add(m.home_player2, m.home_180s);
      add(m.away_player1, m.away_180s); add(m.away_player2, m.away_180s);
    });
    if (f.captains_match) { add(f.captains_match.home_player, f.captains_match.home_180s); add(f.captains_match.away_player, f.captains_match.away_180s); }
  });
  return Object.values(players).filter(p => p.total > 0).sort((a, b) => b.total - a.total);
}

/**
 * Get highest checkout leaderboard from fixtures.
 */
export function deriveCheckoutLeaderboard(fixtures) {
  const players = {};
  const record = (name, checkout) => {
    if (!name?.trim() || !checkout) return;
    const key = name.trim().toLowerCase();
    players[key] = { name: name.trim(), checkout: Math.max(players[key]?.checkout || 0, checkout) };
  };
  fixtures.filter(f => f.status === "completed").forEach(f => {
    (f.singles_matches || []).forEach(m => { record(m.home_player, m.home_checkout); record(m.away_player, m.away_checkout); });
    (f.doubles_matches || []).forEach(m => {
      record(m.home_player1, m.home_checkout); record(m.home_player2, m.home_checkout);
      record(m.away_player1, m.away_checkout); record(m.away_player2, m.away_checkout);
    });
    if (f.captains_match) { record(f.captains_match.home_player, f.captains_match.home_checkout); record(f.captains_match.away_player, f.captains_match.away_checkout); }
  });
  return Object.values(players).filter(p => p.checkout > 0).sort((a, b) => b.checkout - a.checkout);
}