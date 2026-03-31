import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from '../RadioGroup';
import { useState } from 'react';

const meta = {
  title: 'Components/Common/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Currently selected value',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when selection changes',
    },
    options: {
      control: 'object',
      description: 'Array of options with value and label',
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

export const Default: Story = {
  args: {
    value: 'option1',
    options: defaultOptions,
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('option1');
    return (
      <RadioGroup
        value={value}
        onChange={setValue}
        options={defaultOptions}
      />
    );
  },
};

export const ThemeOptions: Story = {
  render: () => {
    const [theme, setTheme] = useState('dark');
    const themeOptions = [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' },
    ];

    return (
      <div className="flex flex-col gap-4">
        <span className="text-sm text-text-secondary">Theme: {theme}</span>
        <RadioGroup
          value={theme}
          onChange={setTheme}
          options={themeOptions}
        />
      </div>
    );
  },
};

export const HttpMethodOptions: Story = {
  render: () => {
    const [method, setMethod] = useState('GET');
    const methodOptions = [
      { value: 'GET', label: 'GET' },
      { value: 'POST', label: 'POST' },
      { value: 'PUT', label: 'PUT' },
      { value: 'DELETE', label: 'DELETE' },
    ];

    return (
      <div className="flex flex-col gap-4">
        <span className="text-sm text-text-secondary">Selected Method: {method}</span>
        <RadioGroup
          value={method}
          onChange={setMethod}
          options={methodOptions}
        />
      </div>
    );
  },
};

export const TwoOptions: Story = {
  args: {
    value: 'yes',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    onChange: () => {},
  },
};