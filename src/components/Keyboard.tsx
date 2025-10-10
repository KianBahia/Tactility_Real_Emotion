interface KeyboardProps {
  onKeyPress: (key: string) => void;
}

export function Keyboard({ onKeyPress }: KeyboardProps) {
  const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
  const emojis = ['😊', '😢', '😠', '😐', '😂', '🙏'];

  return (
    <div className="h-full flex flex-col justify-end p-2 gap-1.5">
      {/* Emoji Row */}
      <div className="flex gap-1 justify-center mb-1">
        {emojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onKeyPress(emoji)}
            className="w-10 h-8 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* First Row */}
      <div className="flex gap-1 justify-center">
        {row1.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="w-8 h-10 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors uppercase"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Second Row */}
      <div className="flex gap-1 justify-center px-3">
        {row2.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="w-8 h-10 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors uppercase"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Third Row */}
      <div className="flex gap-1 justify-center items-center">
        <button
          onClick={() => onKeyPress('⇧')}
          className="w-12 h-10 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors"
        >
          ⇧
        </button>
        {row3.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="w-8 h-10 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors uppercase"
          >
            {key}
          </button>
        ))}
        <button
          onClick={() => onKeyPress('backspace')}
          className="w-12 h-10 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors"
        >
          ⌫
        </button>
      </div>

      {/* Fourth Row - Space Bar */}
      <div className="flex gap-1 justify-center">
        <button
          onClick={() => onKeyPress('123')}
          className="w-14 h-10 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors text-sm"
        >
          123
        </button>
        <button
          onClick={() => onKeyPress('space')}
          className="flex-1 h-10 bg-white rounded flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors"
        >
          space
        </button>
        <button
          onClick={() => onKeyPress('↵')}
          className="w-14 h-10 bg-blue-500 text-white rounded flex items-center justify-center shadow-sm active:bg-blue-600 transition-colors"
        >
          ↵
        </button>
      </div>
    </div>
  );
}
