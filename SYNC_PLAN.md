# Frontend-Backend Sync Implementation Plan

## ✅ Phase 1: Core Transaction Management (CURRENT)

### 1.1 API Client Updates
- [x] Add `updateTransaction()` method
- [x] Add `deleteTransaction()` method  
- [x] Add `reconcileTransaction()` method
- [x] Update Transaction interface with new fields:
  - reconciledAt, reconciledBy
  - modifiedBy
  - merchant

### 1.2 Transaction Edit Feature
**Files to create/modify:**
- [ ] `EditTransactionModal.tsx` - New component
- [ ] `TransactionsPage.tsx` - Add edit button and modal
- [ ] Update transaction row actions

**Requirements:**
- Reuse CreateJournalEntryModal logic
- Pre-populate form with existing data
- Validate debits = credits
- Disable editing if `isReconciled === true`
- Show warning message for reconciled transactions
- Update UI after successful edit

### 1.3 Transaction Delete Feature  
**Files to create/modify:**
- [ ] `DeleteTransactionModal.tsx` - New confirmation modal
- [ ] `TransactionsPage.tsx` - Add delete button and modal

**Requirements:**
- Show transaction summary in confirmation
- Warn about balance reversal
- Disable if `isReconciled === true`
- Show error if reconciled
- Refresh transaction list after delete

### 1.4 Transaction Reconciliation Feature
**Files to modify:**
- [ ] `TransactionsPage.tsx` - Add reconciliation column/toggle

**Requirements:**
- Add "Reconciled" column to table
- Show badge (✓ Reconciled / ○ Unreconciled)
- Add toggle button/checkbox
- Show reconciledAt and reconciledBy in details
- Disable edit/delete for reconciled transactions
- Filter: All / Reconciled / Unreconciled

### 1.5 Enhanced Transaction Display
**Files to modify:**
- [ ] `TransactionsPage.tsx` - Update table columns
- [ ] Transaction detail view - Show audit info

**New columns/info to show:**
- Reconciliation status
- Merchant (for expenses)
- Modified by (if different from creator)
- Modified date (if updated)

---

## 📋 Phase 2: Contacts Management (NEXT)

### 2.1 Contacts API (Already in client.ts)
- [x] getContacts()
- [x] getContact()
- [x] createContact()
- [x] updateContact()
- [x] deleteContact()

### 2.2 Contacts UI Components
**Files to create:**
- [ ] `src/pages/ContactsPage.tsx` - Main contacts list
- [ ] `src/components/contacts/CreateContactModal.tsx`
- [ ] `src/components/contacts/EditContactModal.tsx`
- [ ] `src/components/contacts/DeleteContactModal.tsx`
- [ ] `src/components/contacts/ContactSelector.tsx` - Autocomplete dropdown

**Features:**
- List contacts with filters (type: customer/supplier)
- Search by name/email
- Create/Edit/Delete contacts
- Contact detail view
- Transaction history per contact
- Use ContactSelector in transaction forms

---

## 📊 Phase 3: Financial Reports (PRIORITY)

### 3.1 Reports API (Already in client.ts)
- [x] getBalanceSheet()
- [x] getIncomeStatement()
- [x] getCashFlow()
- [x] getTrialBalance()
- [x] getGeneralLedger()
- [x] getTransactionSummary()

### 3.2 Reports UI Components
**Files to create:**
- [ ] `src/pages/ReportsPage.tsx` - Reports dashboard
- [ ] `src/pages/reports/BalanceSheetPage.tsx`
- [ ] `src/pages/reports/IncomeStatementPage.tsx`
- [ ] `src/pages/reports/CashFlowPage.tsx`
- [ ] `src/pages/reports/TrialBalancePage.tsx`
- [ ] `src/pages/reports/GeneralLedgerPage.tsx`
- [ ] `src/components/reports/ReportFilters.tsx` - Date range picker
- [ ] `src/components/reports/ExportButton.tsx` - PDF/CSV export

**Features:**
- Date range filters for all reports
- Print/Export functionality
- Responsive table layouts
- Drill-down to transactions
- Period comparison (optional)

---

## 👥 Phase 4: Team Management (MEDIUM PRIORITY)

### 4.1 Memberships API (Already in client.ts)
- [x] getMemberships()
- [x] inviteMember()
- [x] updateMemberRole()
- [x] removeMember()

