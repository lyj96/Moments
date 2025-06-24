import { UserConfig, defaultConfig } from '@/types';

const CONFIG_KEY = 'user_config';

// 检查是否在浏览器环境
const isClient = typeof window !== 'undefined';

// 获取用户配置
export const getUserConfig = (): UserConfig => {
  // 如果不在浏览器环境，直接返回默认配置
  if (!isClient) {
    return defaultConfig;
  }

  try {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // 合并默认配置和保存的配置，确保有完整的配置项
      return { ...defaultConfig, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load user config:', error);
  }
  return defaultConfig;
};

// 保存用户配置
export const saveUserConfig = (config: UserConfig): boolean => {
  // 如果不在浏览器环境，返回 false
  if (!isClient) {
    return false;
  }

  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save user config:', error);
    return false;
  }
};

// 重置为默认配置
export const resetUserConfig = (): UserConfig => {
  // 如果不在浏览器环境，直接返回默认配置
  if (!isClient) {
    return defaultConfig;
  }

  try {
    localStorage.removeItem(CONFIG_KEY);
    return defaultConfig;
  } catch (error) {
    console.error('Failed to reset user config:', error);
    return defaultConfig;
  }
};

// 更新部分配置
export const updateUserConfig = (updates: Partial<UserConfig>): UserConfig => {
  const currentConfig = getUserConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveUserConfig(newConfig);
  return newConfig;
}; 