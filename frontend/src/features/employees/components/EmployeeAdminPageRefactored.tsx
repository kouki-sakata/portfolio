import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { EmployeeSummary } from "@/features/auth/types";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from "@/features/employees/api";
import { EmployeeTable } from "@/features/employees/components/EmployeeTable";
import type { EmployeeListResponse } from "@/features/employees/types";
import type { HttpClientError } from "@/shared/api/httpClient";
import { PageLoader } from "@/shared/components/layout/PageLoader";

const EMPLOYEE_LIST_KEY = ["employees", "list"] as const;

type FormState = {
  id: number | null;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  admin: boolean;
};

const emptyForm: FormState = {
  id: null,
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  admin: false,
};

const toMessage = (error: HttpClientError) => {
  if (typeof error.payload === "string") {
    return error.payload;
  }
  return error.message || "エラーが発生しました。";
};

export const EmployeeAdminPageRefactored = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formState, setFormState] = useState<FormState>(emptyForm);

  // データ取得
  const { data, isLoading } = useQuery<EmployeeListResponse>({
    queryKey: EMPLOYEE_LIST_KEY,
    queryFn: () => fetchEmployees(false),
    staleTime: 30 * 1000,
  });

  // 作成ミューテーション
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEE_LIST_KEY });
      toast({
        title: "成功",
        description: "従業員を登録しました。",
      });
      setFormState(emptyForm);
    },
    onError: (error: HttpClientError) => {
      toast({
        title: "エラー",
        description: toMessage(error),
        variant: "destructive",
      });
    },
  });

  // 更新ミューテーション
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Omit<EmployeeSummary, "id">> & { password?: string };
    }) => updateEmployee(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEE_LIST_KEY });
      toast({
        title: "成功",
        description: "従業員情報を更新しました。",
      });
      setFormState(emptyForm);
    },
    onError: (error: HttpClientError) => {
      toast({
        title: "エラー",
        description: toMessage(error),
        variant: "destructive",
      });
    },
  });

  // 削除ミューテーション
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EMPLOYEE_LIST_KEY });
      toast({
        title: "成功",
        description: "従業員を削除しました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "削除に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // フォーム送信処理
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!(formState.firstName && formState.lastName && formState.email)) {
      toast({
        title: "エラー",
        description: "必須項目が入力されていません。",
        variant: "destructive",
      });
      return;
    }

    if (formState.id === null) {
      await createMutation.mutateAsync({
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        password: formState.password,
        admin: formState.admin,
      });
    } else {
      const updatePayload: Partial<Omit<EmployeeSummary, "id">> & {
        password?: string;
      } = {
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        admin: formState.admin,
      };
      if (formState.password) {
        updatePayload.password = formState.password;
      }

      await updateMutation.mutateAsync({
        id: formState.id,
        payload: updatePayload,
      });
    }
  };

  // 編集開始
  const startEdit = (employee: EmployeeSummary) => {
    setFormState({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      password: "",
      admin: employee.admin,
    });
  };

  // 削除処理
  const handleDelete = async (employeeId: number) => {
    // TODO: カスタムダイアログに置き換える
    // biome-ignore lint/suspicious/noAlert: 将来的にカスタムダイアログに置き換え予定
    if (!window.confirm("従業員を削除しますか？")) {
      return;
    }
    await deleteMutation.mutateAsync(employeeId);
  };

  if (isLoading || !data) {
    return <PageLoader label="従業員情報を読み込み中" />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="font-bold text-3xl">従業員管理</h1>
        <p className="text-muted-foreground">
          登録・更新・削除を行えます。更新時はパスワードを空にすると変更されません。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* フォームカード */}
        <Card>
          <CardHeader>
            <CardTitle>
              {formState.id === null ? "新規登録" : "従業員情報の編集"}
            </CardTitle>
            <CardDescription>
              {formState.id === null
                ? "新しい従業員を登録します"
                : "従業員情報を編集します"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="firstName">姓 *</Label>
                <Input
                  id="firstName"
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  required
                  value={formState.firstName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">名 *</Label>
                <Input
                  id="lastName"
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  required
                  value={formState.lastName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  type="email"
                  value={formState.email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  パスワード {formState.id === null ? "*" : "(変更時のみ)"}
                </Label>
                <Input
                  id="password"
                  minLength={formState.id === null ? 8 : undefined}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={
                    formState.id === null
                      ? "8文字以上で入力してください"
                      : "変更する場合のみ入力"
                  }
                  required={formState.id === null}
                  type="password"
                  value={formState.password}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formState.admin}
                  id="admin"
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({
                      ...prev,
                      admin: checked === true,
                    }))
                  }
                />
                <Label
                  className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="admin"
                >
                  管理者権限を付与
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  type="submit"
                >
                  {formState.id === null ? "登録する" : "更新する"}
                </Button>
                {formState.id !== null && (
                  <Button
                    onClick={() => {
                      setFormState(emptyForm);
                    }}
                    type="button"
                    variant="outline"
                  >
                    クリア
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* テーブルカード */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>従業員一覧</CardTitle>
            <CardDescription>
              登録されている従業員の一覧を表示します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeTable
              data={data.employees}
              loading={
                createMutation.isPending ||
                updateMutation.isPending ||
                deleteMutation.isPending
              }
              onDelete={handleDelete}
              onEdit={startEdit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
