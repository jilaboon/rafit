'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreHorizontal,
  Clock,
  Users,
  CreditCard,
  Dumbbell,
  User,
  Calendar,
  Star,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// Mock data - will be replaced with real API data
const mockServices = [
  {
    id: '1',
    name: 'יוגה',
    description: 'שיעור יוגה מרגיע לכל הרמות',
    type: 'GROUP_CLASS',
    duration: 60,
    capacity: 20,
    price: 60,
    creditCost: 1,
    color: '#8b5cf6',
    isActive: true,
    classCount: 12,
  },
  {
    id: '2',
    name: 'פילאטיס',
    description: 'אימון פילאטיס לחיזוק הליבה',
    type: 'GROUP_CLASS',
    duration: 55,
    capacity: 15,
    price: 65,
    creditCost: 1,
    color: '#ec4899',
    isActive: true,
    classCount: 8,
  },
  {
    id: '3',
    name: 'HIIT',
    description: 'אימון אינטרוולים בעצימות גבוהה',
    type: 'GROUP_CLASS',
    duration: 45,
    capacity: 15,
    price: 55,
    creditCost: 1,
    color: '#ef4444',
    isActive: true,
    classCount: 6,
  },
  {
    id: '4',
    name: 'אימון אישי',
    description: 'אימון פרטני מותאם אישית',
    type: 'PERSONAL',
    duration: 60,
    capacity: 1,
    price: 200,
    creditCost: 3,
    color: '#f59e0b',
    isActive: true,
    classCount: 0,
  },
  {
    id: '5',
    name: 'סדנת מדיטציה',
    description: 'סדנה מיוחדת לטכניקות מדיטציה',
    type: 'WORKSHOP',
    duration: 120,
    capacity: 25,
    price: 150,
    creditCost: 2,
    color: '#10b981',
    isActive: false,
    classCount: 0,
  },
];

const typeLabels: Record<string, { label: string; icon: typeof Dumbbell }> = {
  GROUP_CLASS: { label: 'שיעור קבוצתי', icon: Users },
  PERSONAL: { label: 'אימון אישי', icon: User },
  WORKSHOP: { label: 'סדנה', icon: Star },
  COURSE: { label: 'קורס', icon: Calendar },
};

export default function ServicesPage() {
  const activeServices = mockServices.filter((s) => s.isActive);
  const inactiveServices = mockServices.filter((s) => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">שירותים</h1>
          <p className="text-muted-foreground">ניהול סוגי שיעורים ואימונים</p>
        </div>
        <Link href="/dashboard/services/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            שירות חדש
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockServices.length}</p>
              <p className="text-sm text-muted-foreground">סה&quot;כ שירותים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-success/10 p-2">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockServices.filter((s) => s.type === 'GROUP_CLASS').length}
              </p>
              <p className="text-sm text-muted-foreground">שיעורים קבוצתיים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-secondary/10 p-2">
              <User className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockServices.filter((s) => s.type === 'PERSONAL').length}
              </p>
              <p className="text-sm text-muted-foreground">אימונים אישיים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-2">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockServices.reduce((sum, s) => sum + s.classCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">שיעורים שבועיים</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">שירותים פעילים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeServices.map((service) => {
              const TypeIcon = typeLabels[service.type]?.icon || Dumbbell;
              return (
                <Card key={service.id} className="overflow-hidden">
                  <div className="flex">
                    <div
                      className="w-2"
                      style={{ backgroundColor: service.color }}
                    />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/services/${service.id}`}>
                                עריכה
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>שכפול</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              השבתה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TypeIcon className="h-4 w-4" />
                          {typeLabels[service.type]?.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {service.duration} דקות
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          עד {service.capacity}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(service.price)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {service.creditCost} קרדיט
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              שירותים לא פעילים ({inactiveServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: service.color }}
                    />
                    <span>{service.name}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    הפעל
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
