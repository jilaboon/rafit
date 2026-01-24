'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Check, Clock, Users, UserCheck, AlertCircle } from 'lucide-react';
import { cn, getInitials, formatTime } from '@/lib/utils';

// Mock data - current class
const currentClass = {
  id: '1',
  name: 'יוגה בוקר',
  startTime: new Date(2024, 0, 15, 7, 0),
  endTime: new Date(2024, 0, 15, 8, 0),
  coach: 'דנה שמש',
  room: 'אולם יוגה',
  capacity: 20,
};

const mockAttendees = [
  {
    id: '1',
    bookingId: 'b1',
    name: 'רחל דוידוביץ',
    email: 'rachel@example.com',
    membershipType: 'מנוי חודשי',
    checkedIn: true,
    checkedInAt: new Date(2024, 0, 15, 6, 55),
  },
  {
    id: '2',
    bookingId: 'b2',
    name: 'אורי כהן',
    email: 'ori@example.com',
    membershipType: 'כרטיסייה (6/10)',
    checkedIn: false,
  },
  {
    id: '3',
    bookingId: 'b3',
    name: 'יעל אברהם',
    email: 'yael@example.com',
    membershipType: 'ניסיון',
    checkedIn: false,
  },
  {
    id: '4',
    bookingId: 'b4',
    name: 'דני לוי',
    email: 'dani@example.com',
    membershipType: 'מנוי חודשי',
    checkedIn: true,
    checkedInAt: new Date(2024, 0, 15, 6, 58),
  },
  {
    id: '5',
    bookingId: 'b5',
    name: 'שרה מזרחי',
    email: 'sarah@example.com',
    membershipType: 'מנוי חודשי',
    checkedIn: false,
  },
];

export default function CheckinPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [attendees, setAttendees] = useState(mockAttendees);

  const filteredAttendees = attendees.filter(
    (a) =>
      a.name.includes(searchQuery) ||
      a.email.includes(searchQuery)
  );

  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const pendingCount = attendees.filter((a) => !a.checkedIn).length;

  const handleCheckin = async (bookingId: string) => {
    // In real app, this would call the API
    setAttendees((prev) =>
      prev.map((a) =>
        a.bookingId === bookingId
          ? { ...a, checkedIn: true, checkedInAt: new Date() }
          : a
      )
    );
  };

  const handleUndoCheckin = async (bookingId: string) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.bookingId === bookingId
          ? { ...a, checkedIn: false, checkedInAt: undefined }
          : a
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Class Header */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{currentClass.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-primary-foreground/80">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(currentClass.startTime)} - {formatTime(currentClass.endTime)}
                </span>
                <span>מדריך: {currentClass.coach}</span>
                <span>אולם: {currentClass.room}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{checkedInCount}</p>
                <p className="text-sm text-primary-foreground/80">נכחו</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{pendingCount}</p>
                <p className="text-sm text-primary-foreground/80">ממתינים</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{currentClass.capacity}</p>
                <p className="text-sm text-primary-foreground/80">קיבולת</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-success/10 p-2">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{checkedInCount}</p>
              <p className="text-sm text-muted-foreground">עשו צ&apos;ק-אין</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-2">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">ממתינים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round((checkedInCount / currentClass.capacity) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">תפוסה</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="חפש לפי שם או אימייל..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendees List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">רשימת משתתפים</CardTitle>
          <CardDescription>לחץ על שם כדי לעשות צ&apos;ק-אין</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAttendees.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">לא נמצאו משתתפים</p>
              </div>
            ) : (
              filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4 transition-colors',
                    attendee.checkedIn
                      ? 'border-success/50 bg-success/5'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback
                        className={cn(
                          attendee.checkedIn ? 'bg-success text-success-foreground' : ''
                        )}
                      >
                        {attendee.checkedIn ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          getInitials(attendee.name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{attendee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {attendee.membershipType}
                      </p>
                      {attendee.checkedIn && attendee.checkedInAt && (
                        <p className="text-xs text-success">
                          נכנס ב-{formatTime(attendee.checkedInAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {attendee.checkedIn ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUndoCheckin(attendee.bookingId)}
                    >
                      בטל צ&apos;ק-אין
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => handleCheckin(attendee.bookingId)}
                    >
                      <Check className="ml-2 h-5 w-5" />
                      צ&apos;ק-אין
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Users className="ml-2 h-4 w-4" />
              הוסף Walk-in
            </Button>
            <Button variant="outline">סמן הכל כנוכחים</Button>
            <Button variant="outline">סיים שיעור</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
