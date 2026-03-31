import type { Meta, StoryObj } from '@storybook/react-vite';
import { MethodSelect } from '../MethodSelect';
import { useState } from 'react';

const meta = {
  title: 'Components/Common/MethodSelect',
  component: MethodSelect,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      description: 'HTTP method',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when method changes',
    },
  },
} satisfies Meta<typeof MethodSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Get: Story = {
  args: {
    value: 'GET',
    onChange: () => {},
  },
};

export const Post: Story = {
  args: {
    value: 'POST',
    onChange: () => {},
  },
};

export const Put: Story = {
  args: {
    value: 'PUT',
    onChange: () => {},
  },
};

export const Patch: Story = {
  args: {
    value: 'PATCH',
    onChange: () => {},
  },
};

export const Delete: Story = {
  args: {
    value: 'DELETE',
    onChange: () => {},
  },
};

export const Head: Story = {
  args: {
    value: 'HEAD',
    onChange: () => {},
  },
};

export const Options: Story = {
  args: {
    value: 'OPTIONS',
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [method, setMethod] = useState('GET');

    return (
      <div className="flex items-center gap-4">
        <MethodSelect value={method} onChange={setMethod} />
        <span className="text-sm text-text-secondary">
          Current: <span className="font-mono font-semibold">{method}</span>
        </span>
      </div>
    );
  },
};

export const InRequestBar: Story = {
  render: () => {
    const [method, setMethod] = useState('GET');

    return (
      <div className="flex items-center gap-2 p-2 bg-card-bg rounded-radius border border-elevated-bg">
        <MethodSelect value={method} onChange={setMethod} />
        <input
          type="text"
          placeholder="Enter request URL..."
          className="flex-1 px-4 py-3 bg-elevated-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
          defaultValue="https://api.example.com/users"
        />
        <button className="px-6 py-3 bg-accent-orange text-text-on-accent rounded-radius text-sm font-semibold hover:opacity-90 transition-opacity">
          Send
        </button>
      </div>
    );
  },
};

export const AllMethods: Story = {
  render: () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

    return (
      <div className="flex flex-wrap gap-4">
        {methods.map((method) => (
          <MethodSelect
            key={method}
            value={method}
            onChange={() => {}}
          />
        ))}
      </div>
    );
  },
};