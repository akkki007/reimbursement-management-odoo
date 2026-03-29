export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const EXPENSE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const EXPENSE_CATEGORIES = [
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'OTHER', label: 'Other' },
];

export const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-primary-100 text-primary-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};
