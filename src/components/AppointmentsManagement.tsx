import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AppointmentForm {
  patient_id: string;
  staff_id: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  appointment_type?: string;
  status?: string;
}

interface Appointment {
  _id: string;
  patient_id: { _id: string; full_name: string };
  staff_id: { _id: string; full_name: string; role: string };
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  appointment_type: string;
  status: string;
}

interface AppointmentResponse {
  data: Appointment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AppointmentsManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentForm>({
    patient_id: "",
    staff_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    appointment_type: "consultation",
    status: "scheduled",
  });

  // Fetch appointments
  const { data: appointmentsData, isLoading, isError } = useQuery<AppointmentResponse>({
    queryKey: ["appointments", { page: 1, limit: 10 }],
    queryFn: () =>
      appointmentAPI
        .getAppointments({ page: 1, limit: 10, sort: "-appointment_date" })
        .then((r) => r.data),
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: (payload: AppointmentForm) => appointmentAPI.createAppointment(payload),
    onSuccess: () => {
      toast.success("Appointment created");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create appointment");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentForm }) =>
      appointmentAPI.updateAppointment(id, payload),
    onSuccess: () => {
      toast.success("Appointment updated");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update appointment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentAPI.cancelAppointment(id),
    onSuccess: () => {
      toast.success("Appointment deleted");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete appointment");
    },
  });

  const resetForm = () => {
    setForm({
      patient_id: "",
      staff_id: "",
      appointment_date: "",
      appointment_time: "",
      notes: "",
      appointment_type: "consultation",
      status: "scheduled",
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form)
    if (isEdit && editingId) {
      updateMutation.mutate({ id: editingId, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openCreate = () => {
    setIsEdit(false);
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (row: Appointment) => {
    setIsEdit(true);
    setEditingId(row._id);
  
    setForm({
      patient_id: typeof row.patient_id === "object" ? row.patient_id?._id : row.patient_id,
      staff_id: typeof row.staff_id === "object" ? row.staff_id?._id : row.staff_id,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      notes: row.notes ?? "",
      appointment_type: row.appointment_type ?? "consultation",
      status: row.status ?? "scheduled",
    });
  
    setOpen(true);
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading appointments.</div>;

  const appointments = appointmentsData?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Appointments</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Add Appointment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEdit ? "Edit Appointment" : "Add Appointment"}</DialogTitle>
                <DialogDescription>Fill in appointment details below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-3">
                <div>
                  <Label>Patient ID</Label>
                  <Input value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required />
                </div>
                <div>
                  <Label>Staff ID</Label>
                  <Input value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} required />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} required />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} required />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.appointment_type} onValueChange={(v) => setForm({ ...form, appointment_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="treatment">Treatment</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no-show">No-Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
  {appointments.length > 0 ? (
    appointments.map((row) => (
      <TableRow key={row._id}>
        <TableCell>{row.patient_id?.full_name ?? "Unknown Patient"}</TableCell>
        <TableCell>
          {row.staff_id
            ? `${row.staff_id.full_name} (${row.staff_id.role ?? "No role"})`
            : "Unknown Staff"}
        </TableCell>
        <TableCell>{row.appointment_date}</TableCell>
        <TableCell>{row.appointment_time}</TableCell>
        <TableCell className="capitalize">{row.status ?? "N/A"}</TableCell>
        <TableCell>
          <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
  Edit
</Button>
            <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(row._id)}>Delete</Button>
          </div>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
        No appointments found.
      </TableCell>
    </TableRow>
  )}
</TableBody>

        </Table>
      </CardContent>
    </Card>
  );
}
