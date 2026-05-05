import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, ChevronDown, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [currentFormat, setCurrentFormat] = useState('paragraph');
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const isInitialized = useRef(false);

  // Initialize editor content on mount
  useEffect(() => {
    if (editorRef.current && !isInitialized.current && value) {
      editorRef.current.innerHTML = value;
      isInitialized.current = true;
    }
  }, []);

  // Update editor when value prop changes externally
  useEffect(() => {
    if (editorRef.current && !isFocused && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isFocused]);

  const checkActiveFormats = () => {
    const active = new Set<string>();
    if (document.queryCommandState('bold')) active.add('bold');
    if (document.queryCommandState('italic')) active.add('italic');
    if (document.queryCommandState('underline')) active.add('underline');
    if (document.queryCommandState('insertUnorderedList')) active.add('ul');
    if (document.queryCommandState('insertOrderedList')) active.add('ol');
    if (document.queryCommandState('justifyLeft')) active.add('left');
    if (document.queryCommandState('justifyCenter')) active.add('center');
    if (document.queryCommandState('justifyRight')) active.add('right');
    setActiveFormats(active);
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkActiveFormats();
  };

  const applyHeading = (level: string) => {
    document.execCommand('formatBlock', false, level);
    setCurrentFormat(level === '<p>' ? 'paragraph' : level);
    editorRef.current?.focus();
    checkActiveFormats();
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    onChange(html);
    checkActiveFormats();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      onChange('');
      setCurrentFormat('paragraph');
      setActiveFormats(new Set());
      editorRef.current.focus();
    }
  };

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 bg-muted p-2 border-b border-input items-center">
        {/* Format Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onMouseDown={handleMouseDown}
            >
              <span className="text-xs font-medium">
                {currentFormat === 'paragraph' && 'Paragraph'}
                {currentFormat === '<h1>' && 'Heading 1'}
                {currentFormat === '<h2>' && 'Heading 2'}
                {currentFormat === '<h3>' && 'Heading 3'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => applyHeading('<p>')}>
              <span className="text-sm">Paragraph</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyHeading('<h1>')}>
              <span className="text-lg font-bold">Heading 1</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyHeading('<h2>')}>
              <span className="text-base font-bold">Heading 2</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyHeading('<h3>')}>
              <span className="text-sm font-bold">Heading 3</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border" />

        {/* Text Formatting */}
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('bold') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('bold')}
          title="Bold (Ctrl+B)"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('italic') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('italic')}
          title="Italic (Ctrl+I)"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('underline') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('underline')}
          title="Underline (Ctrl+U)"
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Lists */}
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('ul') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('insertUnorderedList')}
          title="Bullet List"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('ol') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('insertOrderedList')}
          title="Numbered List"
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Text Alignment */}
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('left') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('justifyLeft')}
          title="Align Left"
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('center') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('justifyCenter')}
          title="Align Center"
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeFormats.has('right') ? 'default' : 'ghost'}
          onMouseDown={handleMouseDown}
          onClick={() => applyFormat('justifyRight')}
          title="Align Right"
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Clear */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onMouseDown={handleMouseDown}
          onClick={handleClear}
          title="Clear All"
          className="h-8 px-2 text-xs"
        >
          Clear
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => {
          setIsFocused(true);
          checkActiveFormats();
        }}
        onBlur={() => setIsFocused(false)}
        onMouseUp={checkActiveFormats}
        onKeyUp={checkActiveFormats}
        className={`min-h-[150px] p-4 outline-none text-sm bg-background ${
          isFocused ? 'ring-2 ring-primary ring-offset-0' : ''
        }`}
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      />
    </div>
  );
}
