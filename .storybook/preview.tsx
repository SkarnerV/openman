import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo'
    },

    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#F5F5F5' },
        { name: 'dark', value: '#1A1A1A' },
      ],
    },
  },

  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export default preview;