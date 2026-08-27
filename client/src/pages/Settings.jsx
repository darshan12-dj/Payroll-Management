import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Building2, Wallet, UserCog, Upload } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Avatar from '../components/common/Avatar';
import { Label, Input, Select, FormGroup } from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import * as settingsService from '../services/settingsService';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { getErrorMessage } from '../services/api';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const isAdmin = user.role === 'admin';
  const [tab, setTab] = useState(isAdmin ? 'company' : 'account');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage company, payroll, and account settings.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {isAdmin && (
          <TabButton active={tab === 'company'} onClick={() => setTab('company')} icon={Building2}>
            Company Settings
          </TabButton>
        )}
        {isAdmin && (
          <TabButton active={tab === 'payroll'} onClick={() => setTab('payroll')} icon={Wallet}>
            Payroll Settings
          </TabButton>
        )}
        <TabButton active={tab === 'account'} onClick={() => setTab('account')} icon={UserCog}>
          My Account
        </TabButton>
      </div>

      {tab === 'company' && isAdmin && <CompanySettings />}
      {tab === 'payroll' && isAdmin && <PayrollSettings />}
      {tab === 'account' && <AccountSettings user={user} refreshUser={refreshUser} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function CompanySettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((res) => setForm(res.data.data)).catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings({
        companyName: form.companyName,
        address: form.address,
        email: form.email,
        phone: form.phone,
      });
      toast.success('Company settings updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Spinner label="Loading settings..." />;

  return (
    <Card title="Company Information">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormGroup>
          <Label>Company Name</Label>
          <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
        </FormGroup>
        <FormGroup>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </FormGroup>
        <FormGroup>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </FormGroup>
        <FormGroup className="sm:col-span-2">
          <Label>Address</Label>
          <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </FormGroup>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Logo upload can be connected to an external asset storage service (e.g. S3, Cloudinary) — for now, paste a hosted logo URL directly into the database via the Settings API.
      </p>
      <div className="mt-4 flex justify-end">
        <Button icon={Save} loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>
    </Card>
  );
}

function PayrollSettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((res) => setForm(res.data.data.payrollSettings)).catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings({ payrollSettings: form });
      toast.success('Payroll settings updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Spinner label="Loading settings..." />;

  return (
    <Card title="Payroll Configuration">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormGroup>
          <Label>Default Pay Date (day of month)</Label>
          <Input type="number" min="1" max="28" value={form.defaultPayDate} onChange={(e) => setForm((f) => ({ ...f, defaultPayDate: Number(e.target.value) }))} />
        </FormGroup>
        <FormGroup>
          <Label>Working Days Per Month</Label>
          <Input type="number" min="1" max="31" value={form.workingDaysPerMonth} onChange={(e) => setForm((f) => ({ ...f, workingDaysPerMonth: Number(e.target.value) }))} />
        </FormGroup>
        <FormGroup>
          <Label>Default Overtime Rate (per hour)</Label>
          <Input type="number" min="0" value={form.overtimeRatePerHour} onChange={(e) => setForm((f) => ({ ...f, overtimeRatePerHour: Number(e.target.value) }))} />
        </FormGroup>
        <FormGroup>
          <Label>Payroll Cycle</Label>
          <Select value={form.payrollCycle} onChange={(e) => setForm((f) => ({ ...f, payrollCycle: e.target.value }))}>
            <option>Monthly</option>
            <option>Bi-Weekly</option>
            <option>Weekly</option>
          </Select>
        </FormGroup>
      </div>
      <div className="mt-4 flex justify-end">
        <Button icon={Save} loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>
    </Card>
  );
}

function AccountSettings({ user, refreshUser }) {
  const [name, setName] = useState(user.name);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user.profilePhoto || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [firstName, lastName] = name.split(' ');

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (photoFile) fd.append('profilePhoto', photoFile);
      await userService.updateMyProfile(fd);
      await refreshUser();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Profile">
        <div className="mb-4 flex items-center gap-4">
          <Avatar src={photoPreview} firstName={firstName} lastName={lastName} size={64} />
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormGroup>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </FormGroup>
        </div>
        <div className="mt-4 flex justify-end">
          <Button icon={Save} loading={savingProfile} onClick={handleSaveProfile}>Save Profile</Button>
        </div>
      </Card>

      <Card title="Change Password">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormGroup>
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </FormGroup>
        </div>
        <div className="mt-4 flex justify-end">
          <Button icon={Save} loading={savingPassword} onClick={handleChangePassword}>Update Password</Button>
        </div>
      </Card>
    </div>
  );
}
