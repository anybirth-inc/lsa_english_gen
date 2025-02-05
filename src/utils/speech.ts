export function startSpeechRecognition(
  onResult: (text: string) => void,
  onError: () => void
) {
  if (!('webkitSpeechRecognition' in window)) {
    alert('このブラウザは音声認識をサポートしていません。');
    onError();
    return;
  }

  // @ts-ignore - webkitSpeechRecognition is not in the types
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      alert('マイクの使用が許可されていません。ブラウザの設定を確認してください。');
    } else {
      alert('音声認識中にエラーが発生しました。');
    }
    onError();
  };

  recognition.onend = () => {
    onError();
  };

  try {
    recognition.start();
  } catch (error) {
    console.error('Failed to start speech recognition:', error);
    alert('音声認識の開始に失敗しました。');
    onError();
  }
}