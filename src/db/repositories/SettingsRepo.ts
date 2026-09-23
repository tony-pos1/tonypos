import { db } from '../db';
import { AppSettings } from '../../types';
import { defaultSettings } from '../seedData';

export interface ISettingsRepo {
  getSettings(): Promise<AppSettings>;
  updateSettings(changes: Partial<AppSettings>): Promise<AppSettings>;
  resetSettings(): Promise<AppSettings>;
}

export class DexieSettingsRepo implements ISettingsRepo {
  async getSettings(): Promise<AppSettings> {
    const list = await db.settings.toArray();
    if (list.length === 0) {
      await db.settings.put(defaultSettings);
      return defaultSettings;
    }
    const current = list[0];
    if (!current.customPromptPayQrImage && defaultSettings.customPromptPayQrImage) {
      current.customPromptPayQrImage = defaultSettings.customPromptPayQrImage;
      current.useCustomPromptPayQr = true;
      await db.settings.put(current);
    }
    return current;
  }

  async updateSettings(changes: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...changes,
    };
    await db.settings.put(updated);
    return updated;
  }

  async resetSettings(): Promise<AppSettings> {
    await db.settings.clear();
    await db.settings.put(defaultSettings);
    return defaultSettings;
  }
}

export const settingsRepo = new DexieSettingsRepo();
