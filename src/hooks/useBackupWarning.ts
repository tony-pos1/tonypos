import { useState, useEffect } from 'react';
import { settingsRepo } from '../db/repositories';

export function useBackupWarning() {
  const [needsBackup, setNeedsBackup] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  const checkBackupStatus = async () => {
    try {
      const settings = await settingsRepo.getSettings();
      if (!settings.lastBackupDate) {
        setNeedsBackup(true);
        setLastBackupDate(null);
        return;
      }

      setLastBackupDate(settings.lastBackupDate);
      const last = new Date(settings.lastBackupDate).getTime();
      const now = Date.now();
      const diffDays = (now - last) / (1000 * 60 * 60 * 24);
      if (diffDays >= 7) {
        setNeedsBackup(true);
      } else {
        setNeedsBackup(false);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkBackupStatus();
  }, []);

  return {
    needsBackup,
    lastBackupDate,
    refreshBackupStatus: checkBackupStatus,
    dismissWarning: () => setNeedsBackup(false),
  };
}
