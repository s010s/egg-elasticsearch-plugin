import { EggAppInfo, EggAppConfig, PowerPartial } from 'egg'

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>

  config.elasticsearch = {}

  return config
}