### 4.2 Team UI Components
**Files to create:**
- [ ] `src/pages/TeamPage.tsx` - Team members list
- [ ] `src/components/team/InviteMemberModal.tsx`
- [ ] `src/components/team/MemberCard.tsx`
- [ ] `src/components/team/RoleSelector.tsx`

**Features:**
- List team members with roles
- Invite by email
- Change member roles (owner only)
- Remove members (owner only)
- Role badges (Owner/Admin/Accountant/Viewer)

---

## 🎨 Phase 5: UI/UX Enhancements (ONGOING)

### 5.1 Transaction Filters Enhancement
**Files to modify:**
- [ ] `TransactionsPage.tsx` - Add more filters

**New filters to add:**
- Reconciliation status (All/Reconciled/Unreconciled)
- Source type (Manual/Invoice/Expense/Payment)
- Contact filter (dropdown)
- Amount range (min/max)
- Tags filter (multi-select)

### 5.2 Audit Trail Display
**Files to modify:**
- [ ] Transaction detail view
- [ ] Account detail view

**Info to show:**
- Created by + timestamp
- Modified by + timestamp (if updated)
- Reconciled by + timestamp (if reconciled)
- Change history (future: diff view)

### 5.3 Account Hierarchy
**Files to modify:**
- [ ] `AccountsPage.tsx` - Tree view
- [ ] `CreateAccountModal.tsx` - Parent account selector

**Features:**
- Show parent-child relationships
- Collapsible tree view
- Subtotals per parent
- Filter by parent account

---

## 🚀 Implementation Priority

### Week 1-2: **CRITICAL - Transaction Management**
1. ✅ Update API client with new methods
2. ✅ Update Transaction type
3. Edit Transaction Modal
4. Delete Transaction Modal
5. Reconciliation UI

### Week 3: **HIGH - Contacts & Enhanced Filters**
6. Contacts CRUD
7. Contact Selector
8. Enhanced transaction filters
9. Audit trail display

### Week 4: **HIGH - Financial Reports**
10. Reports dashboard
11. Balance Sheet
12. Income Statement
13. Basic export functionality

### Week 5: **MEDIUM - Team & Polish**
14. Team management
15. Advanced reports (Cash Flow, Trial Balance)
16. Account hierarchy
17. UX improvements

---

## 📝 Testing Checklist

### Transaction Management Tests
- [ ] Can edit unreconciled transaction
- [ ] Cannot edit reconciled transaction
- [ ] Can delete unreconciled transaction
- [ ] Cannot delete reconciled transaction
- [ ] Can reconcile/unreconcile transaction
- [ ] Reconciliation shows who and when
- [ ] Edit updates modifiedBy field
- [ ] Balances update correctly after edit
- [ ] Balances revert correctly after delete

### Contacts Tests
- [ ] Can create contact
- [ ] Can list contacts with filters
- [ ] Can edit contact
- [ ] Can delete contact
- [ ] Contact selector shows in transaction forms
- [ ] Transaction list shows contact names

### Reports Tests
- [ ] Balance Sheet calculates correctly
- [ ] Income Statement shows net income
- [ ] Date filters work
- [ ] Can export to PDF/CSV
- [ ] Reports reflect latest transactions

### Team Tests
- [ ] Can invite member
- [ ] Can change member role
- [ ] Can remove member
- [ ] Role permissions work correctly
- [ ] Only owners can manage team

---

## 🔧 Technical Notes

### State Management
- Continue using `createQuery` from TanStack Query
- Use `queryClient.invalidateQueries()` after mutations
- Optimistic updates for better UX

### Form Validation
- Use Zod schemas for validation
- Inline error messages
- Disable submit until valid

### Error Handling
- Toast notifications for success/error
- Specific error messages from backend
- Fallback error messages

### Loading States
- Skeleton loaders for tables
- Spinner for buttons during submit
- Disable actions during loading

### Date Handling
- Use date pickers for all date inputs
- Default to today for new transactions
- Include future dates in filters (endDate + buffer)

---

## 📦 Dependencies Needed

Current dependencies should be sufficient. If needed:
- React PDF (`@react-pdf/renderer`) - for PDF export
- Papa Parse (`papaparse`) - for CSV export
- React Select (`react-select`) - for better dropdowns (optional)

---

**Last Updated:** October 18, 2025
**Status:** Phase 1 in progress - API client updated ✅
