import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Zap,
  Shield,
  ChevronLeft,
  Star,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="brand-name text-lg font-bold text-primary-foreground">R</span>
            </div>
            <span className="brand-name text-xl font-bold">RAFIT</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              תכונות
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              מחירים
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary">
              צור קשר
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">התחברות</Button>
            </Link>
            <Link href="/register">
              <Button>התחל עכשיו</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 text-center md:py-32">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Star className="ml-2 h-4 w-4" />
            מערכת ניהול סטודיו #1 בישראל
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            נהל את הסטודיו שלך
            <span className="block text-primary">בקלות ובמקצועיות</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            <span className="brand-name">RAFIT</span> מאפשרת לך לנהל לוח זמנים, חברויות, תשלומים ולקוחות
            - הכל במקום אחד. חסוך זמן והתמקד במה שחשוב באמת: המתאמנים שלך.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="xl" className="w-full sm:w-auto">
                התחל תקופת ניסיון חינם
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                צפה בהדגמה
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            ללא כרטיס אשראי · 14 ימי ניסיון חינם · ביטול בכל עת
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            כל מה שצריך לניהול סטודיו מצליח
          </h2>
          <p className="mt-4 text-muted-foreground">
            תכונות מתקדמות שעוזרות לך להתמקד בצמיחת העסק
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>ניהול לוח זמנים</CardTitle>
              <CardDescription>
                לוח זמנים חכם עם תמיכה בשיעורים קבוצתיים, אימונים אישיים וסדנאות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• שיעורים חוזרים אוטומטיים</li>
                <li>• ניהול רשימת המתנה</li>
                <li>• תזכורות אוטומטיות</li>
                <li>• צ&apos;ק-אין דיגיטלי</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>ניהול לקוחות (CRM)</CardTitle>
              <CardDescription>
                תמונה מלאה על כל לקוח: היסטוריה, העדפות, תשלומים ועוד
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• פרופיל לקוח מקיף</li>
                <li>• תיוג וסגמנטציה</li>
                <li>• מעקב לידים</li>
                <li>• משימות ותזכורות</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
              <CardTitle>תשלומים וחברויות</CardTitle>
              <CardDescription>
                גביית תשלומים אוטומטית, מנויים, כרטיסיות ורכישות חד פעמיות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• חיוב אוטומטי חודשי</li>
                <li>• כרטיסיות וקרדיטים</li>
                <li>• חשבוניות אוטומטיות</li>
                <li>• ניהול החזרים</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <BarChart3 className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>דוחות ואנליטיקה</CardTitle>
              <CardDescription>
                קבל תמונה מלאה על הביצועים העסקיים שלך בזמן אמת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• דוחות הכנסות</li>
                <li>• ניתוח שימור לקוחות</li>
                <li>• ניצולת מדריכים</li>
                <li>• מגמות ותחזיות</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>אוטומציות שיווקיות</CardTitle>
              <CardDescription>
                שלח הודעות אוטומטיות בזמן הנכון ללקוחות הנכונים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• תזכורות לפני שיעור</li>
                <li>• ברכות יום הולדת</li>
                <li>• Win-back קמפיינים</li>
                <li>• הודעות מותאמות אישית</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>אבטחה ופרטיות</CardTitle>
              <CardDescription>
                הגנה מרבית על המידע שלך ושל הלקוחות שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• הצפנת נתונים</li>
                <li>• גיבויים אוטומטיים</li>
                <li>• תאימות GDPR</li>
                <li>• יומני ביקורת</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            מוכן להתחיל?
          </h2>
          <p className="mt-4 text-muted-foreground">
            הצטרף למאות סטודיואים שכבר משתמשים ב-<span className="brand-name">RAFIT</span>
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="xl">
                התחל תקופת ניסיון חינם
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="brand-name text-sm font-bold text-primary-foreground">R</span>
              </div>
              <span className="brand-name font-bold">RAFIT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} <span className="brand-name">RAFIT</span>. כל הזכויות שמורות.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                מדיניות פרטיות
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                תנאי שימוש
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
