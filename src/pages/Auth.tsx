import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { signIn, signUp } from '@/services/authService'; // ✅ added signUp
import { Stethoscope, UserPlus, LogIn } from "lucide-react";


export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin"); // ✅ manage active tab manually
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });


  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "",
    licenseNumber: "",
    department: "",
  });


  const navigate = useNavigate();


  const handleSignIn = async (e: React.FormEvent) => {
    console.log(loginData)
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginData);
      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
          const payload = {
        ...signupData,
        full_name: signupData.fullName, 
        license_number: signupData.licenseNumber, // ✅ map licenseNumber → license_number
      };
      delete (payload as any).fullName;
      delete (payload as any).licenseNumber;
      
  
      await signUp(payload);
      toast.success("Account created! You can now sign in.");
      setActiveTab("signin");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };
  


  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-primary/10 via-background to-medical-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Stethoscope className="h-12 w-12 text-medical-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">MedAIron</CardTitle>
          <CardDescription>AI-Powered Healthcare Dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "signin" | "signup")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </TabsTrigger>
            </TabsList>


            {/* Sign In Form */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>


            {/* Sign Up Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Dr. John Doe"
                    value={signupData.fullName}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        fullName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Professional Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select
                    onValueChange={(value) =>
                      setSignupData({ ...signupData, role: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                {(signupData.role === "doctor" ||
                  signupData.role === "nurse") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-license">License Number</Label>
                      <Input
                        id="signup-license"
                        type="text"
                        placeholder="License #"
                        value={signupData.licenseNumber}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            licenseNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-department">Department</Label>
                      <Input
                        id="signup-department"
                        type="text"
                        placeholder="Cardiology, Emergency, etc."
                        value={signupData.department}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            department: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}


                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}