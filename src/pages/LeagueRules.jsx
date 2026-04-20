import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, ExternalLink, BookOpen, Trophy, Info } from "lucide-react";

const CATEGORY_ICONS = {
  Rules: BookOpen,
  "Match Format": Trophy,
  Announcements: Info,
  General: FileText,
};

const MATCH_FORMAT = [
  { type: "Singles", count: 4, format: "Best of 5 legs (first to 3)", points: "1 point per match win (max 4)" },
  { type: "Doubles", count: 2, format: "Best of 3 legs (first to 2)", points: "1 point per match win (max 2)" },
  { type: "Captain's Singles", count: 1, format: "Best of 3 legs (first to 2) — captains only", points: "1 point per match win (max 1)" },
];

export default function LeagueRules() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.LeagueDocument.list("sort_order", 100).then(docs => {
      setDocuments(docs);
      setLoading(false);
    });
  }, []);

  const grouped = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69d802d487fdb2f65d24198e/2add1838e_ceb4cd67-33f4-4f7d-af3a-4d884fa9f231.jpeg" alt="EDDL Logo" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="font-heading text-sm font-bold tracking-widest uppercase text-sidebar-foreground">League Rules & Info</h1>
              <p className="text-xs text-sidebar-foreground/50 font-heading tracking-wider uppercase">Eynsham & District Darts League</p>
            </div>
          </div>
          <Link to="/" className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Match Format */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Match Format
            </CardTitle>
            <p className="text-xs text-muted-foreground">Standard format for all league fixtures</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 text-sm font-medium text-center tracking-wide">
              501 · Straight In · Double Out
            </div>
            {MATCH_FORMAT.map(m => (
              <div key={m.type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div>
                  <p className="font-heading font-bold uppercase tracking-wide text-sm">{m.type} <span className="text-muted-foreground font-normal normal-case tracking-normal text-xs">× {m.count}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.format}</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">{m.points}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documents */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No documents have been uploaded yet.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([category, docs]) => {
            const Icon = CATEGORY_ICONS[category] || FileText;
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" /> {category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{doc.title}</p>
                        {doc.description && <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>}
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}