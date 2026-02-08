'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, UserPlus, Shield, Trash2, Edit, Briefcase } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { usePermissions, PermissionGate } from '@/hooks/use-permissions';
import { ROLE_LABELS, getAssignableRoles, ROLE_HIERARCHY } from '@/lib/auth/rbac';

interface TeamMember {
  id: string;
  tenantUserId: string;
  userId: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  userStatus: string;
  joinedAt: string;
  hasStaffProfile?: boolean;
  staffProfileTitle?: string | null;
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { role, can, user } = usePermissions();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [staffProfileDialogOpen, setStaffProfileDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { data, isLoading } = useQuery<{ users: TeamMember[] }>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await fetch('/api/tenants/users');
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    },
  });

  const members = data?.users ?? [];

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/tenants/users/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleRemoveMember = (member: TeamMember) => {
    if (!confirm(`האם אתה בטוח שברצונך להסיר את ${member.name} מהצוות?`)) return;
    removeMutation.mutate(member.id);
  };

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    setEditDialogOpen(true);
  };

  const handleManageStaffProfile = (member: TeamMember) => {
    setSelectedMember(member);
    setStaffProfileDialogOpen(true);
  };

  // Roles that can have staff profiles
  const staffRoles: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'COACH'];

  const assignableRoles = role ? getAssignableRoles(role as UserRole) : [];
  const canInvite = can('user:create');
  const canEditRole = can('user:role');
  const canDelete = can('user:delete');
  const canManageStaff = can('staff:update');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ניהול צוות</h1>
          <p className="text-muted-foreground mt-1">
            ניהול חברי הצוות והרשאות
          </p>
        </div>
        <PermissionGate permission="user:create">
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 ml-2" />
            הזמן חבר צוות
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>חברי הצוות</CardTitle>
          <CardDescription>
            {members.length} חברי צוות
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>משתמש</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>הצטרף</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={member.isActive ? 'default' : 'secondary'}
                      >
                        {member.isActive ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString('he-IL')}
                    </TableCell>
                    <TableCell>
                      {member.userId !== user?.id && (canEditRole || canDelete || canManageStaff) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditRole && (
                              <DropdownMenuItem onClick={() => handleEditRole(member)}>
                                <Edit className="h-4 w-4 ml-2" />
                                שנה תפקיד
                              </DropdownMenuItem>
                            )}
                            {canManageStaff && staffRoles.includes(member.role) && (
                              <DropdownMenuItem onClick={() => handleManageStaffProfile(member)}>
                                <Briefcase className="h-4 w-4 ml-2" />
                                {member.hasStaffProfile ? 'ערוך פרופיל מדריך' : 'צור פרופיל מדריך'}
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveMember(member)}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  הסר מהצוות
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      אין חברי צוות
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        assignableRoles={assignableRoles}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['team-members'] });
          setInviteDialogOpen(false);
        }}
      />

      {/* Edit Role Dialog */}
      {selectedMember && (
        <EditRoleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          member={selectedMember}
          assignableRoles={assignableRoles}
          currentUserRole={role as UserRole}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            setEditDialogOpen(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Staff Profile Dialog */}
      {selectedMember && (
        <StaffProfileDialog
          open={staffProfileDialogOpen}
          onOpenChange={setStaffProfileDialogOpen}
          member={selectedMember}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            setStaffProfileDialogOpen(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
}

// Invite User Dialog Component
function InviteUserDialog({
  open,
  onOpenChange,
  assignableRoles,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableRoles: UserRole[];
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '' as UserRole | '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenants/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      setFormData({ email: '', name: '', role: '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הזמן חבר צוות חדש</DialogTitle>
          <DialogDescription>
            שלח הזמנה לאדם חדש להצטרף לצוות
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="הכנס שם מלא"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">תפקיד</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading || !formData.role}>
              {isLoading ? 'שולח...' : 'שלח הזמנה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Role Dialog Component
function EditRoleDialog({
  open,
  onOpenChange,
  member,
  assignableRoles,
  currentUserRole,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  assignableRoles: UserRole[];
  currentUserRole: UserRole;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(member.role);

  // Include current role in the list if it's assignable or user is owner
  const availableRoles = currentUserRole === 'OWNER'
    ? (['ADMIN', 'MANAGER', 'COACH', 'FRONT_DESK', 'ACCOUNTANT', 'READ_ONLY'] as UserRole[])
    : assignableRoles;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/users/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>שנה תפקיד</DialogTitle>
          <DialogDescription>
            שנה את התפקיד של {member.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>תפקיד נוכחי</Label>
              <Badge variant="outline" className="w-fit">
                {ROLE_LABELS[member.role]}
              </Badge>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newRole">תפקיד חדש</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading || selectedRole === member.role}>
              {isLoading ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Staff Profile Dialog Component
function StaffProfileDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    specialties: [] as string[],
    certifications: [] as string[],
    hourlyRate: '',
    color: '#3b82f6',
    isPublic: true,
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    if (open) {
      fetchStaffProfile();
    }
  }, [open, member.id]);

  const fetchStaffProfile = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/tenants/users/${member.id}/staff-profile`);
      const data = await response.json();
      if (response.ok && data.staffProfile) {
        setFormData({
          title: data.staffProfile.title || '',
          bio: data.staffProfile.bio || '',
          specialties: data.staffProfile.specialties || [],
          certifications: data.staffProfile.certifications || [],
          hourlyRate: data.staffProfile.hourlyRate?.toString() || '',
          color: data.staffProfile.color || '#3b82f6',
          isPublic: data.staffProfile.isPublic ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to fetch staff profile:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/users/${member.id}/staff-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || null,
          bio: formData.bio || null,
          specialties: formData.specialties,
          certifications: formData.certifications,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          color: formData.color,
          isPublic: formData.isPublic,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff profile');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({ ...formData, specialties: [...formData.specialties, newSpecialty.trim()] });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (s: string) => {
    setFormData({ ...formData, specialties: formData.specialties.filter((x) => x !== s) });
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, newCertification.trim()] });
      setNewCertification('');
    }
  };

  const removeCertification = (c: string) => {
    setFormData({ ...formData, certifications: formData.certifications.filter((x) => x !== c) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>פרופיל מדריך - {member.name}</DialogTitle>
          <DialogDescription>
            {member.hasStaffProfile ? 'עריכת פרופיל מדריך' : 'יצירת פרופיל מדריך חדש'}
          </DialogDescription>
        </DialogHeader>
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staffTitle">תואר / תפקיד</Label>
                <Input
                  id="staffTitle"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="מדריך יוגה בכיר"
                />
              </div>

              <div className="grid gap-2">
                <Label>התמחויות</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="הוסף התמחות"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty(); }}}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addSpecialty}>+</Button>
                </div>
                {formData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.specialties.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        {s}
                        <button type="button" onClick={() => removeSpecialty(s)} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>הסמכות</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="הוסף הסמכה"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); }}}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addCertification}>+</Button>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.certifications.map((c) => (
                      <Badge key={c} variant="outline" className="gap-1">
                        {c}
                        <button type="button" onClick={() => removeCertification(c)} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="staffRate">תעריף לשעה (₪)</Label>
                  <Input
                    id="staffRate"
                    type="number"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="150"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staffColor">צבע</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="staffColor"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'שומר...' : 'שמור'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
