'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ChevronLeft, Shield } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { UserRole } from '@prisma/client';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
}

interface TeamOverviewWidgetProps {
  limit?: number;
  showViewAll?: boolean;
}

export function TeamOverviewWidget({ limit = 5, showViewAll = true }: TeamOverviewWidgetProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const response = await fetch('/api/tenants/users');
        const data = await response.json();
        if (response.ok) {
          setMembers(data.users.slice(0, limit));
          setTotalCount(data.users.length);
        }
      } catch (error) {
        console.error('Failed to fetch team:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, [limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          הצוות שלי
          {totalCount > 0 && (
            <Badge variant="secondary" className="mr-2">
              {totalCount}
            </Badge>
          )}
        </CardTitle>
        {showViewAll && (
          <Link href="/dashboard/team">
            <Button variant="ghost" size="sm">
              ניהול צוות
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            אין חברי צוות
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {ROLE_LABELS[member.role]}
                </Badge>
              </div>
            ))}
            {totalCount > limit && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                +{totalCount - limit} נוספים
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
