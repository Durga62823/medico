import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from '@/services/api';

type BillingStatus = "unpaid" | "pending" | "paid" | "failed";

type BillingItem = {
  name: string;
  price: number;
  quantity: number;
  description?: string;
};

type Billing = {
  _id?: string;
  patientId: string;
  billingItems: BillingItem[];
  totalAmount: number;
  paymentStatus: BillingStatus;
  orderStatus?: string;
  paymentId?: string;
  payerId?: string;
  orderDate?: string;
};

function calculateTotal(billingItems: BillingItem[]) {
  return billingItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

export default function BillingManagement() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">("all");

  const [form, setForm] = useState<Pick<Billing, "patientId" | "billingItems">>({
    patientId: "",
    billingItems: [],
  });

  const [itemDraft, setItemDraft] = useState<BillingItem>({ name: "", price: 0, quantity: 1, description: "" });

  // =============== QUERIES ====================

  // Fetch all payments (global for admins)
  const { data, isLoading } = useQuery({
    queryKey: ["allPayments", statusFilter],
    queryFn: async () => {
      const res = await api.get("/payments", { params: { status: statusFilter !== "all" ? statusFilter : undefined } });
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
  });

  // =============== MUTATIONS ====================

  // Create a billing
  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/payments", payload),
    onSuccess: () => {
      toast.success("Billing created");
      queryClient.invalidateQueries({ queryKey: ["allPayments"] });
      setOpen(false);
    },
    onError: () => toast.error("Failed to create billing"),
  });

  // Edit a billing
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => api.patch(`/payments/${id}`, payload),
    onSuccess: () => {
      toast.success("Billing updated");
      queryClient.invalidateQueries({ queryKey: ["allPayments"] });
      setOpen(false);
    },
    onError: () => toast.error("Failed to update billing"),
  });

  // Update billing status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BillingStatus }) =>
      api.patch(`/payments/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["allPayments"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  // ===================== PAYPAL PAYMENT ==============

  // Create order and redirect to PayPal approval URL
  const payMutation = useMutation({
    mutationFn: async (billing: Billing) =>
      api.post("/payments/create-order", {
        billingId: billing._id,
        billingItems: billing.billingItems,
        totalAmount: billing.totalAmount,
      }),
    onSuccess: (data) => {
      if (data.data.approvalURL) {
        window.location.href = data.data.approvalURL;
      } else {
        toast.error("Failed to get PayPal URL");
      }
    },
    onError: () => toast.error("Failed to initiate PayPal payment"),
  });

  // =============== HANDLERS ====================

  // NEW: A single handler for all dialog open/close state changes.
  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    // Reset the form only when the dialog is being opened
    if (v) {
      setIsEdit(false);
      setEditingId(null);
      setForm({ patientId: "", billingItems: [] });
      setItemDraft({ name: "", price: 0, quantity: 1 });
    }
  };

  const openEdit = (bill: Billing) => {
    setIsEdit(true);
    setEditingId(bill._id!);
    setForm({ patientId: bill.patientId, billingItems: bill.billingItems });
    setOpen(true);
  };

  const handleAddItem = () => {
    if (
      !itemDraft.name.trim() ||
      isNaN(itemDraft.price) || itemDraft.price <= 0 ||
      isNaN(itemDraft.quantity) || itemDraft.quantity <= 0
    ) {
      toast.error("Fill all item fields correctly");
      return;
    }
    setForm((prev) => ({
      ...prev,
      billingItems: [...prev.billingItems, itemDraft],
    }));
    setItemDraft({ name: "", price: 0, quantity: 1 }); // Reset item fields
  };

  const handleRemoveItem = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      billingItems: prev.billingItems.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = calculateTotal(form.billingItems);
    if (!form.patientId || form.billingItems.length === 0 || totalAmount <= 0) {
      toast.error("Fill all billing form fields");
      return;
    }
    const payload = {
      patientId: form.patientId,
      billingItems: form.billingItems,
      totalAmount,
    };
    if (isEdit && editingId) {
      editMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // =============== UI ====================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage patient billings and payments</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BillingStatus | "all")}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Filter Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                {/* REMOVED onClick={openCreate} */}
                <Button>New Invoice</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEdit ? "Edit Bill" : "New Bill"}</DialogTitle>
                  <DialogDescription>Enter billing details and items</DialogDescription>
                </DialogHeader>
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div>
                    <Label>Patient ID</Label>
                    <Input value={form.patientId}
                      onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Items</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Input className="w-32" placeholder="Name"
                        value={itemDraft.name} onChange={e => setItemDraft({ ...itemDraft, name: e.target.value })} />
                      <Input className="w-24" placeholder="Price" type="number"
                        value={itemDraft.price} min={0} step="0.01"
                        onChange={e => setItemDraft({ ...itemDraft, price: Number(e.target.value) })} />
                      <Input className="w-20" placeholder="Qty" type="number"
                        value={itemDraft.quantity} min={1}
                        onChange={e => setItemDraft({ ...itemDraft, quantity: Number(e.target.value) })} />
                      <Input className="w-40" placeholder="Description (optional)"
                        value={itemDraft.description ?? ""} onChange={e => setItemDraft({ ...itemDraft, description: e.target.value })} />
                      <Button type="button" onClick={handleAddItem}>Add</Button>
                    </div>
                    <div className="mt-2">
                      {form.billingItems.length ? (
                        <ul>
                          {form.billingItems.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              • <span>{item.name}</span>
                              <span>₹{item.price.toFixed(2)}</span>
                              <span>x{item.quantity}</span>
                              {item.description && <span className="text-muted-foreground">{item.description}</span>}
                              <Button type="button" size="xs" variant="destructive" onClick={() => handleRemoveItem(i)}>×</Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-muted-foreground">No items yet.</span>
                      )}
                  </div>
                  </div>
                  <div className="font-semibold">
                    Total: ₹{calculateTotal(form.billingItems).toFixed(2)}
                  </div>
                  <Button type="submit">{isEdit ? "Update" : "Create"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((bill: Billing) => (
                  <TableRow key={bill._id}>
                    <TableCell>{bill.patientId}</TableCell>
                    <TableCell>
                      <ul>
                        {bill.billingItems.map((item, idx) => (
                          <li key={idx}>{item.name} (₹{item.price} × {item.quantity})</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>₹{Number(bill.totalAmount).toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{bill.paymentStatus}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(bill)}>
                          Edit
                        </Button>
                        {bill.paymentStatus !== "paid" && (
                          <Button size="sm" variant="secondary"
                            onClick={() => statusMutation.mutate({ id: bill._id!, status: "paid" })}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {bill.paymentStatus !== "paid" && (
                          <Button size="sm" variant="outline"
                            onClick={() => payMutation.mutate(bill)}
                          >
                            Pay with PayPal
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5}>No billings found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
