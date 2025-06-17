// pages/settings/settings.js
const util = require('../../utils/util');

Page({
  data: {
    settings: {
      appLock: false,
      biometric: false,
      autoBackup: true,
      notification: true,
      darkMode: false
    }
  },

  onLoad() {
    this.loadSettings();
  },

  // 加载设置
  async loadSettings() {
    try {
      // 从云数据库获取设置
      const cloudDB = require('../../services/cloudDatabase');
      const cloudSettings = await cloudDB.getUserSettings();
      
      // 合并云端设置和默认设置
      const settings = {
        ...this.data.settings,
        ...cloudSettings
      };
      
      this.setData({ settings });
      
      // 更新本地缓存
      util.setStorage('appSettings', settings);
      
    } catch (error) {
      console.error('加载云端设置失败:', error);
      
      // 如果云端获取失败，使用本地缓存
      const localSettings = util.getStorage('appSettings') || {};
      this.setData({
        settings: { ...this.data.settings, ...localSettings }
      });
    }
  },

  // 保存设置
  async saveSettings() {
    try {
      // 保存到本地
      util.setStorage('appSettings', this.data.settings);
      
      // 同步到云数据库
      const cloudDB = require('../../services/cloudDatabase');
      await cloudDB.updateUserSettings(this.data.settings);
      
      console.log('设置已同步到云端');
      
    } catch (error) {
      console.error('同步设置到云端失败:', error);
      // 仍然保存到本地
      util.setStorage('appSettings', this.data.settings);
    }
  },

  // 应用锁开关
  onAppLockChange(e) {
    const enabled = e.detail.value;
    this.setData({
      'settings.appLock': enabled
    });
    
    if (enabled) {
      // 设置应用锁
      wx.navigateTo({
        url: '/pages/settings/lock/lock'
      });
    } else {
      // 关闭应用锁
      util.removeStorage('lockConfig');
    }
    
    this.saveSettings();
  },

  // 生物识别开关
  onBiometricChange(e) {
    const enabled = e.detail.value;
    
    if (enabled) {
      // 检查设备是否支持生物识别
      wx.checkIsSupportSoterAuthentication({
        success: (res) => {
          if (res.supportMode.length > 0) {
            this.setData({
              'settings.biometric': enabled
            });
            this.saveSettings();
          } else {
            util.showToast('设备不支持生物识别');
          }
        },
        fail: () => {
          util.showToast('生物识别功能不可用');
        }
      });
    } else {
      this.setData({
        'settings.biometric': enabled
      });
      this.saveSettings();
    }
  },

  // 自动备份开关
  onAutoBackupChange(e) {
    const enabled = e.detail.value;
    this.setData({
      'settings.autoBackup': enabled
    });
    this.saveSettings();
  },

  // 通知开关
  onNotificationChange(e) {
    const enabled = e.detail.value;
    this.setData({
      'settings.notification': enabled
    });
    this.saveSettings();
  },

  // 深色模式开关
  onDarkModeChange(e) {
    const enabled = e.detail.value;
    this.setData({
      'settings.darkMode': enabled
    });
    this.saveSettings();
    
    // TODO: 应用深色模式
    util.showToast('深色模式功能开发中');
  },

  // 清除缓存
  onClearCache() {
    util.showConfirm('确定要清除所有缓存吗？', '清除缓存').then(confirmed => {
      if (confirmed) {
        // 清除除用户信息外的所有缓存
        const userInfo = util.getStorage('userInfo');
        const familyInfo = util.getStorage('familyInfo');
        
        wx.clearStorageSync();
        
        // 恢复重要信息
        if (userInfo) util.setStorage('userInfo', userInfo);
        if (familyInfo) util.setStorage('familyInfo', familyInfo);
        
        util.showToast('缓存清除成功');
      }
    });
  },

  // 意见反馈
  onFeedback() {
    wx.navigateTo({
      url: '/pages/settings/feedback/feedback'
    });
  },

  // 关于应用
  onAbout() {
    wx.navigateTo({
      url: '/pages/settings/about/about'
    });
  }
}); 