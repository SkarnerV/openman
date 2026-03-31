import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../Checkbox';

const meta = {
  title: 'Components/Common/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    label: {
      control: 'text',
      description: 'Optional label text',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when checkbox state changes',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
    onChange: () => {},
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    onChange: () => {},
  },
};

export const WithLabel: Story = {
  args: {
    checked: true,
    label: 'Enable feature',
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    label: 'Disabled option',
    onChange: () => {},
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    label: 'Disabled but checked',
    onChange: () => {},
  },
};

export const CheckboxGroup: Story = {
  render: () => {
    const options = [
      { id: 'opt1', label: 'Option 1', checked: true },
      { id: 'opt2', label: 'Option 2', checked: false },
      { id: 'opt3', label: 'Option 3', checked: true },
    ];

    return (
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <Checkbox
            key={opt.id}
            checked={opt.checked}
            label={opt.label}
            onChange={() => {}}
          />
        ))}
      </div>
    );
  },
};