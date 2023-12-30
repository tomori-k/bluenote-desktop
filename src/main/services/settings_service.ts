import path from 'path'
import fs from 'fs/promises'
import {
  Settings,
  getDefaultSettings,
  validateSettings,
} from '../../common/settings'

export class SettingsService {
  private settings: Settings | null = null

  constructor(readonly appDataDir: string) {}

  /**
   * 設定ファイルのパスを取得
   */
  private getSettingsFilePath() {
    return path.join(this.appDataDir, 'settings.json')
  }

  /**
   * 設定を読み込む
   */
  public async getSettings(): Promise<Settings> {
    if (this.settings == null) {
      try {
        const json = await fs.readFile(this.getSettingsFilePath(), 'utf-8')
        const settings = JSON.parse(json)
        const defaultValues = getDefaultSettings()

        this.settings = validateSettings({
          ...defaultValues,
          ...settings,
        })
      } catch (e) {
        this.settings = getDefaultSettings()
      }
    }

    return this.settings
  }

  public updateSettings(settings: Settings) {
    this.settings = settings
  }

  /**
   * 設定を保存する
   */
  public async saveSettings(): Promise<void> {
    if (this.settings == null) return

    await fs.writeFile(
      this.getSettingsFilePath(),
      JSON.stringify(this.settings),
      'utf-8'
    )
  }
}
