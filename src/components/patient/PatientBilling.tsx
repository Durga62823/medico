import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Download, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { billingAPI, userAPI, patientAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface BillingRecord {
  _id: string;
  patient_id: string;
  amount: number;
  status: string;
  description: string;
  billing_date: string;
  due_date: string;
  payment_method?: string;
}

const PatientBilling = () => {
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await userAPI.profile();
        const patientsResponse = await patientAPI.getAllPatients();
        const matchedPatient = patientsResponse.data.find(
          (p: any) => p.email === userResponse.data.email
        );
        setPatientData(matchedPatient);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const { data: billingsData, isLoading } = useQuery({
    queryKey: ["patient-billings", patientData?._id],
    queryFn: async () => {
      if (!patientData?._id) return [];
      const response = await billingAPI.getBillingsForPatient(patientData._id);
      return response.data;
    },
    enabled: !!patientData?._id,
  });

  const billings: BillingRecord[] = billingsData || [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: JSX.Element }> = {
      paid: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      overdue: { color: "bg-red-100 text-red-800", icon: <Clock className="h-3 w-3" /> },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const totalOutstanding = billings
    .filter((b) => b.status?.toLowerCase() !== "paid")
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const totalPaid = billings
    .filter((b) => b.status?.toLowerCase() === "paid")
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Outstanding Balance</h3>
            <p className="text-3xl font-bold text-red-600">${totalOutstanding.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Paid</h3>
            <p className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Bills</h3>
            <p className="text-3xl font-bold text-blue-600">{billings.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Records */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {billings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No billing records found</p>
          ) : (
            <div className="space-y-4">
              {billings.map((billing) => (
                <div
                  key={billing._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">
                          {billing.description || "Medical Services"}
                        </h4>
                        {getStatusBadge(billing.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Amount:</span>{" "}
                          <span className="text-lg font-bold text-foreground">
                            ${billing.amount?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Billing Date:</span>{" "}
                          {new Date(billing.billing_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span>{" "}
                          {new Date(billing.due_date).toLocaleDateString()}
                        </div>
                        {billing.payment_method && (
                          <div>
                            <span className="font-medium">Payment Method:</span>{" "}
                            {billing.payment_method}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {billing.status?.toLowerCase() === "pending" && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientBilling;
