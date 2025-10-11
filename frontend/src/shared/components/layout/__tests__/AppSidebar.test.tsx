import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createAdminAuthValue, TestAuthProvider } from "@/test/test-utils";

import { AppSidebar } from "../AppSidebar";

// NavLink プロパティの型定義
type NavLinkProps = {
  to: string;
  children: React.ReactNode;
  className?: string | ((props: { isActive: boolean }) => string);
  onClick?: React.MouseEventHandler;
};

// react-router-domのNavLinkをモック
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom"
    );
  return {
    ...actual,
    // biome-ignore lint/style/useNamingConvention: Component name must match React Router's NavLink
    NavLink: ({ to, children, className, onClick }: NavLinkProps) => {
      const classValue =
        typeof className === "function"
          ? className({ isActive: false })
          : className;
      return (
        <a className={classValue} href={to} onClick={onClick}>
          {children}
        </a>
      );
    },
  };
});

const AppSidebarWrapper = ({ children }: { children: React.ReactNode }) => (
  <TestAuthProvider authValue={createAdminAuthValue()}>
    {children}
  </TestAuthProvider>
);

describe("AppSidebar", () => {
  it("デフォルト状態でサイドバーが正しくレンダリングされる", () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    // ブランド名が表示されている
    expect(screen.getByText("TeamDevelop")).toBeInTheDocument();

    // 主要なナビゲーションアイテムが表示されている
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("勤怠履歴")).toBeInTheDocument();
    expect(screen.getByText("社員管理")).toBeInTheDocument();
    expect(screen.getByText("通知")).toBeInTheDocument();
    expect(screen.getByText("レポート")).toBeInTheDocument();
    expect(screen.getByText("設定")).toBeInTheDocument();

    // 不要な「出退勤」リンクが表示されていないことを確認
    expect(screen.queryByText("出退勤")).not.toBeInTheDocument();
  });

  it("管理グループのタイトルが表示される", () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    expect(screen.getByText("管理")).toBeInTheDocument();
  });

  it("通知アイテムにバッジが表示される", () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    // 通知バッジ（数字の3）が表示されている
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("バージョン情報が表示される", () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar />
      </AppSidebarWrapper>
    );

    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });

  it("isOpenがtrueの時、モバイル用オーバーレイが表示される", () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} />
      </AppSidebarWrapper>
    );

    // オーバーレイ要素が存在する
    const overlay = screen.getByTestId("sidebar-overlay");
    expect(overlay).toBeInTheDocument();
  });

  it("onCloseコールバックが呼ばれる - オーバーレイクリック", () => {
    const onCloseMock = vi.fn();

    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} onClose={onCloseMock} />
      </AppSidebarWrapper>
    );

    // オーバーレイをクリック
    const overlay = screen.getByTestId("sidebar-overlay");
    fireEvent.click(overlay);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("onCloseコールバックが呼ばれる - 閉じるボタンクリック", () => {
    const onCloseMock = vi.fn();

    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} onClose={onCloseMock} />
      </AppSidebarWrapper>
    );

    // 閉じるボタンをクリック（オーバーレイと閉じるボタンの両方に同じaria-labelがあるため、getAllByLabelText()を使用）
    const closeButtons = screen.getAllByLabelText("サイドバーを閉じる");
    expect(closeButtons.length).toBeGreaterThan(0);
    const closeButton = closeButtons[0];
    if (!closeButton) {
      return;
    }

    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("onCloseコールバックが呼ばれる - ナビゲーションアイテムクリック", () => {
    const onCloseMock = vi.fn();

    render(
      <AppSidebarWrapper>
        <AppSidebar onClose={onCloseMock} />
      </AppSidebarWrapper>
    );

    // ナビゲーションアイテムをクリック
    const homeLink = screen.getByText("ホーム");
    fireEvent.click(homeLink);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("カスタムクラス名が適用される", () => {
    const customClass = "custom-sidebar-class";

    render(
      <AppSidebarWrapper>
        <AppSidebar className={customClass} />
      </AppSidebarWrapper>
    );

    // asideエレメントにカスタムクラスが適用されている
    const sidebar = screen.getByTestId("app-sidebar");
    expect(sidebar).toHaveClass(customClass);
  });

  it("適切なアクセシビリティ属性が設定されている", () => {
    render(
      <AppSidebarWrapper>
        <AppSidebar isOpen={true} />
      </AppSidebarWrapper>
    );

    // 閉じるボタンのaria-label（オーバーレイと閉じるボタンの両方に同じaria-labelがあるため、getAllByLabelText()を使用）
    const closeButton = screen.getAllByLabelText("サイドバーを閉じる")[0];
    expect(closeButton).toBeInTheDocument();

    // オーバーレイボタンが適切にラベル付けされていることを確認
    const overlay = screen.getByTestId("sidebar-overlay");
    expect(overlay).toHaveAttribute("aria-label", "サイドバーを閉じる");
  });
});
