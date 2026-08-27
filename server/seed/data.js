// Static reference data used to generate realistic demo records.

const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG', description: 'Product engineering, platform, and infrastructure teams.' },
  { name: 'Human Resources', code: 'HR', description: 'Talent acquisition, employee relations, and HR operations.' },
  { name: 'Finance', code: 'FIN', description: 'Accounting, payroll, and financial planning.' },
  { name: 'IT', code: 'IT', description: 'Internal systems, security, and technical support.' },
  { name: 'Marketing', code: 'MKT', description: 'Brand, content, growth, and demand generation.' },
  { name: 'Operations', code: 'OPS', description: 'Business operations and process management.' },
  { name: 'Sales', code: 'SALES', description: 'New business, account management, and partnerships.' },
];

const POSITIONS_BY_DEPT = {
  ENG: ['Software Engineer', 'Senior Software Engineer', 'Engineering Manager', 'QA Engineer', 'DevOps Engineer'],
  HR: ['HR Generalist', 'HR Manager', 'Recruiter', 'HR Coordinator'],
  FIN: ['Accountant', 'Financial Analyst', 'Payroll Manager', 'Finance Manager'],
  IT: ['IT Support Specialist', 'Systems Administrator', 'IT Manager', 'Network Engineer'],
  MKT: ['Marketing Specialist', 'Content Strategist', 'Marketing Manager', 'SEO Analyst'],
  OPS: ['Operations Analyst', 'Operations Manager', 'Business Analyst'],
  SALES: ['Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Rep'],
};

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Steven', 'Sandra',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
];

module.exports = { DEPARTMENTS, POSITIONS_BY_DEPT, FIRST_NAMES, LAST_NAMES };
