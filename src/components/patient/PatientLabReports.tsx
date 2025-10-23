import { useState, useEffect } from "react";
import { FileText, Download, Eye, TestTube2, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { labReportAPI, userAPI, patientAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface LabReport {
  _id: string;
  patient_id: string;
  test_type: string;
  status: string;
  ordered_date: string;
  completed_date?: string;
  results?: string;
  ordered_by?: {
    full_name: string;
  };
  notes?: string;
}

const PatientLabReports = () => {
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

  const { data: labReportsData, isLoading } = useQuery({
    queryKey: ["patient-lab-reports", patientData?._id],
    queryFn: async () => {
      if (!patientData?._id) return [];
      const response = await labReportAPI.getLabReports({
        patient_id: patientData._id,
      });
      return response.data;
    },
    enabled: !!patientData?._id,
  });

  const labReports: LabReport[] = labReportsData || [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: JSX.Element }> = {
      completed: { 
        color: "bg-green-100 text-green-800", 
        icon: <CheckCircle className="h-3 w-3" /> 
      },
      pending: { 
        color: "bg-yellow-100 text-yellow-800", 
        icon: <Clock className="h-3 w-3" /> 
      },
      "in-progress": { 
        color: "bg-blue-100 text-blue-800", 
        icon: <TestTube2 className="h-3 w-3" /> 
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const pendingReports = labReports.filter(
    (report) => report.status?.toLowerCase() !== "completed"
  );

  const completedReports = labReports.filter(
    (report) => report.status?.toLowerCase() === "completed"
  );

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
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Results</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingReports.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Completed</h3>
            <p className="text-3xl font-bold text-green-600">{completedReports.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Reports</h3>
            <p className="text-3xl font-bold text-blue-600">{labReports.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Lab Reports */}
      {pendingReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReports.map((report) => (
                <div
                  key={report._id}
                  className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">{report.test_type}</h4>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Ordered Date:</span>{" "}
                          {new Date(report.ordered_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Ordered By:</span>{" "}
                          {report.ordered_by?.full_name || "N/A"}
                        </div>
                      </div>
                      {report.notes && (
                        <p className="text-sm text-muted-foreground mt-2 p-2 bg-card rounded">
                          {report.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Lab Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Completed Lab Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No completed lab reports</p>
          ) : (
            <div className="space-y-4">
              {completedReports.map((report) => (
                <div
                  key={report._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">{report.test_type}</h4>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Ordered Date:</span>{" "}
                          {new Date(report.ordered_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Completed Date:</span>{" "}
                          {report.completed_date
                            ? new Date(report.completed_date).toLocaleDateString()
                            : "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Ordered By:</span>{" "}
                          {report.ordered_by?.full_name || "N/A"}
                        </div>
                      </div>
                      {report.results && (
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <p className="text-sm font-medium mb-1">Results:</p>
                          <p className="text-sm text-gray-700">{report.results}</p>
                        </div>
                      )}
                      {report.notes && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                          <span className="font-medium">Notes:</span> {report.notes}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
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

export default PatientLabReports;
