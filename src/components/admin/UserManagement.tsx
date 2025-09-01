  import { useMemo, useState } from "react";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { userAPI } from "@/services/api";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Button } from "@/components/ui/button";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { toast } from "sonner";
  import { Edit, Trash } from "lucide-react";
  import { z } from "zod";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";

  type Role = "admin" | "doctor" | "nurse" | "patient";

  interface User {
    id: string;
    _id?: string; // in case backend sends _id
    full_name: string;
    email: string;
    role: Role;
    department?: string;
    license_number?: string;
    created_at?: string;
  }

  const userSchema = z
    .object({
      full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
      email: z.string().email({ message: "Please enter a valid email" }),
      role: z.enum(["admin", "doctor", "nurse", "patient"]),
      department: z.string().optional(),
      license_number: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if ((val.role === "doctor" || val.role === "nurse")) {
        if (!val.department || val.department.trim().length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Department is required for medical staff",
            path: ["department"],
          });
        }
        if (!val.license_number || val.license_number.trim().length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "License number is required for medical staff",
            path: ["license_number"],
          });
        }
      }
    });

  type UserFormData = z.infer<typeof userSchema>;

  interface UserManagementProps {
    userRole: string;
  }

  export default function UserManagement({ userRole }: UserManagementProps) {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
    const [search, setSearch] = useState("");

    const form = useForm<UserFormData>({
      resolver: zodResolver(userSchema),
      defaultValues: {
        full_name: "",
        email: "",
        role: "patient",
        department: "",
        license_number: "",
      },
      mode: "onTouched",
    });

    if ((userRole || "").toLowerCase() !== "admin") return null; // Only Admin access

    const { data: users, isLoading } = useQuery<User[] | any>({
      queryKey: ["users"],
      queryFn: () => userAPI.getAllUsers().then((res) => res.data),
    });

    const createMutation = useMutation({
      mutationFn: (data: UserFormData) => userAPI.createUser(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("User created");
        setDialogOpen(false);
        form.reset();
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create user"),
    });

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: UserFormData }) => userAPI.updateUser(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("User updated");
        setDialogOpen(false);
        setEditingUser(null);
        form.reset();
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update user"),
    });

    const deleteMutation = useMutation({
      mutationFn: (id: string) => userAPI.deleteUser(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success("User deleted");
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete user"),
    });

    const openCreate = () => {
      setIsEdit(false);
      setEditingUser(null);
      form.reset({ full_name: "", email: "", role: "patient", department: "", license_number: "" });
      setDialogOpen(true);
    };

    const openEdit = (user: User) => {
      setIsEdit(true);
      setEditingUser(user);
      form.reset({
        full_name: user.full_name || "",
        email: user.email || "",
        role: (user.role as Role) || "patient",
        department: user.department || "",
        license_number: user.license_number || "",
      });
      setDialogOpen(true);
    };
    const onSubmit = (values: UserFormData) => {
      const payload = { ...values };
    
      if (payload.role !== "doctor" && payload.role !== "nurse") {
        delete payload.department;
        delete payload.license_number;
      }
    
      const userId = editingUser?.id || editingUser?._id || "";
      if (isEdit && userId) {
        updateMutation.mutate({ id: userId, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    };
    
    const rows: User[] = useMemo(() => {
      const raw = Array.isArray(users)
        ? users
        : Array.isArray(users?.items)
        ? users.items
        : Array.isArray(users?.results)
        ? users.results
        : Array.isArray(users?.data)
        ? users.data
        : [];
      const byRole = roleFilter === "all" ? raw : raw.filter((u: User) => (u.role || "").toLowerCase() === roleFilter);
      const bySearch = search.trim()
        ? byRole.filter((u: User) =>
            `${u.full_name} ${u.email}`.toLowerCase().includes(search.trim().toLowerCase())
          )
        : byRole;
      return bySearch;
    }, [users, roleFilter, search]);

    if (isLoading) return <div>Loading users...</div>;

    const watchingRole = form.watch("role");

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Users</h2>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
                  <DialogDescription>Manage user details and roles.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="patient">Patient</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>Assign correct permissions by role.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {(watchingRole === "doctor" || watchingRole === "nurse") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <Input placeholder="Cardiology" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="license_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Number</FormLabel>
                              <FormControl>
                                <Input placeholder="LIC-123456" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((user) => {
              const userId = user.id || user._id || "";
              return (
                <TableRow key={userId}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)} aria-label="Edit user">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this user? This cannot be undone.")) {
                            deleteMutation.mutate(userId);
                          }
                        }}
                        aria-label="Delete user"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
