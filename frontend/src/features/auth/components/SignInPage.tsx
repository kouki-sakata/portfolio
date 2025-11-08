import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import Logo from "@/components/Logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const SignInPage = () => {
  return (
    <div className="relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute">
        <AuthBackgroundShape />
      </div>
      <Card className="z-10 w-full border-none shadow-md sm:max-w-lg">
        <CardHeader className="gap-6">
          <Logo className="gap-3" />
          <div>
            <CardTitle className="mb-1.5 text-2xl">
              TeamDevelop Bravo にサインイン
            </CardTitle>
            <CardDescription className="text-base">
              勤怠管理システムにログインしてください。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Login Buttons */}
          <div className="mb-6 flex flex-wrap gap-4 sm:gap-6" />
          {/* Login Form */}
          <div className="space-y-4">
            <LoginForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
