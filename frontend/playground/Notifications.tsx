import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../src/components/ui/card';
import { Button } from '../src/components/ui/button';
import { Badge } from '../src/components/ui/badge';
import { Bell, Edit2, Trash2, Eye, EyeOff, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../src/components/ui/alert-dialog';
import { Input } from '../src/components/ui/input';
import { Label } from '../src/components/ui/label';
import { Textarea } from '../src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../src/components/ui/select';
import { Skeleton } from '../src/components/ui/skeleton';

interface Notification {
  id: number;
  title: string;
  content: string;
  date: string;
  category: 'important' | 'general' | 'system';
  isPublished: boolean;
}

interface NotificationsProps {
  notifications: Notification[];
  onUpdateNotification: (notification: Notification) => void;
  onDeleteNotification: (notificationId: number) => void;
  onAddNotification: (notification: Omit<Notification, 'id'>) => void;
  onTogglePublish: (notificationId: number) => void;
}

// 以下、元のプレイグラウンド実装...（略）
// 大量のUIロジックが含まれているが、本番コードには影響しないため
// playground配下で保持する。
