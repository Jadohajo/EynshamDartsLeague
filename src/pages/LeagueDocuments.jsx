import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Upload, ExternalLink } from "lucide-react";

const CATEGORIES = ["Rules", "Match Format", "Announcements", "General"];

export default function LeagueDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Rules", sort_order: 0 });
  const [file, setFile] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const docs = await base44.entities.LeagueDocument.list("sort_order", 100);
    setDocuments(docs);
    setLoading(false);
  }

  async function handleCreate() {
    setUploading(true);
    let file_url = "";
    if (file) {
      const result = await base44.integrations.Core.UploadFile({ file });
      file_url = result.file_url;
    }
    await base44.entities.LeagueDocument.create({ ...form, file_url });
    setForm({ title: "", description: "", category: "Rules", sort_order: 0 });
    setFile(null);
    setCreateOpen(false);
    setUploading(false);
    loadData();
  }

  async function handleDelete(id) {
    await base44.entities.LeagueDocument.delete(id);
    loadData();
  }

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
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">League Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload rules, formats and announcements for the public page</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wide">Add Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. League Rules 2025/26" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-24" />
              </div>
              <div>
                <Label>File <span className="text-muted-foreground text-xs">(optional — PDF, Word, etc.)</span></Label>
                <Input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files[0])} />
              </div>
              <Button onClick={handleCreate} disabled={!form.title || uploading} className="w-full gap-2">
                {uploading ? <><Upload className="h-4 w-4 animate-pulse" /> Uploading...</> : "Save Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents yet. Add one to display it on the public rules page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.category}{doc.description ? ` · ${doc.description}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}