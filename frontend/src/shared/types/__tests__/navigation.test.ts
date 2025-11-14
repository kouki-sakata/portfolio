import { describe, expect, it } from "vitest";

import type {
  MobileNavigationState,
  NavigationGroup,
  NavigationItem,
  SidebarState,
} from "../navigation";

const HOME_ICON = "home" satisfies NavigationItem["icon"];
const PROFILE_ICON = "user-circle" satisfies NavigationItem["icon"];

describe("Navigation Types", () => {
  describe("NavigationItem", () => {
    it("必須プロパティを持つNavigationItemを作成できる", () => {
      const item: NavigationItem = {
        id: "home",
        label: "ホーム",
        href: "/",
        icon: HOME_ICON,
      };

      expect(item.id).toBe("home");
      expect(item.label).toBe("ホーム");
      expect(item.href).toBe("/");
      expect(item.icon).toBe(HOME_ICON);
    });

    it("オプショナルプロパティを持つNavigationItemを作成できる", () => {
      const item: NavigationItem = {
        id: "notifications",
        label: "通知",
        href: "/notifications",
        icon: PROFILE_ICON,
        badge: 5,
        active: true,
        disabled: false,
      };

      expect(item.badge).toBe(5);
      expect(item.active).toBe(true);
      expect(item.disabled).toBe(false);
    });

    it("badgeが未定義でも型エラーが発生しない", () => {
      const item: NavigationItem = {
        id: "profile",
        label: "プロフィール",
        href: "/profile",
        icon: PROFILE_ICON,
      };

      expect(item.badge).toBeUndefined();
    });
  });

  describe("NavigationGroup", () => {
    it("titleありのNavigationGroupを作成できる", () => {
      const group: NavigationGroup = {
        id: "main",
        title: "メイン",
        items: [
          {
            id: "home",
            label: "ホーム",
            href: "/",
            icon: HOME_ICON,
          },
        ],
      };

      expect(group.id).toBe("main");
      expect(group.title).toBe("メイン");
      expect(group.items).toHaveLength(1);
      expect(group.items[0]?.id).toBe("home");
    });

    it("titleなしのNavigationGroupを作成できる", () => {
      const group: NavigationGroup = {
        id: "secondary",
        items: [
          {
            id: "profile",
            label: "プロフィール",
            href: "/profile",
            icon: PROFILE_ICON,
          },
        ],
      };

      expect(group.id).toBe("secondary");
      expect(group.title).toBeUndefined();
      expect(group.items).toHaveLength(1);
    });

    it("空のitemsでもNavigationGroupを作成できる", () => {
      const group: NavigationGroup = {
        id: "empty",
        items: [],
      };

      expect(group.items).toHaveLength(0);
    });
  });

  describe("SidebarState", () => {
    it("SidebarStateの型定義が正しく動作する", () => {
      const state: SidebarState = {
        isOpen: true,
        isCollapsed: false,
      };

      expect(state.isOpen).toBe(true);
      expect(state.isCollapsed).toBe(false);
    });

    it("すべてのプロパティがbooleanである", () => {
      const state: SidebarState = {
        isOpen: false,
        isCollapsed: true,
      };

      expect(typeof state.isOpen).toBe("boolean");
      expect(typeof state.isCollapsed).toBe("boolean");
    });
  });

  describe("MobileNavigationState", () => {
    it("MobileNavigationStateの型定義が正しく動作する", () => {
      const state: MobileNavigationState = {
        isOpen: true,
      };

      expect(state.isOpen).toBe(true);
    });

    it("isOpenプロパティがbooleanである", () => {
      const state: MobileNavigationState = {
        isOpen: false,
      };

      expect(typeof state.isOpen).toBe("boolean");
    });
  });

  describe("Type Compatibility", () => {
    it("NavigationItemがNavigationGroup.itemsに正しく配置できる", () => {
      const items: NavigationItem[] = [
        {
          id: "home",
          label: "ホーム",
          href: "/",
          icon: HOME_ICON,
        },
        {
          id: "profile",
          label: "プロフィール",
          href: "/profile",
          icon: PROFILE_ICON,
          badge: 2,
        },
      ];

      const group: NavigationGroup = {
        id: "test",
        items,
      };

      expect(group.items).toHaveLength(2);
      expect(group.items[0]?.id).toBe("home");
      expect(group.items[1]?.badge).toBe(2);
    });

    it("複数のNavigationGroupを配列として扱える", () => {
      const groups: NavigationGroup[] = [
        {
          id: "main",
          title: "メイン",
          items: [
            {
              id: "home",
              label: "ホーム",
              href: "/",
              icon: HOME_ICON,
            },
          ],
        },
        {
          id: "profile",
          items: [
            {
              id: "profile",
              label: "プロフィール",
              href: "/profile",
              icon: PROFILE_ICON,
            },
          ],
        },
      ];

      expect(groups).toHaveLength(2);
      expect(groups[0]?.title).toBe("メイン");
      expect(groups[1]?.title).toBeUndefined();
    });
  });
});
