/**
 * Utility functions for saving and picking backup files using the File System Access API
 * with transparent fallback to standard browser download / input element.
 */

declare global {
  interface Window {
    showSaveFilePicker?: (options?: any) => Promise<any>;
    showOpenFilePicker?: (options?: any) => Promise<any[]>;
  }
}

export function isSaveFilePickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    typeof window.showSaveFilePicker === 'function'
  );
}

export function isOpenFilePickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    typeof window.showOpenFilePicker === 'function'
  );
}

/**
 * Saves a JSON backup string to disk.
 * When window.showSaveFilePicker is supported, lets the user choose the folder and filename.
 * Falls back to Blob + <a download> for unsupported browsers (Safari, iOS, older browsers).
 * Returns true if saved, false if user cancelled.
 */
export async function saveBackupFile(
  jsonContent: string,
  defaultFileName: string = `kind-pos-backup-${new Date().toISOString().split('T')[0]}.json`
): Promise<boolean> {
  if (isSaveFilePickerSupported() && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [
          {
            description: 'JSON Backup File (*.json)',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonContent);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User cancelled the save dialog
        return false;
      }
      throw err;
    }
  }

  // Fallback for browsers without File System Access API
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Prompts user to pick a JSON backup file using the native file picker if supported.
 * Returns the File object, or null if cancelled or not supported.
 */
export async function pickBackupFile(): Promise<File | null> {
  if (isOpenFilePickerSupported() && window.showOpenFilePicker) {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'JSON Backup File (*.json)',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });
      if (!handles || handles.length === 0) return null;
      const file = await handles[0].getFile();
      return file || null;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User cancelled the open dialog
        return null;
      }
      throw err;
    }
  }
  return null;
}
