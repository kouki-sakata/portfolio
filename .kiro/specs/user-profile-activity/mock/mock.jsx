import { useState } from "react";
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Pencil, MoreVertical, Globe, Mail, Building2, User2, Briefcase, Clock, Trash2, Download, CalendarDays } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

// --- Types ---
type User = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  location: string;
  employeeCode: string;
  joinedAt: string;
  status: "active" | "leave" | "inactive";
  avatarUrl?: string;
  manager?: string;
  workStyle: "remote" | "hybrid" | "onsite";
  schedule: {
    start: string;
    end: string;
    breakMinutes: number;
  };
  memo?: string;
};

type AttendanceSummary = {
  month: string;
  totalHours: number;
  overtimeHours: number;
  lateCount: number;
  paidLeaveHours: number;
};

const MOCK_USER: User = {
  id: "U-2411001",
  name: "坂田 晃輝",
  email: "sakata@example.com",
  department: "プロダクト開発部",
  role: "フルスタックエンジニア",
  location: "大阪/梅田 (JST)",
  employeeCode: "EMP-8821",
  joinedAt: "2024-07-01",
  status: "active",
  manager: "田中 太郎",
  workStyle: "hybrid",
  schedule: {
    start: "09:30",
    end: "18:30",
    breakMinutes: 60,
  },
  memo: "React/Next.js・Spring Boot担当。打刻修正は申請経由。",
};

const MOCK_ATTENDANCE: AttendanceSummary[] = [
  { month: "2025-05", totalHours: 160, overtimeHours: 6, lateCount: 0, paidLeaveHours: 8 },
  { month: "2025-06", totalHours: 168, overtimeHours: 12, lateCount: 1, paidLeaveHours: 0 },
  { month: "2025-07", totalHours: 152, overtimeHours: 4, lateCount: 0, paidLeaveHours: 4 },
  { month: "2025-08", totalHours: 165, overtimeHours: 10, lateCount: 0, paidLeaveHours: 0 },
  { month: "2025-09", totalHours: 172, overtimeHours: 18, lateCount: 2, paidLeaveHours: 0 },
  { month: "2025-10", totalHours: 158, overtimeHours: 5, lateCount: 0, paidLeaveHours: 2 },
];

// 変更前の形（meta付き）に戻しつつ、末尾カンマは避ける
const RECENT_ACTIVITY = [
  { ts: "2025-10-31 18:02", action: "退勤打刻", meta: "PC (Chrome)" },
  { ts: "2025-10-31 09:28", action: "出勤打刻", meta: "スマホ (iOS)" },
  { ts: "2025-10-30 21:04", action: "残業申請 承認", meta: "2.0h" },
  { ts: "2025-10-29 10:02", action: "プロフィール更新", meta: "部署=開発部" }
];

// --- Helpers ---
function statusLabel(s: User["status"]) {
  return s === "active" ? "稼働中" : s === "leave" ? "休職中" : "停止";
}
function labelWorkStyle(w: User["workStyle"]) {
  return w === "remote" ? "フルリモート" : w === "hybrid" ? "ハイブリッド" : "出社";
}
function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium break-words">{value || "—"}</span>
    </div>
  );
}

