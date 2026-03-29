import { useRef, useEffect, useState } from "react";
import { Editor, type OnMount } from "@monaco-editor/react";
import { useThemeStore } from "../../stores/useThemeStore";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "json" | "plaintext" | "xml" | "html" | "javascript";
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
}

export function MonacoEditor({
  value,
  onChange,
  language = "json",
  placeholder,
  height = "256px",
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useThemeStore();
  const [isMounted, setIsMounted] = useState(false);

  // Handle editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsMounted(true);

    // Configure Monaco Editor theme colors to match app theme
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    monaco.editor.defineTheme("openman-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#2a2d2e",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
      },
    });

    monaco.editor.defineTheme("openman-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#323232",
        "editor.lineHighlightBackground": "#f0f0f0",
        "editorLineNumber.foreground": "#237893",
        "editorLineNumber.activeForeground": "#0b216f",
        "editor.selectionBackground": "#add6ff",
        "editor.inactiveSelectionBackground": "#e5ebf1",
      },
    });

    // Set the theme
    monaco.editor.setTheme(isDark ? "openman-dark" : "openman-light");

    // Add format command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      formatDocument();
    });

    // Update placeholder
    updatePlaceholder(editor, placeholder);
  };

  // Update theme when app theme changes
  useEffect(() => {
    if (!editorRef.current) return;

    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const monaco = (window as any).monaco;
    if (monaco) {
      monaco.editor.setTheme(isDark ? "openman-dark" : "openman-light");
    }
  }, [theme]);

  // Update placeholder when it changes
  useEffect(() => {
    if (editorRef.current) {
      updatePlaceholder(editorRef.current, placeholder);
    }
  }, [placeholder]);

  const updatePlaceholder = (
    editor: import("monaco-editor").editor.IStandaloneCodeEditor,
    text?: string
  ) => {
    if (!text) return;

    // Add placeholder widget
    const placeholderWidget = {
      getId: () => "placeholder",
      getDomNode: () => {
        const node = document.createElement("div");
        node.style.color = "#666";
        node.style.fontStyle = "italic";
        node.style.pointerEvents = "none";
        node.style.padding = "0 16px";
        node.textContent = text;
        return node;
      },
      getPosition: () => ({
        position: { lineNumber: 1, column: 1 },
        preference: [1], // Above
      }),
    };

    // Show/hide placeholder based on content
    const checkContent = () => {
      const model = editor.getModel();
      if (model && model.getValueLength() === 0) {
        editor.addContentWidget(placeholderWidget);
      } else {
        editor.removeContentWidget(placeholderWidget);
      }
    };

    checkContent();
    editor.onDidChangeModelContent(checkContent);
  };

  // Format document
  const formatDocument = async () => {
    if (!editorRef.current) return;
    try {
      await editorRef.current.getAction("editor.action.formatDocument")?.run();
    } catch (e) {
      console.warn("Format document failed:", e);
    }
  };

  return (
    <div className="relative rounded-radius overflow-hidden border border-elevated-bg h-full">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
          lineNumbers: "on",
          folding: true,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
          readOnly,
          domReadOnly: readOnly,
          contextmenu: true,
          formatOnPaste: true,
          formatOnType: language === "json",
        }}
        loading={
          <div className="flex items-center justify-center h-[256px] text-text-secondary text-sm">
            Loading editor...
          </div>
        }
      />
      {/* Format button overlay */}
      {!readOnly && isMounted && (
        <button
          onClick={formatDocument}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-card-bg text-text-secondary rounded hover:bg-elevated-bg hover:text-text-primary transition-colors border border-elevated-bg"
          title="Format (Ctrl/Cmd + S)"
        >
          Format
        </button>
      )}
    </div>
  );
}
