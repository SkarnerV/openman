import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreateCollectionModal } from '../CreateCollectionModal';
import { useState } from 'react';

const meta = {
  title: 'Components/Common/CreateCollectionModal',
  component: CreateCollectionModal,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed',
    },
    onCreate: {
      action: 'created',
      description: 'Callback when collection is created',
    },
  },
} satisfies Meta<typeof CreateCollectionModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onCreate: async () => {},
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    onCreate: async () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90"
        >
          <span>+</span>
          <span>New Collection</span>
        </button>

        <CreateCollectionModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={async (name, description) => {
            alert(`Created collection: ${name}${description ? `\nDescription: ${description}` : ''}`);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

export const WithTrigger: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collections</h2>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-orange text-text-on-accent rounded-radius text-sm"
          >
            + New Collection
          </button>
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-elevated-bg rounded-radius">
            <span className="font-medium">Users API</span>
            <span className="text-text-secondary text-sm ml-2">5 requests</span>
          </div>
          <div className="p-3 bg-elevated-bg rounded-radius">
            <span className="font-medium">Auth API</span>
            <span className="text-text-secondary text-sm ml-2">3 requests</span>
          </div>
        </div>

        <CreateCollectionModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={async () => setIsOpen(false)}
        />
      </div>
    );
  },
};