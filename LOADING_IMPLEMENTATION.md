# Loading States Implementation Guide

## Overview
This document describes the comprehensive loading states implementation added to the Daily Viva Tracker project. The implementation includes skeleton loaders, loading buttons, spinner components, and loading hooks for better user experience.

## Components Added

### 1. Spinner Component (`/src/components/ui/spinner.tsx`)
A reusable spinner component with multiple sizes:
- `sm`: 16x16px
- `default`: 24x24px  
- `lg`: 32x32px
- `xl`: 48x48px

Usage:
```tsx
import { Spinner } from "@/components/ui/spinner";

<Spinner size="lg" />
```

### 2. Enhanced Button Component (`/src/components/ui/button.tsx`)
Added loading state support to existing Button component:
- `loading` prop: Shows spinner when true
- Automatically disables button when loading
- Preserves existing button variants and sizes

Usage:
```tsx
<Button loading={isLoading} onClick={handleAction}>
  {isLoading ? "Processing..." : "Submit"}
</Button>
```

### 3. Skeleton Loaders (`/src/components/SkeletonLoaders.tsx`)
Pre-built skeleton components for common UI patterns:
- `TableSkeleton`: For loading tables
- `CardSkeleton`: For loading cards
- `StudentCardSkeleton`: For student-specific cards
- `FormSkeleton`: For loading forms
- `NavigationSkeleton`: For navigation loading
- `DashboardSkeleton`: For full dashboard loading

Usage:
```tsx
import { TableSkeleton, CardSkeleton } from "@/components/SkeletonLoaders";

{isLoading ? <TableSkeleton rows={5} cols={4} /> : <ActualTable />}
```

### 4. Loading Components (`/src/components/LoadingComponents.tsx`)
Utility components for loading states:
- `LoadingOverlay`: Full-screen loading overlay
- `LoadingState`: Wrapper component for loading/error states

Usage:
```tsx
import { LoadingOverlay, LoadingState } from "@/components/LoadingComponents";

<LoadingState 
  isLoading={loading} 
  error={error}
  loadingComponent={<CustomLoader />}
>
  <YourContent />
</LoadingState>
```

### 5. Loading Hooks (`/src/hooks/use-loading.ts`)
Custom hooks for managing loading states:
- `useLoading`: Single loading state management
- `useMultipleLoading`: Multiple loading states management

Usage:
```tsx
import { useLoading, useMultipleLoading } from "@/hooks/use-loading";

// Single loading state
const { isLoading, withLoading } = useLoading();
const handleSubmit = () => withLoading(async () => {
  await submitData();
});

// Multiple loading states  
const { loadingStates, withLoading: withMultiLoading } = useMultipleLoading(['save', 'delete']);
const handleSave = () => withMultiLoading('save', async () => {
  await saveData();
});
```

## Implementation Details

### 1. Authentication Context (`/src/contexts/AuthContext.tsx`)
Enhanced with loading states:
- `isLoading`: Initial auth check loading
- `isLoginLoading`: Login process loading  
- `isLogoutLoading`: Logout process loading

### 2. Auth Page (`/src/pages/auth-page.tsx`)
- Shows skeleton loader during initial auth check
- Login button shows loading spinner during authentication
- Form inputs disabled during login process

### 3. Home Page (`/src/pages/Home.tsx`) 
Added loading states for:
- `isLoadingStudents`: When fetching students
- `isLoadingRound`: When creating/fetching rounds
- `isLoadingNextStudent`: When moving to next student
- `isSavingEvaluation`: When saving evaluations

### 4. Profile Page (`/src/pages/Profile.tsx`)
Added loading states for:
- `isSavingProfile`: When updating profile
- `isChangingPassword`: When changing password  
- `isDeletingSubject`: When deleting subjects

### 5. StartScreen Component (`/src/components/StartScreen.tsx`)
- Shows skeleton loader when `isLoading` prop is true
- Subject selection buttons disabled during loading

### 6. EvaluationScreen Component (`/src/components/EvaluationScreen.tsx`)
- Evaluation buttons disabled when `isSaving` is true
- Navigation buttons show loading states
- Added `isLoadingNext` and `isSaving` props

### 7. Header Component (`/src/components/Header.tsx`)
- Logout button shows loading state during logout process

### 8. DvtMarksTable2 Component (`/src/components/DvtMarksTable2.tsx`)
Enhanced existing loading state with better skeleton UI instead of simple spinner.

## Loading State Patterns

### 1. Button Loading Pattern
```tsx
<Button 
  loading={isLoading}
  onClick={handleAction}
  disabled={isLoading}
>
  {isLoading ? "Processing..." : "Submit"}
</Button>
```

### 2. Form Loading Pattern
```tsx
<form onSubmit={handleSubmit}>
  <Input disabled={isLoading} />
  <Input disabled={isLoading} />
  <Button loading={isLoading} type="submit">
    {isLoading ? "Saving..." : "Save"}
  </Button>
</form>
```

### 3. Conditional Rendering Pattern
```tsx
{isLoading ? (
  <SkeletonLoader />
) : (
  <ActualContent />
)}
```

### 4. Async Action Pattern
```tsx
const handleAction = async () => {
  setIsLoading(true);
  try {
    await performAction();
    // Success handling
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false);
  }
};
```

## Best Practices

1. **Always disable interactive elements** when loading
2. **Provide meaningful loading text** that describes the action
3. **Use skeleton loaders** for content that takes time to load
4. **Handle error states** alongside loading states
5. **Use consistent loading patterns** across the application
6. **Avoid nested loading states** when possible
7. **Consider UX**: Don't show loading for very fast operations (<200ms)

## Future Enhancements

1. **React Query Integration**: Replace manual loading states with React Query's built-in loading states
2. **Global Loading Provider**: Create a context for managing app-wide loading states
3. **Loading Analytics**: Track loading times and optimize slow operations
4. **Progressive Loading**: Implement progressive loading for large datasets
5. **Optimistic Updates**: Add optimistic updates for better perceived performance

## Files Modified

### New Files:
- `/src/components/ui/spinner.tsx`
- `/src/components/SkeletonLoaders.tsx` 
- `/src/components/LoadingComponents.tsx`
- `/src/hooks/use-loading.ts`

### Modified Files:
- `/src/components/ui/button.tsx`
- `/src/contexts/AuthContext.tsx`
- `/src/pages/auth-page.tsx`
- `/src/pages/Home.tsx`
- `/src/pages/Profile.tsx`
- `/src/components/StartScreen.tsx`
- `/src/components/EvaluationScreen.tsx`
- `/src/components/Header.tsx`
- `/src/components/DvtMarksTable2.tsx`

## Testing the Implementation

1. **Login Flow**: Test loading states during login
2. **Subject Selection**: Test loading during subject/student fetching
3. **Evaluation Flow**: Test loading during evaluation submission
4. **Profile Updates**: Test loading during profile and password changes
5. **Navigation**: Test loading states during page transitions
6. **Network Conditions**: Test with slow 3G to see loading states clearly

The implementation ensures a smooth and professional user experience with clear feedback for all async operations throughout the application.