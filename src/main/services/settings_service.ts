import path from 'path'
import fs from 'fs/promises'
import {
  Settings,
  getDefaultSettings,
  validateSettings,
} from '../../common/settings'

export type WindowProps = {
  width: number
  height: number
  x: number
  y: number
}

export function getDefaultWindowProps() {
  return {
    width: 800,
    height: 600,
    x: 300,
    y: 300,
  }
}

function isWindowProps(value: unknown): value is WindowProps {
  return (
    value != null &&
    typeof value === 'object' &&
    'width' in value &&
    typeof value.width === 'number' &&
    'height' in value &&
    typeof value.height === 'number' &&
    'x' in value &&
    typeof value.x === 'number' &&
    'y' in value &&
    typeof value.y === 'number'
  )
}

function validateWindowProps(props: unknown): WindowProps {
  if (!isWindowProps(props)) {
    throw new TypeError('Invalid window props')
  }

  return props
}

export type SettingsJsonSchema = {
  windowProps: WindowProps
  settings: Settings
}

function validateSettingsJsonSchema(json: unknown): SettingsJsonSchema {
  if (
    json == null ||
    typeof json !== 'object' ||
    !('windowProps' in json) ||
    !('settings' in json)
  ) {
    throw new TypeError('Invalid settings')
  }

  return {
    windowProps: validateWindowProps(json.windowProps),
    settings: validateSettings(json.settings),
  }
}

export class SettingsService {
  private settings: SettingsJsonSchema | null = null

  constructor(readonly appDataDir: string) {}

  /**
   * 設定ファイルのパスを取得
   */
  private getSettingsFilePath() {
    return path.join(this.appDataDir, 'settings.json')
  }

  private async getSettingsJsonSchema(): Promise<SettingsJsonSchema> {
    if (this.settings == null) {
      try {
        const json = await fs.readFile(this.getSettingsFilePath(), 'utf-8')
        const settings = JSON.parse(json)

        this.settings = validateSettingsJsonSchema(settings)
      } catch (e) {
        this.settings = {
          windowProps: getDefaultWindowProps(),
          settings: getDefaultSettings(),
        }
      }
    }

    return this.settings
  }

  /**
   * 設定を読み込む
   */
  public async getSettings(): Promise<Settings> {
    const { settings } = await this.getSettingsJsonSchema()
    return settings
  }

  /**
   * ウィンドウプロパティを読み込む
   */
  public async getWindowProps(): Promise<WindowProps> {
    const { windowProps } = await this.getSettingsJsonSchema()
    return windowProps
  }

  /**
   * 設定を更新する
   */
  public updateSettings(settings: Settings) {
    if (this.settings == null) return

    this.settings.settings = settings
  }

  /**
   * ウィンドウプロパティを更新する
   */
  public updateWindowProps(props: WindowProps) {
    if (this.settings == null) return

    this.settings.windowProps = props
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
