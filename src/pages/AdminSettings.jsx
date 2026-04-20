import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Facebook, Megaphone, Plus, Trash2, Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const FB_PAGE_ID_KEY = "eddl_fb_page_id";
const FB_TOKEN_KEY = "eddl_fb_token";

export default function AdminSettings() {
  const [fbPageId, setFbPageId] = useState(() => localStorage.getItem(FB_PAGE_ID_KEY) || "");
  const [fbToken, setFbToken] = useState(() => localStorage.getItem(FB_TOKEN_KEY) || "");
  const [fbSaved, setFbSaved] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", expires_at: "" });
  const [generating, setGenerating] = useState(false);

  // For result post generation
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedFixture, setSelectedFixture] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatingPost, setGeneratingPost] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Announcement.list("-created_date", 50),
      base44.entities.Fixture.filter({ status: "completed" }, "-date", 20),
      base44.entities.Team.list(),
    ]).then(([ann, fix, t]) => {
      setAnnouncements(ann);
      setFixtures(fix);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  function saveFb() {
    localStorage.setItem(FB_PAGE_ID_KEY, fbPageId);
    localStorage.setItem(FB_TOKEN_KEY, fbToken);
    setFbSaved(true);
    setTimeout(() => setFbSaved(false), 2000);
  }

  async function handleCreate() {
    await base44.entities.Announcement.create({ ...form, is_active: true });
    setForm({ title: "", message: "", expires_at: "" });
    setCreateOpen(false);
    const ann = await base44.entities.Announcement.list("-created_date", 50);
    setAnnouncements(ann);
  }

  async function handleDelete(id) {
    await base44.entities.Announcement.delete(id);
    setAnnouncements(a => a.filter(x => x.id !== id));
  }

  async function toggleActive(ann) {
    await base44.entities.Announcement.update(ann.id, { is_active: !ann.is_active });
    setAnnouncements(a => a.map(x => x.id === ann.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function generateAnnouncement() {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a short, enthusiastic darts league announcement for the Eynsham & District Darts League. It should be friendly, community-focused, and suitable for posting on Facebook. Keep it under 100 words. Return JSON with "title" (short headline) and "message" (the announcement body).`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          message: { type: "string" }
        }
      }
    });
    setForm(f => ({ ...f, title: result.title, message: result.message }));
    setGenerating(false);
  }

  async function generateResultPost() {
    if (!selectedFixture) return;
    const fixture = fixtures.find(f => f.id === selectedFixture);
    if (!fixture) return;
    const home = teams.find(t => t.id === fixture.home_team_id)?.name || "Home";
    const away = teams.find(t => t.id === fixture.away_team_id)?.name || "Away";
    const hw = (fixture.home_singles_wins || 0) + (fixture.home_doubles_wins || 0) + (fixture.home_captains_win || 0);
    const aw = (fixture.away_singles_wins || 0) + (fixture.away_doubles_wins || 0) + (fixture.away_captains_win || 0);
    setGeneratingPost(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a fun Facebook post for the Eynsham & District Darts League about this match result:
${home} ${hw} – ${aw} ${away}
Singles: ${fixture.home_singles_wins || 0}–${fixture.away_singles_wins || 0}
Doubles: ${fixture.home_doubles_wins || 0}–${fixture.away_doubles_wins || 0}
Captain's: ${fixture.home_captains_win || 0}–${fixture.away_captains_win || 0}
Match date: ${fixture.date}
Keep it enthusiastic, friendly, under 150 words. Include relevant darts emojis.`,
    });
    setGeneratedPost(result);
    setGeneratingPost(false);
  }

  function copyPost() {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "TBD";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage integrations and announcements</p>
      </div>

      {/* Facebook Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-600" /> Facebook Integration
          </CardTitle>
          <p className="text-xs text-muted-foreground">Store your Facebook Page credentials and generate ready-to-post result updates</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Facebook Page ID</Label>
              <Input value={fbPageId} onChange={e => setFbPageId(e.target.value)} placeholder="e.g. 123456789" />
            </div>
            <div>
              <Label>Page Access Token</Label>
              <Input type="password" value={fbToken} onChange={e => setFbToken(e.target.value)} placeholder="Your page access token" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Credentials are stored locally in your browser. Use the result generator below to create posts you can copy &amp; paste to Facebook.</p>
          <Button onClick={saveFb} variant="outline" className="gap-2">
            {fbSaved ? <><Check className="h-4 w-4 text-green-600" /> Saved!</> : "Save Credentials"}
          </Button>

          <div className="border-t border-border pt-6 space-y-4">
            <p className="font-medium text-sm">Generate Result Post</p>
            <div>
              <Label>Select Completed Fixture</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                value={selectedFixture}
                onChange={e => { setSelectedFixture(e.target.value); setGeneratedPost(""); }}
              >
                <option value="">Choose a fixture…</option>
                {fixtures.map(f => {
                  const hw = (f.home_singles_wins || 0) + (f.home_doubles_wins || 0) + (f.home_captains_win || 0);
                  const aw = (f.away_singles_wins || 0) + (f.away_doubles_wins || 0) + (f.away_captains_win || 0);
                  return (
                    <option key={f.id} value={f.id}>
                      {f.date} · {getTeamName(f.home_team_id)} {hw}–{aw} {getTeamName(f.away_team_id)}
                    </option>
                  );
                })}
              </select>
            </div>
            <Button onClick={generateResultPost} disabled={!selectedFixture || generatingPost} className="gap-2">
              {generatingPost ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Post</>}
            </Button>
            {generatedPost && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm whitespace-pre-wrap">{generatedPost}</p>
                <Button variant="outline" size="sm" onClick={copyPost} className="gap-2">
                  {copied ? <><Check className="h-4 w-4 text-green-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy to Clipboard</>}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-secondary" /> Pop-up Announcements
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Active announcements appear as a popup on the public dashboard</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading uppercase tracking-wide">New Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={generateAnnouncement} disabled={generating} className="gap-2">
                    {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> AI Generate</>}
                  </Button>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement headline" />
                </div>
                <div>
                  <Label>Message</Label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Announcement body text…"
                  />
                </div>
                <div>
                  <Label>Expires On <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                </div>
                <Button onClick={handleCreate} disabled={!form.title || !form.message} className="w-full">Save Announcement</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{ann.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ann.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {ann.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ann.message}</p>
                    {ann.expires_at && <p className="text-xs text-muted-foreground mt-0.5">Expires: {ann.expires_at}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(ann)}>
                      {ann.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ann.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}