/**
 * In-memory store for mock mode.
 * Mutated at runtime (sign-ins, sign-outs, ID verification).
 * Re-seeded fresh on every page reload.
 */

import { format, subHours, subDays } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

export const store = {
  employees: [
    { id: 'e1', full_name: 'Alice Johnson',   title: 'Chief Executive Officer',   department: 'Executive',            active: true },
    { id: 'e2', full_name: 'Bob Martinez',     title: 'VP of Sales',               department: 'Sales',                active: true },
    { id: 'e3', full_name: 'Carol Williams',   title: 'Director of Engineering',   department: 'Engineering',          active: true },
    { id: 'e4', full_name: 'David Kim',        title: 'HR Manager',                department: 'Human Resources',      active: true },
    { id: 'e5', full_name: 'Emma Davis',       title: 'Office Manager',            department: 'Operations',           active: true },
    { id: 'e6', full_name: 'Frank Thompson',   title: 'Senior Accountant',         department: 'Finance',              active: true },
    { id: 'e7', full_name: 'Grace Lee',        title: 'Marketing Manager',         department: 'Marketing',            active: true },
    { id: 'e8', full_name: 'Henry Wilson',     title: 'IT Manager',                department: 'Information Technology', active: true },
    { id: 'e9', full_name: 'Isabella Moore',   title: 'Legal Counsel',             department: 'Legal',                active: true },
    { id: 'e10', full_name: 'James Taylor',   title: 'Sales Representative',      department: 'Sales',                active: true },
    { id: 'e11', full_name: 'Karen White',    title: 'UX Designer',               department: 'Engineering',          active: true },
    { id: 'e12', full_name: 'Leo Nguyen',     title: 'DevOps Engineer',           department: 'Engineering',          active: true },
    { id: 'e13', full_name: 'Maria Garcia',   title: 'Customer Success Manager',  department: 'Sales',                active: false },
  ],

  visitor_log: [
    // Today — currently signed in (no time_out)
    {
      id: 'v1',
      visitor_name: 'Tom Hanks',
      visitor_title: 'Account Executive',
      visitor_company: 'Initech Solutions',
      reason_for_visit: 'Q4 Partnership Meeting',
      host_employee_id: 'e2',
      host_employee_name: 'Bob Martinez',
      visit_date: today,
      time_in: subHours(new Date(), 1).toISOString(),
      time_out: null,
      id_verified: true,
      auto_signed_out: false,
      signature: null,
      created_at: subHours(new Date(), 1).toISOString(),
    },
    {
      id: 'v2',
      visitor_name: 'Sandra Bullock',
      visitor_title: 'Recruiting Coordinator',
      visitor_company: 'TalentBridge',
      reason_for_visit: 'On-site interviews',
      host_employee_id: 'e4',
      host_employee_name: 'David Kim',
      visit_date: today,
      time_in: subHours(new Date(), 2).toISOString(),
      time_out: null,
      id_verified: false,
      auto_signed_out: false,
      signature: null,
      created_at: subHours(new Date(), 2).toISOString(),
    },
    // Today — already signed out
    {
      id: 'v3',
      visitor_name: 'Denzel Washington',
      visitor_title: 'Senior Auditor',
      visitor_company: 'Deloitte',
      reason_for_visit: 'Annual financial audit',
      host_employee_id: 'e6',
      host_employee_name: 'Frank Thompson',
      visit_date: today,
      time_in: subHours(new Date(), 5).toISOString(),
      time_out: subHours(new Date(), 2).toISOString(),
      id_verified: true,
      auto_signed_out: false,
      signature: null,
      created_at: subHours(new Date(), 5).toISOString(),
    },
    // Yesterday
    {
      id: 'v4',
      visitor_name: 'Meryl Streep',
      visitor_title: 'Brand Consultant',
      visitor_company: 'Creative Edge Agency',
      reason_for_visit: 'Brand strategy review',
      host_employee_id: 'e7',
      host_employee_name: 'Grace Lee',
      visit_date: yesterday,
      time_in: subDays(subHours(new Date(), 3), 1).toISOString(),
      time_out: subDays(subHours(new Date(), 1), 1).toISOString(),
      id_verified: true,
      auto_signed_out: false,
      signature: null,
      created_at: subDays(subHours(new Date(), 3), 1).toISOString(),
    },
    {
      id: 'v5',
      visitor_name: 'Ryan Reynolds',
      visitor_title: null,
      visitor_company: 'FreeAgent Consulting',
      reason_for_visit: 'Software demo',
      host_employee_id: 'e3',
      host_employee_name: 'Carol Williams',
      visit_date: yesterday,
      time_in: subDays(subHours(new Date(), 6), 1).toISOString(),
      time_out: null,
      id_verified: false,
      auto_signed_out: true,
      signature: null,
      created_at: subDays(subHours(new Date(), 6), 1).toISOString(),
    },
  ],
}
