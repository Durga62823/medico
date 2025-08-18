import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientAPI, userAPI, vitalAPI, noteAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Users, Activity, Archive, HeartPulse, Notebook, Trash2 } from "lucide-react";

interface Patient {
  id?: string;
  _id?: string;
  patient_id?: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string[] | string;
  current_medications?: string[] | string;
  assigned_doctor?: string;
  assigned_nurse?: string;
  admission_date?: string;
  discharge_date?: string;
  status?: string;
  created_at?: string;
}

interface Staff {
  id?: string;
  _id?: string;
  full_name: string;
  role: string;
  department?: string;
}

interface Vital {
  _id: string;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature?: number;
  recorded_at: string;
}

interface Note {
  _id: string;
  note_type: string;
  content: string;
  created_at: string;
  author: { full_name: string; role: string };
}

const normalizeId = (item: any) => (item?.id ? item.id : item?._id ? item._id : undefined);

interface PatientManagementProps {
  userRole: string;
  userId?: string;
}

export default function PatientManagement({ userRole, userId }: PatientManagementProps) {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);
  const [modalType, setModalType] = useState<'vitals' | 'records' | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const [formData, setFormData] = useState({
    patient_id: "",
    full_name: "",
    date_of_birth: "",
    gender: "",
    blood_type: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_history: "",
    allergies: "",
    current_medications: "",
    assigned_doctor: "",
    assigned_nurse: "",
    admission_date: "",
    status: "active",
  });

  const [newVital, setNewVital] = useState({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '' });
  const [newNote, setNewNote] = useState({ note_type: '', content: '' });

  // This hook fetches patients based on the user's role and ID.
  const { data: apiPatients, isLoading: patientsLoading, isError: patientsError } = useQuery<Patient[]>({
    queryKey: ["patients", userRole, userId],
    queryFn: async () => {
      const filters: any = {};
      if (userRole === "doctor" && userId) filters.assigned_doctor = userId;
      if (userRole === "nurse" && userId) filters.assigned_nurse = userId;
      const res = await patientAPI.getAllPatients(filters);
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    staleTime: 60_000,
  });


  const {
        data: staffList,
        isLoading: staffLoading,
        isError: staffError,
      } = useQuery<Staff[]>({
        queryKey: ["staff"],
        queryFn: async () => {
          try {
            const res = await userAPI.getStaffList();
            const staffData = res.data;
            
            // Check and shape the data here.
            if (Array.isArray(staffData)) {
              return staffData;
            } else if (staffData && Array.isArray(staffData.data)) {
              return staffData.data;
            }
            
            // Fallback to an empty array if the expected data is not found.
            return [];
          } catch (err) {
            toast.error("Failed to load staff list");
            return []; // Always return an empty array on error
          }
        },
        staleTime: 5 * 60_000,
      });
  
  const { data: vitals, isLoading: vitalsLoading } = useQuery<Vital[]>({
    queryKey: ["vitals", selectedPatientForModal?.id],
    queryFn: () => vitalAPI.getVitals(selectedPatientForModal!.id!).then(res => res.data),
    enabled: !!selectedPatientForModal && modalType === 'vitals',
  });

  const { data: notes, isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: ["notes", selectedPatientForModal?.id],
    queryFn: () => noteAPI.getNotes(selectedPatientForModal!.id!).then(res => res.data),
    enabled: !!selectedPatientForModal && modalType === 'records',
  });

  // Memoized lists of patients, staff, doctors, and nurses.
  // This is a good pattern for optimizing your application.
  const patients: Patient[] = useMemo(() => {
    if (!patientsError && apiPatients) {
      return (apiPatients as any[]).map((p) => ({ ...p, id: normalizeId(p) }));
    }
    try {
      const stored = JSON.parse(localStorage.getItem("patients") || "[]") as Patient[];
      let visible = stored;
      if (userRole === "doctor" && userId) visible = visible.filter((p) => p.assigned_doctor === userId);
      if (userRole === "nurse" && userId) visible = visible.filter((p) => p.assigned_nurse === userId);
      return visible;
    } catch {
      return [];
    }
  }, [apiPatients, patientsError, userRole, userId]);

  const staff: Staff[] = useMemo(() => {
    if (!staffError && staffList) {
      return (staffList as any[]).map((s) => ({ ...s, id: normalizeId(s) }));
    }
    try {
      const stored = JSON.parse(localStorage.getItem("profiles") || "[]") as Staff[];
      return stored.map((s) => ({ ...s, id: normalizeId(s) }));
    } catch {
      return [];
    }
  }, [staffList, staffError]);

  const doctors = useMemo(() => staff.filter((s) => s.role.toLowerCase() === "doctor"), [staff]);
  const nurses = useMemo(() => staff.filter((s) => s.role.toLowerCase() === "nurse"), [staff]);

  const savePatientMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingPatient) {
        const id = editingPatient.id || normalizeId(editingPatient);
        return patientAPI.updatePatient(id!, payload);
      } else {
        return patientAPI.createPatient(payload);
      }
    },
    onSuccess: (res) => {
      toast.success(editingPatient ? "Patient updated" : "Patient created");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      try {
        const current = JSON.parse(localStorage.getItem("patients") || "[]") as any[];
        const newPatient = (res && (res.data || res)) || null;
        if (editingPatient && newPatient) {
          const updated = current.map((p) => (normalizeId(p) === editingPatient.id ? newPatient : p));
          localStorage.setItem("patients", JSON.stringify(updated));
        } else if (newPatient) {
          localStorage.setItem("patients", JSON.stringify([newPatient, ...current]));
        }
      } catch { }
      setDialogOpen(false);
      setEditingPatient(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save patient");
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: (args: { id: string; data: any }) => patientAPI.updatePatient(args.id, args.data),
    onSuccess: () => {
      toast.success("Patient updated");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update patient");
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: (id: string) => patientAPI.deletePatient(id),
    onSuccess: () => {
      toast.success("Patient deleted");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      try {
        const current = JSON.parse(localStorage.getItem("patients") || "[]") as any[];
        const remaining = current.filter((p) => normalizeId(p) !== id && p.id !== id);
        localStorage.setItem("patients", JSON.stringify(remaining));
      } catch { }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete patient");
    },
  });

  const recordVitalMutation = useMutation({
    mutationFn: (data: { patientId: string; vitalData: any }) => vitalAPI.recordVitals(data.patientId, data.vitalData),
    onSuccess: () => {
      toast.success("Vital recorded");
      queryClient.invalidateQueries({ queryKey: ["vitals", selectedPatientForModal?.id] });
      setNewVital({ heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', temperature: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to record vital"),
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: { patientId: string; noteData: any }) => noteAPI.createNote(data.patientId, data.noteData),
    onSuccess: () => {
      toast.success("Note added");
      queryClient.invalidateQueries({ queryKey: ["notes", selectedPatientForModal?.id] });
      setNewNote({ note_type: '', content: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add note"),
  });

  const sanitizePatientPayload = (raw: any) => {
    const copy: any = { ...raw };
    if (typeof copy.allergies === "string") {
      copy.allergies = copy.allergies ? copy.allergies.split(",").map((s: string) => s.trim()) : [];
    }
    if (typeof copy.current_medications === "string") {
      copy.current_medications = copy.current_medications ? copy.current_medications.split(",").map((s: string) => s.trim()) : [];
    }
    Object.keys(copy).forEach((k) => {
      if (copy[k] === "" || copy[k] === null || copy[k] === undefined) delete copy[k];
    });
    return copy;
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      full_name: "",
      date_of_birth: "",
      gender: "",
      blood_type: "",
      phone: "",
      email: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      medical_history: "",
      allergies: "",
      current_medications: "",
      assigned_doctor: "",
      assigned_nurse: "",
      admission_date: "",
      status: "active",
    });
  };

  const handleOpenCreate = () => {
    setEditingPatient(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      patient_id: patient.patient_id || "",
      full_name: patient.full_name || "",
      date_of_birth: patient.date_of_birth || "",
      gender: patient.gender || "",
      blood_type: patient.blood_type || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      medical_history: patient.medical_history || "",
      allergies: Array.isArray(patient.allergies) ? patient.allergies.join(", ") : (patient.allergies as string) || "",
      current_medications: Array.isArray(patient.current_medications) ? patient.current_medications.join(", ") : (patient.current_medications as string) || "",
      assigned_doctor: patient.assigned_doctor || "",
      assigned_nurse: patient.assigned_nurse || "",
      admission_date: patient.admission_date || "",
      status: patient.status || "active",
    });
    setDialogOpen(true);
  };

  const handleDelete = (patient: Patient) => {
    setConfirmMessage(`Are you sure you want to delete patient ${patient.full_name}? This action cannot be undone.`);
    setConfirmAction(() => () => {
      const id = patient.id || normalizeId(patient);
      if (!id) {
        toast.error("Missing patient id");
        return;
      }
      deletePatientMutation.mutate(id);
    });
    setConfirmDialogOpen(true);
  };

  const handleDischarge = (patient: Patient) => {
    setConfirmMessage(`Are you sure you want to discharge patient ${patient.full_name}?`);
    setConfirmAction(() => () => {
      const id = patient.id || normalizeId(patient);
      if (!id) {
        toast.error("Missing patient id");
        return;
      }
      const payload = { ...patient, status: "discharged", discharge_date: new Date().toISOString().split("T")[0] };
      updatePatientMutation.mutate({ id, data: sanitizePatientPayload(payload) });
    });
    setConfirmDialogOpen(true);
  };

  const openModal = (patient: Patient, type: 'vitals' | 'records') => {
    setSelectedPatientForModal(patient);
    setModalType(type);
  };

  const handleRecordVital = (patientId: string) => {
    const vitalData = {
      heart_rate: parseFloat(newVital.heart_rate) || undefined,
      blood_pressure_systolic: parseFloat(newVital.blood_pressure_systolic) || undefined,
      blood_pressure_diastolic: parseFloat(newVital.blood_pressure_diastolic) || undefined,
      temperature: parseFloat(newVital.temperature) || undefined,
    };
    recordVitalMutation.mutate({ patientId, vitalData });
  };

  const handleAddNote = (patientId: string) => {
    const noteData = { note_type: newNote.note_type, content: newNote.content };
    createNoteMutation.mutate({ patientId, noteData });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = sanitizePatientPayload({
      ...formData,
      created_at: editingPatient ? editingPatient.created_at : new Date().toISOString(),
    });
    savePatientMutation.mutate(payload);
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      discharged: "secondary",
      transferred: "destructive",
    };
    return <Badge variant={variants[status?.toLowerCase() || "active"] || "default"}>{status || "active"}</Badge>;
  };

  const getAssignedStaffName = (staffId?: string) => {
    if (!staffId) return "Unassigned";
    const found = staff.find((s) => (s.id === staffId) || (s._id === staffId));
    return found ? found.full_name : "Unassigned";
  };

  const overallLoading = patientsLoading && staffLoading;

  if (overallLoading) return <div className="p-6">Loading patients...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-medical-text">Patient Management</h2>
          <p className="text-muted-foreground">
            {userRole === "admin" ? "Manage all patients" :
              userRole === "doctor" ? "Your assigned patients" :
                userRole === "nurse" ? "Patients under your care" : "Your records"}
          </p>
        </div>

        {userRole === "admin" && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatient ? "Edit Patient" : "Add New Patient"}</DialogTitle>
            <DialogDescription>
              {editingPatient ? "Update patient information" : "Enter comprehensive patient details"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="medical">Medical Details</TabsTrigger>
                <TabsTrigger value="contact">Contact & Emergency</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">Patient ID</Label>
                    <Input
                      id="patient_id"
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      placeholder="P-2024-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blood_type">Blood Type</Label>
                    <Select value={formData.blood_type} onValueChange={(value) => setFormData({ ...formData, blood_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Discharged">Discharged</SelectItem>
                        <SelectItem value="Transferred">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medical_history">Medical History</Label>
                    <Textarea
                      id="medical_history"
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                      placeholder="Previous conditions, surgeries, etc."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                    <Input
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="Penicillin, Nuts, Latex"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_medications">Current Medications (comma-separated)</Label>
                    <Input
                      id="current_medications"
                      value={formData.current_medications}
                      onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                      placeholder="Aspirin, Metformin, Lisinopril"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admission_date">Admission Date</Label>
                    <Input
                      id="admission_date"
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="patient@email.com"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, City, State, ZIP"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assigned_doctor">Assigned Doctor</Label>
                    <Select
                      value={formData.assigned_doctor || "unassigned"}
                      onValueChange={(value) => setFormData({ ...formData, assigned_doctor: value === "unassigned" ? "" : value })}
                      disabled={staffLoading || doctors.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={staffLoading ? "Loading..." : doctors.length === 0 ? "No doctors available" : "Select doctor"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {doctors.map((d) => (
                          <SelectItem key={d.id || d._id} value={d.id || d._id!}>
                            {d.full_name} ({d.department || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_nurse">Assigned Nurse</Label>
                    <Select
                      value={formData.assigned_nurse || "unassigned"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          assigned_nurse: value === "unassigned" ? "" : value
                        })
                      }
                      disabled={staffLoading || nurses.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            staffLoading
                              ? "Loading nurses..."
                              : nurses.length === 0
                                ? "No nurses available"
                                : "Select nurse"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {nurses.map((n) => (
                          <SelectItem key={n.id || n._id} value={n.id || n._id!}>
                            {n.full_name} ({n.department || "General"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={savePatientMutation.isPending}>
                {savePatientMutation.isPending ? "Saving..." : editingPatient ? "Update Patient" : "Create Patient"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPatientForModal} onOpenChange={() => setSelectedPatientForModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalType === 'vitals' ? 'Vitals Tracking' : 'Medical Records'} for {selectedPatientForModal?.full_name}</DialogTitle>
          </DialogHeader>
          {modalType === 'vitals' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Record New Vital</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleRecordVital(selectedPatientForModal!.id!); }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                        <Input id="heart_rate" type="number" value={newVital.heart_rate} onChange={(e) => setNewVital({ ...newVital, heart_rate: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="temperature">Temperature (C)</Label>
                        <Input id="temperature" type="number" value={newVital.temperature} onChange={(e) => setNewVital({ ...newVital, temperature: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="systolic">Blood Pressure (Systolic)</Label>
                        <Input id="systolic" type="number" value={newVital.blood_pressure_systolic} onChange={(e) => setNewVital({ ...newVital, blood_pressure_systolic: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="diastolic">Blood Pressure (Diastolic)</Label>
                        <Input id="diastolic" type="number" value={newVital.blood_pressure_diastolic} onChange={(e) => setNewVital({ ...newVital, blood_pressure_diastolic: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" className="mt-4">Record Vital</Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Vitals History</CardTitle>
                </CardHeader>
                <CardContent>
                  {vitalsLoading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[100px]">Date</TableHead>
                            <TableHead className="min-w-[120px]">Heart Rate</TableHead>
                            <TableHead className="min-w-[120px]">BP (S)</TableHead>
                            <TableHead className="min-w-[120px]">BP (D)</TableHead>
                            <TableHead className="min-w-[120px]">Temperature</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vitals?.map((v) => (
                            <TableRow key={v._id}>
                              <TableCell>{new Date(v.recorded_at).toLocaleDateString()}</TableCell>
                              <TableCell>{v.heart_rate}</TableCell>
                              <TableCell>{v.blood_pressure_systolic}</TableCell>
                              <TableCell>{v.blood_pressure_diastolic}</TableCell>
                              <TableCell>{v.temperature}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {modalType === 'records' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleAddNote(selectedPatientForModal!.id!); }}>
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="note_type">Note Type</Label>
                      <Select value={newNote.note_type} onValueChange={(value) => setNewNote({ ...newNote, note_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diagnosis">Diagnosis</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        placeholder="Enter note content"
                        rows={5}
                      />
                    </div>
                    <Button type="submit">Add Note</Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Notes History</CardTitle>
                </CardHeader>
                <CardContent>
                  {notesLoading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[100px]">Date</TableHead>
                            <TableHead className="min-w-[120px]">Type</TableHead>
                            <TableHead className="min-w-[200px]">Content</TableHead>
                            <TableHead className="min-w-[150px]">Author</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notes?.map((n) => (
                            <TableRow key={n._id}>
                              <TableCell>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>{n.note_type}</TableCell>
                              <TableCell>{n.content}</TableCell>
                              <TableCell>{n.author.full_name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>{confirmMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmAction) confirmAction();
                setConfirmDialogOpen(false);
                setConfirmAction(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="mt-6">
        <CardContent className="p-0">
          {patientsLoading ? (
            <div className="p-6 text-center">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No patients found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Doctor</TableHead>
                    <TableHead>Assigned Nurse</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patient_id || patient.id}</TableCell>
                      <TableCell>{patient.full_name}</TableCell>
                      <TableCell>{getStatusBadge(patient.status)}</TableCell>
                      <TableCell>{getAssignedStaffName(patient.assigned_doctor)}</TableCell>
                      <TableCell>{getAssignedStaffName(patient.assigned_nurse)}</TableCell>
                      <TableCell className="text-right flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(patient)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(userRole === "doctor" || userRole === "admin") && (
                          <Button variant="outline" size="icon" onClick={() => openModal(patient, 'vitals')}>
                            <HeartPulse className="h-4 w-4" />
                          </Button>
                        )}
                        {(userRole === "nurse" || userRole === "admin") && (
                          <Button variant="outline" size="icon" onClick={() => openModal(patient, 'records')}>
                            <Notebook className="h-4 w-4" />
                          </Button>
                        )}
                        {userRole === "admin" && patient.status !== "discharged" && (
                          <Button variant="outline" size="icon" onClick={() => handleDischarge(patient)}>
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        {userRole === "admin" && (
                          <Button variant="outline" size="icon" onClick={() => handleDelete(patient)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
