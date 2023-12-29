export type Settings = {}

/**
 * デフォルトの設定値を取得する
 */
export function getDefaultSettings(): Settings {
  return {}
}

/**
 * 設定値を検証する
 */
export function validateSettings(settings: unknown): Settings {
  if (settings == null) {
    throw new TypeError('settings is null or undefined')
  }
  return settings
}
