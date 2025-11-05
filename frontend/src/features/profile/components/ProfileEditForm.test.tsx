import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfileEditForm } from "@/features/profile/components/ProfileEditForm";
import type { ProfileMetadataFormValues } from "@/features/profile/types";

const defaultValues: ProfileMetadataFormValues = {
  address: "大阪府大阪市北区梅田1-1-1",
  department: "プロダクト開発部",
  employeeNumber: "EMP-0001",
  activityNote: "React/Javaの担当。フロントとバックの橋渡し。",
  location: "大阪/梅田 (JST)",
  manager: "田中 太郎",
  workStyle: "hybrid",
  scheduleStart: "09:30",
  scheduleEnd: "18:30",
  scheduleBreakMinutes: 60,
};

describe("ProfileEditForm", () => {
  it("入力値をトリムしつつ送信ハンドラに渡す", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ProfileEditForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    );

    const departmentInput = screen.getByLabelText("部署");
    await user.clear(departmentInput);
    await user.type(departmentInput, " 開発推進部 ");

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        ...defaultValues,
        department: "開発推進部",
      });
    });
  });

  it("最大文字数制限を超えるとエラーメッセージを表示する", async () => {
    const user = userEvent.setup();

    render(
      <ProfileEditForm defaultValues={defaultValues} onSubmit={vi.fn()} />
    );

    const employeeNumberInput = screen.getByLabelText("社員番号");
    await user.clear(employeeNumberInput);
    await user.type(employeeNumberInput, "A".repeat(300));

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(
      await screen.findByText("社員番号は256文字以内で入力してください")
    ).toBeVisible();
  });

  it("禁止文字を含む場合は送信をブロックする", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <ProfileEditForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    );

    const addressInput = screen.getByLabelText("住所");
    await user.clear(addressInput);
    await user.type(addressInput, "東京都<script>alert(1)</script>");

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText("スクリプトや制御文字は入力できません")
    ).toBeVisible();
  });

  it("送信中はボタンを無効化しスピナーを表示する", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        })
    );

    render(
      <ProfileEditForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    );

    const submitButton = screen.getByRole("button", { name: "保存" });
    await user.click(submitButton);

    // React Hook Formの状態更新を待つ
    // isSubmittingがtrueになり、ボタンがdisabledになるまで待機
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // この時点でボタンは確実にdisabledになっており、スピナーも表示されている
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(submitButton).toHaveTextContent("保存中…");
  });
});
