import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Label, Input, Select, FormGroup, FieldError } from '../../components/ui/FormField';
import Avatar from '../../components/common/Avatar';
import * as employeeService from '../../services/employeeService';
import * as departmentService from '../../services/departmentService';
import { getErrorMessage } from '../../services/api';

const EMPTY_FORM = {
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'Male',
  address: { street: '', city: '', state: '', zip: '', country: 'USA' },
  department: '',
  position: '',
  joiningDate: '',
  employmentType: 'Full-time',
  basicSalary: '',
  bankDetails: { accountNumber: '', ifsc: '', bankName: '' },
  pan: '',
  pfNumber: '',
  taxInfo: { taxId: '', taxRegime: 'Standard' },
};

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [departments, setDepartments] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    departmentService.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    employeeService
      .getEmployee(id)
      .then((res) => {
        const e = res.data.data;
        setForm({
          employeeId: e.employeeId,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phone: e.phone,
          dateOfBirth: toDateInput(e.dateOfBirth),
          gender: e.gender,
          address: e.address || EMPTY_FORM.address,
          department: e.department?._id || e.department || '',
          position: e.position,
          joiningDate: toDateInput(e.joiningDate),
          employmentType: e.employmentType,
          basicSalary: e.basicSalary,
          bankDetails: e.bankDetails || EMPTY_FORM.bankDetails,
          pan: e.pan || '',
          pfNumber: e.pfNumber || '',
          taxInfo: e.taxInfo || EMPTY_FORM.taxInfo,
        });
        setPhotoPreview(e.profilePhoto || '');
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const updateNested = (group, field, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [field]: value } }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'A valid email is required.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    if (!form.dateOfBirth) next.dateOfBirth = 'Date of birth is required.';
    if (!form.department) next.department = 'Department is required.';
    if (!form.position.trim()) next.position = 'Position is required.';
    if (!form.joiningDate) next.joiningDate = 'Joining date is required.';
    if (!form.basicSalary || Number(form.basicSalary) <= 0) next.basicSalary = 'Basic salary must be a positive number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          fd.append(key, JSON.stringify(value));
        } else if (value !== '' && value !== null && value !== undefined) {
          fd.append(key, value);
        }
      });
      if (photoFile) fd.append('profilePhoto', photoFile);

      if (isEdit) {
        await employeeService.updateEmployee(id, fd);
        toast.success('Employee updated successfully.');
      } else {
        await employeeService.createEmployee(fd);
        toast.success('Employee added successfully.');
      }
      navigate('/employees');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullHeight label="Loading employee..." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/employees" className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to employees
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title="Profile Photo" className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar src={photoPreview} firstName={form.firstName} lastName={form.lastName} size={64} />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Upload className="h-4 w-4" /> Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
        </Card>

        <Card title="Basic Information" className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label>Employee ID</Label>
              <Input value={form.employeeId} placeholder="Auto-generated if left blank" onChange={(e) => update('employeeId', e.target.value)} disabled={isEdit} />
            </FormGroup>
            <FormGroup>
              <Label required>Gender</Label>
              <Select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label required>First Name</Label>
              <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} error={errors.firstName} />
              <FieldError>{errors.firstName}</FieldError>
            </FormGroup>
            <FormGroup>
              <Label required>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} error={errors.lastName} />
              <FieldError>{errors.lastName}</FieldError>
            </FormGroup>
            <FormGroup>
              <Label required>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} />
              <FieldError>{errors.email}</FieldError>
            </FormGroup>
            <FormGroup>
              <Label required>Phone</Label>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} />
              <FieldError>{errors.phone}</FieldError>
            </FormGroup>
            <FormGroup>
              <Label required>Date of Birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} error={errors.dateOfBirth} />
              <FieldError>{errors.dateOfBirth}</FieldError>
            </FormGroup>
          </div>
        </Card>

        <Card title="Address" className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormGroup className="sm:col-span-2">
              <Label>Street</Label>
              <Input value={form.address.street} onChange={(e) => updateNested('address', 'street', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>City</Label>
              <Input value={form.address.city} onChange={(e) => updateNested('address', 'city', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>State</Label>
              <Input value={form.address.state} onChange={(e) => updateNested('address', 'state', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>ZIP Code</Label>
              <Input value={form.address.zip} onChange={(e) => updateNested('address', 'zip', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Country</Label>
              <Input value={form.address.country} onChange={(e) => updateNested('address', 'country', e.target.value)} />
            </FormGroup>
          </div>
        </Card>

        <Card title="Employment Details" className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label required>Department</Label>
              <Select value={form.department} onChange={(e) => update('department', e.target.value)} error={errors.department}>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </Select>
              <FieldError>{errors.department}</FieldError>
            </FormGroup>
            <FormGroup>
              <Label required>Position</Label>
              <Input value={form.position} onChange={(e) => update('position', e.target.value)} error={errors.position} />
              <FieldError>{errors.position}</FieldError>
            </FormGroup>
            <FormGroup>
              <Label required>Joining Date</Label>
              <Input type="date" value={form.joiningDate} onChange={(e) => update('joiningDate', e.target.value)} error={errors.joiningDate} />
              <FieldError>{errors.joiningDate}</FieldError>
            </FormGroup>
            <FormGroup>
              <Label required>Employment Type</Label>
              <Select value={form.employmentType} onChange={(e) => update('employmentType', e.target.value)}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Intern</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label required>Basic Salary (USD / month)</Label>
              <Input type="number" min="0" step="0.01" value={form.basicSalary} onChange={(e) => update('basicSalary', e.target.value)} error={errors.basicSalary} />
              <FieldError>{errors.basicSalary}</FieldError>
            </FormGroup>
          </div>
        </Card>

        <Card title="Banking & Tax Information" className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label>Bank Account Number</Label>
              <Input value={form.bankDetails.accountNumber} onChange={(e) => updateNested('bankDetails', 'accountNumber', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Routing / IFSC Code</Label>
              <Input value={form.bankDetails.ifsc} onChange={(e) => updateNested('bankDetails', 'ifsc', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Bank Name</Label>
              <Input value={form.bankDetails.bankName} onChange={(e) => updateNested('bankDetails', 'bankName', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>PAN / Tax ID</Label>
              <Input value={form.pan} onChange={(e) => update('pan', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>PF Number</Label>
              <Input value={form.pfNumber} onChange={(e) => update('pfNumber', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Tax Regime</Label>
              <Input value={form.taxInfo.taxRegime} onChange={(e) => updateNested('taxInfo', 'taxRegime', e.target.value)} />
            </FormGroup>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
            Cancel
          </Button>
          <Button type="submit" icon={Save} loading={saving}>
            {isEdit ? 'Save Changes' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
