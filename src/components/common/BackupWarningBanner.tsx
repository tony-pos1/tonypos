import React from 'react';
import { useI18n } from '../../i18n';
import { exportDatabaseBackup } from '../../db/db';
import { saveBackupFile } from '../../utils/fileBackup';
import { AlertTriangle, Download, X } from 'lucide-react';
import { sound } from '../../utils/sound';

interface BackupWarningBannerProps {
  needsBackup: boolean;
  onDismiss: () => void;
  onBackupCompleted?: () => void;
}

export const BackupWarningBanner: React.FC<BackupWarningBannerProps> = ({
  needsBackup,
  onDismiss,
  onBackupCompleted,
}) => {
  const { t } = useI18n();

  if (!needsBackup) return null;

  const handleQuickBackup = async () => {
    try {
      const json = await exportDatabaseBackup();
      const today = new Date().toISOString().split('T')[0];
      const defaultFileName = `kind-pos-backup-${today}.json`;
      const saved = await saveBackupFile(json, defaultFileName);
      if (saved) {
        sound.playCashRegister();
        if (onBackupCompleted) onBackupCompleted();
        onDismiss();
      }
    } catch (err) {
      console.error('Failed to export backup', err);
    }
  };

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between shadow-md z-20 text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-slate-900" />
        <span>{t('backupWarning')}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleQuickBackup}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('backupNow')}</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-amber-600/30 rounded text-slate-900 transition cursor-pointer"
          title={t('close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
