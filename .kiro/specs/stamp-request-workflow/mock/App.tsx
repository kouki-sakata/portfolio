import { useState, useEffect, useRef } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { ScrollArea } from "./components/ui/scroll-area";
import { Separator } from "./components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Checkbox } from "./components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { CommandPalette } from "./components/CommandPalette";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  User,
  Calendar,
  MessageSquare,
  Edit,
  Ban,
  ChevronRight,
  ArrowUpDown,
  Zap,
  Keyboard,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";

interface Request {
  id: string;
  employeeName: string;
  date: string;
  type: string;
  status: "pending" | "approved" | "rejected" | "new";
  reason: string;
  submittedAt: string;
  submittedTimestamp: number;
  timeFrom: string;
  timeTo: string;
  isUnread?: boolean;
}

type SortOption =
  | "date-desc"
  | "date-asc"
  | "status"
  | "unread";

export default function App() {
  const [userRole, setUserRole] = useState<
    "employee" | "admin"
  >("employee");
  const [selectedStatus, setSelectedStatus] =
    useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<Request | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // モックデータ
  const employeeRequests: Request[] = [
    {
      id: "R001",
      employeeName: "山田 太郎",
      date: "2025/11/10",
      type: "打刻修正",
      status: "rejected",
      reason: "打刻忘れのため出勤時刻を修正したい",
      submittedAt: "2025/11/10 09:30",
      submittedTimestamp: new Date(
        "2025-11-10T09:30:00",
      ).getTime(),
      timeFrom: "09:00",
      timeTo: "18:00",
      isUnread: true,
    },
    {
      id: "R002",
      employeeName: "山田 太郎",
      date: "2025/11/12",
      type: "打刻修正",
      status: "pending",
      reason: "システムエラーにより正しく記録されなかった",
      submittedAt: "2025/11/13 10:15",
      submittedTimestamp: new Date(
        "2025-11-13T10:15:00",
      ).getTime(),
      timeFrom: "08:30",
      timeTo: "17:30",
      isUnread: false,
    },
    {
      id: "R003",
      employeeName: "山田 太郎",
      date: "2025/11/14",
      type: "打刻修正",
      status: "pending",
      reason: "直行直帰のため打刻できなかった",
      submittedAt: "2025/11/14 18:30",
      submittedTimestamp: new Date(
        "2025-11-14T18:30:00",
      ).getTime(),
      timeFrom: "09:00",
      timeTo: "18:00",
      isUnread: false,
    },
    {
      id: "R004",
      employeeName: "山田 太郎",
      date: "2025/11/08",
      type: "打刻修正",
      status: "approved",
      reason: "客先訪問のため打刻できなかった",
      submittedAt: "2025/11/09 09:00",
      submittedTimestamp: new Date(
        "2025-11-09T09:00:00",
      ).getTime(),
      timeFrom: "09:00",
      timeTo: "17:00",
      isUnread: false,
    },
  ];

  const adminRequests: Request[] = [
    {
      id: "R101",
      employeeName: "佐藤 花子",
      date: "2025/11/14",
      type: "打刻修正",
      status: "pending",
      reason: "打刻忘れのため出勤時刻を修正したい",
      submittedAt: "2025/11/15 14:20",
      submittedTimestamp: new Date(
        "2025-11-15T14:20:00",
      ).getTime(),
      timeFrom: "09:00",
      timeTo: "18:00",
      isUnread: true,
    },
    {
      id: "R102",
      employeeName: "田中 一郎",
      date: "2025/11/13",
      type: "打刻修正",
      status: "pending",
      reason: "直行直帰のため打刻できなかった",
      submittedAt: "2025/11/15 13:45",
      submittedTimestamp: new Date(
        "2025-11-15T13:45:00",
      ).getTime(),
      timeFrom: "08:00",
      timeTo: "17:00",
      isUnread: true,
    },
    {
      id: "R103",
      employeeName: "鈴木 次郎",
      date: "2025/11/12",
      type: "打刻修正",
      status: "new",
      reason: "システムエラーにより記録されなかった",
      submittedAt: "2025/11/15 11:30",
      submittedTimestamp: new Date(
        "2025-11-15T11:30:00",
      ).getTime(),
      timeFrom: "09:30",
      timeTo: "18:30",
      isUnread: true,
    },
    ...employeeRequests,
  ];

  const requests =
    userRole === "admin" ? adminRequests : employeeRequests;

  // フィルタリング
  const filteredRequests = requests.filter((req) => {
    const matchesStatus =
      selectedStatus === "all" || req.status === selectedStatus;
    const matchesSearch =
      searchQuery === "" ||
      req.employeeName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      req.id
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      req.reason
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ソート
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return b.submittedTimestamp - a.submittedTimestamp;
      case "date-asc":
        return a.submittedTimestamp - b.submittedTimestamp;
      case "status":
        const statusOrder = {
          new: 0,
          pending: 1,
          rejected: 2,
          approved: 3,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      case "unread":
        if (a.isUnread && !b.isUnread) return -1;
        if (!a.isUnread && b.isUnread) return 1;
        return b.submittedTimestamp - a.submittedTimestamp;
      default:
        return 0;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700"
          >
            新規
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            保留中
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            承認済
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">却下</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return (
          <AlertCircle className="h-4 w-4 text-blue-600" />
        );
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "approved":
        return (
          <CheckCircle className="h-4 w-4 text-green-600" />
        );
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const statusCounts = {
    all: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    pending: requests.filter((r) => r.status === "pending")
      .length,
    approved: requests.filter((r) => r.status === "approved")
      .length,
    rejected: requests.filter((r) => r.status === "rejected")
      .length,
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "date-desc":
        return "新しい順";
      case "date-asc":
        return "古い順";
      case "status":
        return "ステータス順";
      case "unread":
        return "未読優先";
      default:
        return "";
    }
  };

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commandOpen) return;

      // 検索フィールドにフォーカスがある場合はスキップ
      if (document.activeElement?.tagName === "INPUT") return;

      switch (e.key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          setFocusedIndex((prev) =>
            Math.min(prev + 1, sortedRequests.length - 1),
          );
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (sortedRequests[focusedIndex]) {
            setSelectedRequest(sortedRequests[focusedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () =>
      document.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, sortedRequests, commandOpen]);

  // フォーカスされたアイテムを表示範囲内にスクロール
  useEffect(() => {
    const focusedElement = listRef.current?.querySelector(
      `[data-index="${focusedIndex}"]`,
    );
    if (focusedElement) {
      focusedElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedIndex]);

  // バルク選択
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRequests.map((r) => r.id)));
    }
  };

  const handleBulkAction = (action: "approve" | "reject") => {
    if (selectedIds.size === 0) {
      toast.error("申請を選択してください");
      return;
    }
    const actionText = action === "approve" ? "承認" : "却下";
    toast.success(
      `${selectedIds.size}件の申請を${actionText}しました`,
    );
    setSelectedIds(new Set());
  };

  const handleCommandSelect = (command: string) => {
    setCommandOpen(false);
    switch (command) {
      case "new-request":
        toast.success("新規申請を開始");
        break;
      case "view-all":
        setSelectedStatus("all");
        break;
      case "view-pending":
        setSelectedStatus("pending");
        break;
      case "view-approved":
        setSelectedStatus("approved");
        break;
      case "view-rejected":
        setSelectedStatus("rejected");
        break;
      case "settings":
        toast.info("設定を開く");
        break;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster />
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelectCommand={handleCommandSelect}
      />

      {/* ヘッダー */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl">勤怠ワークフロー</h1>
              <Separator
                orientation="vertical"
                className="h-8"
              />
              <Button
                variant={
                  userRole === "employee" ? "default" : "ghost"
                }
                size="sm"
                onClick={() => {
                  setUserRole("employee");
                  setSelectedRequest(null);
                  setSelectedIds(new Set());
                }}
              >
                従業員
              </Button>
              <Button
                variant={
                  userRole === "admin" ? "default" : "ghost"
                }
                size="sm"
                onClick={() => {
                  setUserRole("admin");
                  setSelectedRequest(null);
                  setSelectedIds(new Set());
                }}
              >
                管理者
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandOpen(true)}
                className="gap-2"
              >
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">
                  コマンド
                </span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Button
                onClick={() => toast.success("新規申請を開始")}
              >
                <Plus className="h-4 w-4 mr-2" />
                新規申請
              </Button>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm">
                  {userRole === "admin"
                    ? "管理者"
                    : "山田 太郎"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー: リスト */}
        <div className="w-96 bg-white border-r flex flex-col">
          {/* 検索 & フィルター */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="申請を検索..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* ステータスタブ */}
            <Tabs
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger
                  value="all"
                  className="text-xs px-2"
                >
                  全て
                  <Badge
                    variant="secondary"
                    className="ml-1 text-xs"
                  >
                    {statusCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="text-xs px-2"
                >
                  新規
                  {statusCounts.new > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs bg-blue-100"
                    >
                      {statusCounts.new}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="text-xs px-2"
                >
                  保留
                  {statusCounts.pending > 0 && (
                    <Badge className="ml-1 text-xs bg-yellow-500">
                      {statusCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="text-xs px-2"
                >
                  承認
                  {statusCounts.approved > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs"
                    >
                      {statusCounts.approved}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="text-xs px-2"
                >
                  却下
                  {statusCounts.rejected > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs"
                    >
                      {statusCounts.rejected}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* ソート & バルクアクション */}
            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {getSortLabel(sortBy)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>
                    並び替え
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={(v) =>
                      setSortBy(v as SortOption)
                    }
                  >
                    <DropdownMenuRadioItem value="date-desc">
                      新しい順
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="date-asc">
                      古い順
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="status">
                      ステータス順
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unread">
                      未読優先
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {userRole === "admin" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 px-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                  {selectedIds.size > 0 && (
                    <Badge variant="secondary">
                      {selectedIds.size}件選択
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* バルクアクションバー */}
          {userRole === "admin" && selectedIds.size > 0 && (
            <div className="px-4 py-3 bg-primary/10 border-b flex items-center justify-between">
              <span className="text-sm">
                {selectedIds.size}件を選択中
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700"
                  onClick={() => handleBulkAction("approve")}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  承認
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-red-700"
                  onClick={() => handleBulkAction("reject")}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  却下
                </Button>
              </div>
            </div>
          )}

          {/* リスト */}
          <ScrollArea className="flex-1">
            <div className="p-2" ref={listRef}>
              {sortedRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>申請が見つかりません</p>
                </div>
              ) : (
                sortedRequests.map((request, index) => (
                  <div
                    key={request.id}
                    data-index={index}
                    className={`relative group mb-2 rounded-lg border transition-all ${
                      selectedRequest?.id === request.id
                        ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                        : focusedIndex === index
                          ? "bg-gray-50 border-gray-300"
                          : "bg-white hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* チェックボックス（管理者のみ） */}
                      {userRole === "admin" && (
                        <Checkbox
                          checked={selectedIds.has(request.id)}
                          onCheckedChange={() =>
                            toggleSelection(request.id)
                          }
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}

                      {/* メインコンテンツ */}
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setFocusedIndex(index);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span className="text-xs text-gray-500">
                              {request.id}
                            </span>
                            {request.isUnread && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="mb-2">
                          {userRole === "admin" && (
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">
                                {request.employeeName}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {request.date}
                            </span>
                            <span className="text-xs text-gray-500">
                              {request.type}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {request.reason}
                        </p>
                        <div className="text-xs text-gray-400">
                          提出: {request.submittedAt}
                        </div>
                      </button>

                      {/* クイックアクション（ホバー時） */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              クイックアクション
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {userRole === "admin" ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast.success(
                                      "承認しました",
                                    )
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  承認
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast.error("却下しました")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  却下
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast.info("編集します")
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  編集
                                </DropdownMenuItem>
                                {request.status ===
                                  "pending" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toast.info(
                                        "キャンセルしました",
                                      )
                                    }
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    キャンセル
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* フッター: ショートカットヒント */}
          <div className="border-t p-3 bg-gray-50">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded">
                  ↑↓
                </kbd>
                移動
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded">
                  Enter
                </kbd>
                選択
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded">
                  ⌘K
                </kbd>
                コマンド
              </span>
            </div>
          </div>
        </div>

        {/* 右メインエリア: 詳細パネル */}
        <div className="flex-1 bg-gray-50">
          {selectedRequest ? (
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto p-8 animate-in fade-in slide-in-from-right-5 duration-300">
                {/* ヘッダー */}
                <div className="bg-white rounded-lg p-6 mb-6 border shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl">申請詳細</h2>
                        {getStatusBadge(selectedRequest.status)}
                      </div>
                      <p className="text-gray-600">
                        申請ID: {selectedRequest.id}
                      </p>
                    </div>
                    {selectedRequest.isUnread && (
                      <Badge
                        variant="destructive"
                        className="animate-pulse"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        未読
                      </Badge>
                    )}
                  </div>

                  {userRole === "admin" && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                      <User className="h-4 w-4 text-gray-600" />
                      <span>
                        申請者: {selectedRequest.employeeName}
                      </span>
                    </div>
                  )}

                  {/* 基本情報 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        対象日
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{selectedRequest.date}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        修正種別
                      </div>
                      <div>{selectedRequest.type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        勤務時間
                      </div>
                      <div>
                        {selectedRequest.timeFrom} 〜{" "}
                        {selectedRequest.timeTo}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        提出日時
                      </div>
                      <div className="text-sm">
                        {selectedRequest.submittedAt}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 申請理由 */}
                <div className="bg-white rounded-lg p-6 mb-6 border shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <h3>申請理由</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedRequest.reason}
                  </p>
                </div>

                {/* 却下理由（却下の場合のみ） */}
                {selectedRequest.status === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h3 className="text-red-900">却下理由</h3>
                    </div>
                    <p className="text-red-800 leading-relaxed">
                      申請理由が不明瞭です。具体的な状況と修正が必要な理由を詳しく記載してください。
                    </p>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="bg-white rounded-lg p-6 border shadow-sm">
                  <h3 className="mb-4">アクション</h3>
                  <div className="space-y-3">
                    {userRole === "employee" ? (
                      <>
                        {selectedRequest.status ===
                          "pending" && (
                          <>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() =>
                                toast.info("申請を編集")
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              申請を編集する
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-red-600 hover:text-red-700"
                              onClick={() =>
                                toast.info("申請をキャンセル")
                              }
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              申請をキャンセルする
                            </Button>
                          </>
                        )}
                        {selectedRequest.status ===
                          "rejected" && (
                          <Button
                            className="w-full justify-start"
                            onClick={() =>
                              toast.success("修正して再申請")
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            修正して再申請する
                          </Button>
                        )}
                        {selectedRequest.status ===
                          "approved" && (
                          <p className="text-sm text-gray-600 p-4 bg-green-50 rounded-lg">
                            ✓ この申請は承認済みです
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        {(selectedRequest.status ===
                          "pending" ||
                          selectedRequest.status === "new") && (
                          <>
                            <Button
                              className="w-full justify-start bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                toast.success(
                                  "申請を承認しました",
                                )
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              承認する
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-red-600 hover:text-red-700 border-red-200"
                              onClick={() =>
                                toast.error(
                                  "申請を却下しました",
                                )
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              却下する
                            </Button>
                          </>
                        )}
                        {selectedRequest.status ===
                          "approved" && (
                          <p className="text-sm text-gray-600 p-4 bg-green-50 rounded-lg">
                            ✓ この申請は承認済みです
                          </p>
                        )}
                        {selectedRequest.status ===
                          "rejected" && (
                          <p className="text-sm text-gray-600 p-4 bg-red-50 rounded-lg">
                            ✗ この申請は却下済みです
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ChevronRight className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">
                  申請を選択してください
                </p>
                <p className="text-sm text-gray-500">
                  ↑↓キーで移動、Enterキーで選択できます
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}