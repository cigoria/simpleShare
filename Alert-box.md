# Confirmation Modal System

This document describes the reusable confirmation modal system that replaces all `alert()` calls in the SimpleShare application.

## Overview

The confirmation modal system consists of:
- `ConfirmModal.vue` - The modal component
- `useConfirm.js` - Composable for managing modal state
- Global integration in `App.vue`

## Features

- **Reusable**: Can be used anywhere in the application
- **Customizable**: Support for different types (info, warning, error, success)
- **Flexible**: Custom buttons, icons, and text
- **Accessible**: Proper keyboard navigation and backdrop handling
- **Animated**: Smooth scale-in animations

## Usage

### Basic Usage

```javascript
import { useConfirm } from '../composables/useConfirm.js'

export default {
  setup() {
    const { confirm } = useConfirm()
    
    const handleAction = async () => {
      try {
        await confirm('Are you sure you want to proceed?')
        // User confirmed - proceed with action
        console.log('Action confirmed')
      } catch {
        // User cancelled - do nothing or handle cancellation
        console.log('Action cancelled')
      }
    }
    
    return { handleAction }
  }
}
```

### Available Methods

#### `confirm(message, options)`
Basic confirmation dialog.

```javascript
await confirm('Are you sure?', {
  title: 'Confirmation',
  confirmText: 'Yes',
  cancelText: 'No',
  type: 'info'
})
```

#### `confirmDelete(itemName, options)`
Pre-configured delete confirmation.

```javascript
await confirmDelete('this file')
// Shows: "Are you sure you want to delete this file?"
```

#### `confirmWarning(message, options)`
Warning-style confirmation.

```javascript
await confirmWarning('This action cannot be undone')
```

#### `confirmSuccess(message, options)`
Success notification that acts as confirmation.

```javascript
await confirmSuccess('Operation completed successfully')
```

#### `showConfirm(options)`
Fully customizable confirmation dialog.

```javascript
await showConfirm({
  title: 'Custom Action',
  message: 'Do you want to perform this action?',
  confirmText: 'Yes, do it',
  cancelText: 'No, thanks',
  confirmIcon: 'rocket_launch',
  cancelIcon: 'thumb_down',
  type: 'info',
  closeOnBackdrop: false
})
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | 'Confirmation' | Modal title |
| `message` | string | Required | Modal message |
| `confirmText` | string | 'Confirm' | Confirm button text |
| `cancelText` | string | 'Cancel' | Cancel button text (empty = hide button) |
| `confirmIcon` | string | 'check' | Confirm button icon |
| `cancelIcon` | string | 'close' | Cancel button icon |
| `type` | string | 'info' | Modal type: 'info', 'warning', 'error', 'success' |
| `closeOnBackdrop` | boolean | true | Close modal when clicking backdrop |

## Modal Types

- **info**: Blue icon, general information
- **warning**: Yellow icon, warning messages
- **error**: Red icon, error messages
- **success**: Green icon, success messages

## Migration from alert()

### Before:
```javascript
if (!input.value) {
  alert('Please enter a value')
  return
}

if (confirm('Delete this item?')) {
  // Delete item
} else {
  // Cancelled
}

alert('Error: ' + errorMessage)
```

### After:
```javascript
if (!input.value) {
  try {
    await confirmWarning('Please enter a value')
  } catch {
    return // User cancelled
  }
}

try {
  await confirmDelete('this item')
  // Delete item
} catch {
  // User cancelled
}

await confirm('Error: ' + errorMessage, {
  title: 'Error',
  type: 'error',
  confirmText: 'OK',
  cancelText: '',
  closeOnBackdrop: false
})
```

## Examples in the Codebase

### GroupChoiceModal.vue
```javascript
// Replaced: alert('Please enter a group name')
try {
  await this.confirmWarning('Please enter a group name')
} catch {
  // User cancelled, do nothing
  return
}
```

### MyFilesModal.vue
```javascript
// Replaced: confirm('Are you sure you want to delete this file?')
try {
  await this.confirmDelete('this file')
  // Delete the file
} catch {
  // User cancelled deletion
}

// Replaced: alert('Failed to delete file: ' + error)
await this.confirm('Failed to delete file: ' + error, {
  title: 'Error',
  type: 'error',
  confirmText: 'OK',
  cancelText: '',
  closeOnBackdrop: false
})
```

## Styling

The modal uses Tailwind CSS classes and follows the application's design system:
- Backdrop blur effect
- Rounded corners with border
- Consistent color scheme using CSS variables
- Hover effects and transitions
- Responsive design for mobile

## Accessibility

- Keyboard navigation (Escape to cancel)
- Focus management
- Semantic HTML structure
- ARIA-friendly button roles

## Best Practices

1. **Use specific methods**: Use `confirmDelete()` for deletions, `confirmWarning()` for warnings, etc.
2. **Provide clear messages**: Be specific about what action will be performed
3. **Handle cancellations**: Always wrap in try-catch to handle user cancellation
4. **Use appropriate types**: Choose the right modal type for the context
5. **Keep it simple**: Don't overcomplicate confirmation messages

## Future Enhancements

- Add loading states for async operations
- Support for custom components inside modal
- Animation customization options
- Sound effects for different modal types
