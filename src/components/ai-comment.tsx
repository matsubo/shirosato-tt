import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AiCommentProps {
  comment?: string;
}

export function AiComment({ comment }: AiCommentProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/20" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI分析コメント
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {comment ?? "コメント準備中..."}
        </p>
      </CardContent>
    </Card>
  );
}
