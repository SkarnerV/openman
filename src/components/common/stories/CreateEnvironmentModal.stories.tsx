import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreateEnvironmentModal } from '../CreateEnvironmentModal';
import { useState } from 'react';

const meta = {
  title: 'Components/Common/CreateEnvironmentModal',
  component: CreateEnvironmentModal,
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
      description: 'Callback when environment is created',
    },
  },
} satisfies Meta<typeof CreateEnvironmentModal>;

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
          <span>New Environment</span>
        </button>

        <CreateEnvironmentModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={async (name) => {
            alert(`Created environment: ${name}`);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

export const WithEnvironmentList: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const environments = [
      { id: '1', name: 'Development', isActive: true },
      { id: '2', name: 'Staging', isActive: false },
      { id: '3', name: 'Production', isActive: false },
    ];

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Environments</h2>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-orange text-text-on-accent rounded-radius text-sm"
          >
            + New Environment
          </button>
        </div>

        <div className="space-y-2">
          {environments.map((env) => (
            <div key={env.id} className="flex items-center justify-between p-3 bg-elevated-bg rounded-radius">
              <span className="font-medium">{env.name}</span>
              {env.isActive && (
                <span className="text-xs bg-accent-teal/20 text-accent-teal px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
          ))}
        </div>

        <CreateEnvironmentModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreate={async () => setIsOpen(false)}
        />
      </div>
    );
  },
};