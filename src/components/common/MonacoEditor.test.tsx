import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonacoEditor } from './MonacoEditor';

// Mock @monaco-editor/react
const mockEditorInstance = {
  getModel: vi.fn().mockReturnValue({
    getValueLength: vi.fn().mockReturnValue(0),
  }),
  addContentWidget: vi.fn(),
  removeContentWidget: vi.fn(),
  onDidChangeModelContent: vi.fn(),
  addCommand: vi.fn(),
  getAction: vi.fn().mockReturnValue({
    run: vi.fn().mockResolvedValue(undefined),
  }),
};

const mockMonaco = {
  editor: {
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
  },
  KeyMod: { CtrlCmd: 2048 },
  KeyCode: { KeyS: 49 },
};

vi.mock('@monaco-editor/react', () => ({
  Editor: vi.fn(({ onMount, loading, value, onChange }) => {
    // Simulate editor mount
    setTimeout(() => {
      if (onMount) {
        onMount(mockEditorInstance, mockMonaco);
      }
    }, 0);

    return (
      <div data-testid="monaco-editor">
        {loading}
        <textarea
          data-testid="monaco-textarea"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label="Monaco Editor"
        />
      </div>
    );
  }),
}));

describe('MonacoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <MonacoEditor
        value=""
        onChange={vi.fn()}
        language="json"
      />
    );

    expect(screen.getByText(/Loading editor/i)).toBeInTheDocument();
  });

  it('renders editor after mount', async () => {
    render(
      <MonacoEditor
        value=""
        onChange={vi.fn()}
        language="json"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  it('calls onChange when content changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MonacoEditor
        value=""
        onChange={onChange}
        language="json"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('monaco-textarea')).toBeInTheDocument();
    });

    const textarea = screen.getByTestId('monaco-textarea');
    await user.type(textarea, 'a');

    // Verify onChange was called (Monaco Editor calls onChange per keystroke)
    expect(onChange).toHaveBeenCalled();
  });

  it('displays value prop correctly', async () => {
    render(
      <MonacoEditor
        value={'{\n  "test": true\n}'}
        onChange={vi.fn()}
        language="json"
      />
    );

    await waitFor(() => {
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('{\n  "test": true\n}');
    });
  });

  it('shows Format button when not readOnly', async () => {
    render(
      <MonacoEditor
        value=""
        onChange={vi.fn()}
        language="json"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();
    });
  });

  it('does not show Format button when readOnly', async () => {
    render(
      <MonacoEditor
        value=""
        onChange={vi.fn()}
        language="json"
        readOnly
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /format/i })).not.toBeInTheDocument();
    });
  });

  it('calls format action when clicking Format button', async () => {
    const user = userEvent.setup();

    render(
      <MonacoEditor
        value='{"key":"value"}'
        onChange={vi.fn()}
        language="json"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();
    });

    const formatButton = screen.getByRole('button', { name: /format/i });
    await user.click(formatButton);

    expect(mockEditorInstance.getAction).toHaveBeenCalledWith('editor.action.formatDocument');
  });

  it('registers keyboard shortcut for formatting', async () => {
    render(
      <MonacoEditor
        value=""
        onChange={vi.fn()}
        language="json"
      />
    );

    await waitFor(() => {
      expect(mockEditorInstance.addCommand).toHaveBeenCalledWith(
        2097, // CtrlCmd + KeyS
        expect.any(Function)
      );
    });
  });

  it('configures dark theme when app theme is dark', async () => {
    // Mock dark theme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <MonacoEditor
        value=""
        onChange={vi.fn()}
        language="json"
      />
    );

    await waitFor(() => {
      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith(
        'openman-dark',
        expect.objectContaining({
          base: 'vs-dark',
        })
      );
    });
  });

  it('configures light theme when app theme is light', async () => {
    // Mock light theme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query !== '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <MonacoEditor
        value=""
        onChange={vi.fn()}
        language="json"
      />
    );

    await waitFor(() => {
      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith(
        'openman-light',
        expect.objectContaining({
          base: 'vs',
        })
      );
    });
  });

  it('renders with different languages', async () => {
    const { rerender } = render(
      <MonacoEditor
        value="<xml></xml>"
        onChange={vi.fn()}
        language="xml"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    rerender(
      <MonacoEditor
        value="plain text"
        onChange={vi.fn()}
        language="plaintext"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });
});
