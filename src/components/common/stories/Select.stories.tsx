import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from '../Select';
import { useState } from 'react';

const meta = {
  title: 'Components/Common/Select',
  component: Select,
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
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no option is selected',
    },
  },
} satisfies Meta<typeof Select>;

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

export const WithPlaceholder: Story = {
  args: {
    value: '',
    options: defaultOptions,
    placeholder: 'Select an option...',
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-64">
        <Select
          value={value}
          onChange={setValue}
          options={defaultOptions}
          placeholder="Choose..."
        />
        <p className="mt-2 text-sm text-text-secondary">Selected: {value || 'none'}</p>
      </div>
    );
  },
};

export const LanguageSelect: Story = {
  render: () => {
    const [language, setLanguage] = useState('en');
    const languages = [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
      { value: 'fr', label: 'French' },
      { value: 'de', label: 'German' },
      { value: 'zh', label: 'Chinese' },
    ];

    return (
      <div className="w-64">
        <Select
          value={language}
          onChange={setLanguage}
          options={languages}
          placeholder="Select language"
        />
      </div>
    );
  },
};

export const EnvironmentSelect: Story = {
  render: () => {
    const [env, setEnv] = useState('dev');
    const environments = [
      { value: 'dev', label: 'Development' },
      { value: 'staging', label: 'Staging' },
      { value: 'prod', label: 'Production' },
    ];

    return (
      <div className="w-64">
        <Select
          value={env}
          onChange={setEnv}
          options={environments}
        />
      </div>
    );
  },
};

export const EmptyOptions: Story = {
  args: {
    value: '',
    options: [],
    placeholder: 'No options available',
    onChange: () => {},
  },
};