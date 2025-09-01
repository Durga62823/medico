import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noteAPI } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface NotesSectionProps {
  patientId: string;
  userRole: string; // expects lowercase
}

export default function NotesSection({ patientId, userRole }: NotesSectionProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ note_type: "progress", content: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["notes", patientId],
    queryFn: () => noteAPI.getNotes(patientId).then((r) => r.data),
    enabled: !!patientId && (userRole === "doctor" || userRole === "nurse"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => noteAPI.createNote(patientId, payload),
    onSuccess: () => {
      toast.success("Note added");
      queryClient.invalidateQueries({ queryKey: ["notes", patientId] });
      setOpen(false);
    },
    onError: () => toast.error("Failed to add note"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => noteAPI.updateNote(id, payload),
    onSuccess: () => {
      toast.success("Note updated");
      queryClient.invalidateQueries({ queryKey: ["notes", patientId] });
      setOpen(false);
    },
    onError: () => toast.error("Failed to update note"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => noteAPI.deleteNote(id),
    onSuccess: () => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: ["notes", patientId] });
    },
    onError: () => toast.error("Failed to delete note"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && editingId) {
      updateMutation.mutate({ id: editingId, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (!patientId) return null;
  if (!(userRole === "doctor" || userRole === "nurse")) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clinical Notes</CardTitle>
            <CardDescription>Document progress, diagnosis, and orders</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setIsEdit(false); setEditingId(null); setForm({ note_type: "progress", content: "" }); }}>Add Note</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEdit ? "Edit Note" : "Add Note"}</DialogTitle>
                <DialogDescription>Write a new clinical note for this patient</DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.note_type} onValueChange={(v) => setForm({ ...form, note_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="diagnosis">Diagnosis</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                </div>
                <Button type="submit">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="capitalize">{row.note_type}</TableCell>
                  <TableCell className="max-w-xs truncate" title={row.content}>{row.content}</TableCell>
                  <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setIsEdit(true); setEditingId(row.id); setForm({ note_type: row.note_type, content: row.content }); setOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(row.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}


