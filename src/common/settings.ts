const WIDTH_DEFAULT_SIDE_MENU_PX = 200

type AppLayoutParams = {
  sideMenu: number
  tabs: Record<string, number | undefined>
}

export type Settings = {
  appLayoutParams: AppLayoutParams
}

/**
 * デフォルトの設定値を取得する
 */
export function getDefaultSettings(): Settings {
  return {
    appLayoutParams: {
      sideMenu: WIDTH_DEFAULT_SIDE_MENU_PX,
      tabs: {},
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object'
}

function isNumberRecord(
  value: Record<string, unknown>
): value is Record<string, number> {
  return Object.values(value).every((v) => typeof v === 'number')
}

function isAppLayoutParams(value: unknown): value is AppLayoutParams {
  if (value == null || typeof value !== 'object') {
    return false
  }

  if (
    !('sideMenu' in value) ||
    value.sideMenu == null ||
    typeof value.sideMenu !== 'number'
  ) {
    return false
  }

  if (
    !('tabs' in value) ||
    !isRecord(value.tabs) ||
    !isNumberRecord(value.tabs)
  ) {
    return false
  }

  return true
}

function isSettings(value: unknown): value is Settings {
  if (value == null) {
    return false
  }

  if (typeof value !== 'object') {
    return false
  }

  if (
    !('appLayoutParams' in value) ||
    !isAppLayoutParams(value.appLayoutParams)
  ) {
    return false
  }

  return true
}

/**
 * 設定値を検証する
 */
export function validateSettings(settings: unknown): Settings {
  if (!isSettings(settings)) {
    throw new TypeError('Invalid settings')
  }

  return settings
}
