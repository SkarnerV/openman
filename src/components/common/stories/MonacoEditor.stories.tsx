import type { Meta, StoryObj } from '@storybook/react-vite';
import { MonacoEditor } from '../MonacoEditor';
import { useState } from 'react';
import { vi } from 'vitest';

// Mock the theme store for Storybook
vi.mock('../../../stores/useThemeStore', () => ({
  useThemeStore: () => ({
    theme: 'dark',
    setTheme: () => {},
    applyTheme: () => {},
  }),
}));

const meta = {
  title: 'Components/Common/MonacoEditor',
  component: MonacoEditor,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Editor content',
    },
    language: {
      control: 'select',
      options: ['json', 'plaintext', 'xml', 'html', 'javascript'],
      description: 'Language for syntax highlighting',
    },
    height: {
      control: 'text',
      description: 'Editor height',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the editor is read-only',
    },
  },
} satisfies Meta<typeof MonacoEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleJson = `{
  "name": "Openman",
  "version": "1.0.0",
  "description": "API Testing Tool",
  "features": [
    "HTTP requests",
    "gRPC support",
    "MCP integration"
  ]
}`;

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <user id="1">
    <name>John Doe</name>
    <email>john@example.com</email>
  </user>
  <user id="2">
    <name>Jane Doe</name>
    <email>jane@example.com</email>
  </user>
</root>`;

const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Response</title>
</head>
<body>
  <h1>Welcome to Openman</h1>
  <p>This is an API testing tool.</p>
</body>
</html>`;

export const JsonEditor: Story = {
  args: {
    value: sampleJson,
    onChange: () => {},
    language: 'json',
    height: '300px',
  },
};

export const Empty: Story = {
  args: {
    value: '',
    onChange: () => {},
    language: 'json',
    placeholder: 'Enter JSON content...',
    height: '200px',
  },
};

export const ReadOnly: Story = {
  args: {
    value: sampleJson,
    onChange: () => {},
    language: 'json',
    readOnly: true,
    height: '200px',
  },
};

export const XmlEditor: Story = {
  args: {
    value: sampleXml,
    onChange: () => {},
    language: 'xml',
    height: '300px',
  },
};

export const HtmlEditor: Story = {
  args: {
    value: sampleHtml,
    onChange: () => {},
    language: 'html',
    height: '250px',
  },
};

export const PlainText: Story = {
  args: {
    value: 'This is plain text content.\nLine 2\nLine 3',
    onChange: () => {},
    language: 'plaintext',
    height: '150px',
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(sampleJson);

    return (
      <div className="space-y-4">
        <div className="text-sm text-text-secondary">
          Edit the JSON below:
        </div>
        <MonacoEditor
          value={value}
          onChange={setValue}
          language="json"
          height="300px"
        />
        <div className="text-sm text-text-secondary">
          Character count: {value.length}
        </div>
      </div>
    );
  },
};

export const ResponseViewer: Story = {
  render: () => {
    const responseJson = `{
  "status": 200,
  "data": {
    "users": [
      { "id": 1, "name": "Alice" },
      { "id": 2, "name": "Bob" }
    ],
    "pagination": {
      "page": 1,
      "total": 100
    }
  }
}`;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-accent-teal">Status: 200 OK</span>
          <span className="text-text-secondary">Time: 142ms</span>
          <span className="text-text-secondary">Size: 256 B</span>
        </div>
        <MonacoEditor
          value={responseJson}
          onChange={() => {}}
          language="json"
          height="300px"
          readOnly
        />
      </div>
    );
  },
};

export const RequestBody: Story = {
  render: () => {
    const [body, setBody] = useState(`{
  "name": "New User",
  "email": "user@example.com",
  "role": "admin"
}`);

    return (
      <div className="space-y-2">
        <div className="text-sm text-text-secondary mb-2">
          Request Body (JSON)
        </div>
        <MonacoEditor
          value={body}
          onChange={setBody}
          language="json"
          height="200px"
        />
      </div>
    );
  },
};

export const SmallHeight: Story = {
  args: {
    value: sampleJson,
    onChange: () => {},
    language: 'json',
    height: '150px',
  },
};

export const LargeHeight: Story = {
  args: {
    value: sampleJson,
    onChange: () => {},
    language: 'json',
    height: '500px',
  },
};