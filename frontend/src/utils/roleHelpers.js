import { ROLES } from './constants';

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function isManager(user) {
  return user?.role === ROLES.MANAGER;
}

export function isEmployee(user) {
  return user?.role === ROLES.EMPLOYEE;
}

export function canApprove(user) {
  return user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER;
}
