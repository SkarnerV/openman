import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfirmDialog } from '../ConfirmDialog';
import { useState } from 'react';

const meta = {
  title: 'Components/Common/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    message: {
      control: 'text',
      description: 'Dialog message',
    },
    confirmLabel: {
      control: 'text',
      description: 'Confirm button label',
    },
    cancelLabel: {
      control: 'text',
      description: 'Cancel button label',
    },
    variant: {
      control: 'select',
      options: ['danger', 'warning'],
      description: 'Dialog variant',
    },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Delete: Story = {
  args: {
    isOpen: true,
    title: 'Delete Collection',
    message: 'Are you sure you want to delete "Users API"? This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    variant: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Warning: Story = {
  args: {
    isOpen: true,
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Are you sure you want to leave?',
    confirmLabel: 'Leave',
    cancelLabel: 'Stay',
    variant: 'warning',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const DeleteRequest: Story = {
  args: {
    isOpen: true,
    title: 'Delete Request',
    message: 'Are you sure you want to delete "Get Users"? This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    variant: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const ClearHistory: Story = {
  args: {
    isOpen: true,
    title: 'Clear History',
    message: 'Are you sure you want to clear all history? This action cannot be undone.',
    confirmLabel: 'Clear All',
    cancelLabel: 'Cancel',
    variant: 'warning',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: 'Delete Item',
    message: 'This dialog is closed.',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-delete-method text-white rounded-radius text-sm font-semibold hover:opacity-90"
        >
          Delete Collection
        </button>

        <ConfirmDialog
          isOpen={isOpen}
          title="Delete Collection"
          message='Are you sure you want to delete "My Collection"? This action cannot be undone.'
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            alert('Deleted!');
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      </div>
    );
  },
};

export const LongMessage: Story = {
  args: {
    isOpen: true,
    title: 'Delete Multiple Items',
    message: 'Are you sure you want to delete "Users API", "Auth API", and "Products API"? All requests within these collections will also be permanently removed. This action cannot be undone and you will lose all your saved requests and configurations.',
    confirmLabel: 'Delete All',
    cancelLabel: 'Cancel',
    variant: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  },
};