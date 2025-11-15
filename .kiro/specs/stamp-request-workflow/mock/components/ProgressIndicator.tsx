import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { CheckCircle, Clock, Flag } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: "submission" | "review" | "result";
  status: "new" | "pending" | "approved" | "rejected" | "canceled";
}

export function ProgressIndicator({ currentStep, status }: ProgressIndicatorProps) {
  const steps = [
    { id: "submission", label: "申請", icon: Flag },
    { id: "review", label: "レビュー", icon: Clock },
    { id: "result", label: "結果", icon: CheckCircle },
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const getProgressValue = () => {
    if (currentStep === "submission") return 33;
    if (currentStep === "review") return 66;
    return 100;
  };

  const getStatusBadge = () => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">新規</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">保留中</Badge>;
      case "approved":
        return <Badge className="bg-green-500">承認済</Badge>;
      case "rejected":
        return <Badge variant="destructive">却下</Badge>;
      case "canceled":
        return <Badge variant="outline">キャンセル</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>ワークフロー進捗</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Progress value={getProgressValue()} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const stepStatus = getStepStatus(step.id);
            
            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    stepStatus === "completed"
                      ? "bg-green-500 text-white"
                      : stepStatus === "current"
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div
                  className={`text-sm ${
                    stepStatus === "current" ? "text-primary" : "text-gray-600"
                  }`}
                >
                  {step.label}
                </div>
                {stepStatus === "completed" && (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600">
            {currentStep === "submission" && "申請が提出されました。レビュー待ちです。"}
            {currentStep === "review" && "管理者によるレビュー中です。"}
            {currentStep === "result" && status === "approved" && "申請が承認されました。"}
            {currentStep === "result" && status === "rejected" && "申請が却下されました。"}
            {currentStep === "result" && status === "canceled" && "申請がキャンセルされました。"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
