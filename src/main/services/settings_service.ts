import path from 'path'
import fs from 'fs/promises'
import {
  Settings,
  getDefaultSettings,
  validateSettings,
} from '../../common/settings'

export class SettingsService {
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
    const json = await fs.readFile(this.getSettingsFilePath(), 'utf-8')
    const settings = JSON.parse(json)
    const defaultValues = getDefaultSettings()

    return validateSettings({
      ...defaultValues,
      ...settings,
    })
  }

  /**
   * 設定を更新する
   */
  public async updateSettings(settings: Settings): Promise<void> {
    await fs.writeFile(
      this.getSettingsFilePath(),
      JSON.stringify(settings),
      'utf-8'
    )
  }
}
