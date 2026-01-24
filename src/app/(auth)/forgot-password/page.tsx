'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">שחזור סיסמה</CardTitle>
        <CardDescription>פיצ׳ר זה יהיה זמין בקרוב</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6">
          כרגע ניתן ליצור קשר עם מנהל המערכת לאיפוס הסיסמה.
        </p>
        <Link href="/login">
          <Button variant="outline">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה להתחברות
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
