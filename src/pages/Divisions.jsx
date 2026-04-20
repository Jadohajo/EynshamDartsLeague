import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Plus, Trash2, Users, Archive } from "lucide-react";
import { Link } from "react-router-dom";

export default function Divisions() {
  const [divisions, setDivisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", season: "2025/26", status: "active" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [divs, t] = await Promise.all([
      base44.entities.Division.list(),
      base44.entities.Team.list(),
    ]);
    setDivisions(divs);
    setTeams(t);
    setLoading(false);
  }

  async function handleCreate() {
    await base44.entities.Division.create(form);
    setForm({ name: "", season: "2025/26", status: "active" });
    setOpen(false);
    loadData();
  }

  async function handleDelete(id) {
    await base44.entities.Division.delete(id);
    loadData();
  }

  async function handleEndSeason(div) {
    if (!confirm(`End season for "${div.name}"? This will mark it as completed and preserve all data as historical records.`)) return;
    await base44.entities.Division.update(div.id, { status: "completed" });
    loadData();
  }

  const getTeamCount = (divId) => teams.filter((t) => t.division_id === divId).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">Divisions</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage league divisions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Division
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wide">New Division</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Division Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premier Division" />
              </div>
              <div>
                <Label>Season</Label>
                <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="e.g. 2025/26" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!form.name} className="w-full">Create Division</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {divisions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No divisions yet. Create your first division to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {divisions.map((div) => (
            <Card key={div.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg uppercase tracking-wide">{div.name}</h3>
                      <p className="text-xs text-muted-foreground">{div.season}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {div.status === "active" && (
                      <Button variant="ghost" size="icon" title="End Season" onClick={() => handleEndSeason(div)}>
                        <Archive className="h-4 w-4 text-secondary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(div.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {getTeamCount(div.id)} teams
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    div.status === "active" ? "bg-primary/10 text-primary" :
                    div.status === "upcoming" ? "bg-secondary/20 text-secondary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {div.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}