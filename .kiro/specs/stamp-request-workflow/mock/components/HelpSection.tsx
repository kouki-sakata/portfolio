import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";
import { HelpCircle, ExternalLink } from "lucide-react";

export function HelpSection() {
  const faqs = [
    {
      id: "1",
      question: "申請理由の記入ルール",
      answer:
        "申請理由は具体的かつ簡潔に記入してください。最低20文字以上、200文字以内で記載が必要です。例：「打刻忘れのため」「システムエラーにより正しく記録されなかったため」など。",
    },
    {
      id: "2",
      question: "時刻の整合条件について",
      answer:
        "出勤時刻は退勤時刻よりも前である必要があります。また、休憩時間は勤務時間内に設定する必要があります。深夜勤務の場合は、日付を跨ぐ設定も可能です。",
    },
    {
      id: "3",
      question: "申請のキャンセル可否",
      answer:
        "「保留中（Pending）」ステータスの申請のみキャンセル可能です。承認済み、却下済みの申請はキャンセルできません。キャンセルが必要な場合は、新規で修正申請を提出してください。",
    },
    {
      id: "4",
      question: "承認にかかる時間の目安",
      answer:
        "通常、申請から承認まで1〜3営業日かかります。緊急の場合は、申請時に「緊急」フラグを設定し、直接管理者に連絡してください。平均処理時間は24時間です。",
    },
    {
      id: "5",
      question: "なぜ却下されたのか",
      answer:
        "却下理由は申請詳細画面で確認できます。主な却下理由：①申請理由が不明瞭、②時刻の整合性がない、③必要な承認者の承認が得られていない、④申請期限を過ぎている。詳細は管理者に問い合わせてください。",
    },
  ];

  const supportLinks = [
    { label: "申請マニュアル", url: "#" },
    { label: "よくある質問", url: "#" },
    { label: "サポートに問い合わせ", url: "#" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          ルール & ヘルプ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="pt-4 border-t space-y-2">
          <div className="text-sm text-gray-600 mb-3">サポート記事</div>
          {supportLinks.map((link, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between"
              onClick={() => window.open(link.url, "_blank")}
            >
              {link.label}
              <ExternalLink className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