export default function UserInfoPage() {
  const [user, setUser] = useState<User>(MOCK_USER);
  const [editing, setEditing] = useState(false);

  const joinedDate = new Date(user.joinedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const next: User = {
      ...user,
      name: String(formData.get("name") || user.name),
      email: String(formData.get("email") || user.email),
      department: String(formData.get("department") || user.department),
      role: String(formData.get("role") || user.role),
      location: String(formData.get("location") || user.location),
      manager: String(formData.get("manager") || user.manager),
      workStyle: (String(formData.get("workStyle")) as User["workStyle"]) || user.workStyle,
      schedule: {
        start: String(formData.get("start") || user.schedule.start),
        end: String(formData.get("end") || user.schedule.end),
        breakMinutes: Number(formData.get("break") || user.schedule.breakMinutes),
      },
      memo: String(formData.get("memo") || user.memo),
    };
    setUser(next);
    setEditing(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ユーザ情報</h1>
          <p className="text-sm text-muted-foreground">勤怠・プロフィールの管理</p>
        </div>
        <div className="flex gap-2">
          <Sheet open={editing} onOpenChange={setEditing}>
            <SheetTrigger asChild>
              <Button variant="default" className="rounded-2xl"><Pencil className="mr-2 h-4 w-4"/>編集</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>プロフィール編集</SheetTitle>
                <SheetDescription>基本情報・勤務体系を更新できます</SheetDescription>
              </SheetHeader>
              <form className="grid gap-4 py-4" onSubmit={handleSave}>
                <div className="grid gap-2">
                  <Label htmlFor="name">氏名</Label>
                  <Input id="name" name="name" defaultValue={user.name} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">メール</Label>
                  <Input id="email" name="email" type="email" defaultValue={user.email} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department">部署</Label>
                    <Input id="department" name="department" defaultValue={user.department} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">役割</Label>
                    <Input id="role" name="role" defaultValue={user.role} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">勤務地</Label>
                    <Input id="location" name="location" defaultValue={user.location} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manager">上長</Label>
                    <Input id="manager" name="manager" defaultValue={user.manager} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>勤務形態</Label>
                    <Select name="workStyle" defaultValue={user.workStyle}>
                      <SelectTrigger><SelectValue placeholder="選択"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">フルリモート</SelectItem>
                        <SelectItem value="hybrid">ハイブリッド</SelectItem>
                        <SelectItem value="onsite">出社</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="start">始業</Label>
                    <Input id="start" name="start" defaultValue={user.schedule.start} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end">終業</Label>
                    <Input id="end" name="end" defaultValue={user.schedule.end} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="break">休憩(分)</Label>
                  <Input id="break" name="break" type="number" defaultValue={user.schedule.breakMinutes} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memo">メモ</Label>
                  <Textarea id="memo" name="memo" defaultValue={user.memo} rows={4} />
                </div>
                <SheetFooter className="flex items-center gap-2">
                  <Button type="submit" className="rounded-2xl">保存</Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-2xl"><MoreVertical className="h-4 w-4"/></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>アクション</DropdownMenuLabel>
              <DropdownMenuItem onClick={()=>alert("ダウンロード開始")}><Download className="mr-2 h-4 w-4"/>エクスポート</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4"/>アカウント停止</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile + Summary */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>SK</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{user.role}</Badge>
                <span className="text-xs text-muted-foreground">入社 {joinedDate}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4"/> {user.email}</div>
            <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4"/> {user.department}</div>
            <div className="flex items-center gap-2 text-sm"><User2 className="h-4 w-4"/> 上長: {user.manager}</div>
            <div className="flex items-center gap-2 text-sm"><Briefcase className="h-4 w-4"/> 勤務形態: {labelWorkStyle(user.workStyle)}</div>
            <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4"/> 就業: {user.schedule.start} - {user.schedule.end}（休憩 {user.schedule.breakMinutes}分）</div>
            <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4"/> {user.location}</div>
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">メモ</Label>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{user.memo}</p>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Badge className="rounded-full" variant={user.status === "active" ? "default" : "secondary"}>{statusLabel(user.status)}</Badge>
            <span className="text-xs text-muted-foreground">社員番号: {user.employeeCode}</span>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>サマリ</CardTitle>
            <CardDescription>直近6か月の稼働状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStat title="月間総労働" value={`${MOCK_ATTENDANCE.at(-1)?.totalHours ?? 0} h`} />
                <MiniStat title="月間残業" value={`${MOCK_ATTENDANCE.at(-1)?.overtimeHours ?? 0} h`} />
                <MiniStat title="遅刻回数" value={`${MOCK_ATTENDANCE.at(-1)?.lateCount ?? 0}`} />
                <MiniStat title="有給消化" value={`${MOCK_ATTENDANCE.at(-1)?.paidLeaveHours ?? 0} h`} />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_ATTENDANCE.map(m => ({ month: m.month.slice(5), total: m.totalHours, overtime: m.overtimeHours }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" />
                    <Line type="monotone" dataKey="overtime" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary + Activity (no Tabs, just stacked) */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>月次サマリ</CardTitle>
            <CardDescription>総労働/残業/有給消化</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_ATTENDANCE.map(m => ({
                  month: m.month.slice(5),
                  total: m.totalHours,
                  overtime: m.overtimeHours,
                  paid: m.paidLeaveHours,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" />
                  <Bar dataKey="overtime" />
                  <Bar dataKey="paid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>月</TableHead>
                  <TableHead className="text-right">総労働(h)</TableHead>
                  <TableHead className="text-right">残業(h)</TableHead>
                  <TableHead className="text-right">遅刻(回)</TableHead>
                  <TableHead className="text-right">有給(h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ATTENDANCE.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">{m.month}</TableCell>
                    <TableCell className="text-right">{m.totalHours}</TableCell>
                    <TableCell className="text-right">{m.overtimeHours}</TableCell>
                    <TableCell className="text-right">{m.lateCount}</TableCell>
                    <TableCell className="text-right">{m.paidLeaveHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4"/>CSVエクスポート</Button>
            <Button variant="outline"><CalendarDays className="mr-2 h-4 w-4"/>勤怠カレンダーへ</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>打刻/活動履歴</CardTitle>
            <CardDescription>最新の操作を表示</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">日時</TableHead>
                  <TableHead>イベント</TableHead>
                  <TableHead>詳細</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_ACTIVITY.map((r, i) => (
                  <TableRow key={`${r.ts}-${i}`}>
                    <TableCell className="font-medium">{r.ts}</TableCell>
                    <TableCell>{r.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.meta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <SelfTests />
    </div>
  );
}

