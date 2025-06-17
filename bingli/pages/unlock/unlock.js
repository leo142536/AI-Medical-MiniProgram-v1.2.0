/* global getCurrentPages */
// pages/unlock/unlock.js
const util = require('../../utils/util');

Page({
  data: {
    lockConfig: null,
    inputPassword: '',
    showBiometric: false,
    errorCount: 0,
    lockTime: 0
  },

  onLoad() {
    this.loadLockConfig();
    this.checkBiometricSupport();
  },

  // 加载锁屏配置
  loadLockConfig() {
    const lockConfig = util.getStorage('lockConfig');
    if (!lockConfig) {
      // 没有锁屏配置，直接返回
      wx.navigateBack();
      return;
    }
    
    this.setData({
      lockConfig: lockConfig
    });
  },

  // 检查生物识别支持
  checkBiometricSupport() {
    wx.checkIsSupportSoterAuthentication({
      success: (res) => {
        const supportBiometric = res.supportMode.includes('fingerPrint') || 
                                res.supportMode.includes('facial');
        this.setData({
          showBiometric: supportBiometric && this.data.lockConfig?.biometric
        });
        
        // 如果支持生物识别且已启用，自动唤起
        if (supportBiometric && this.data.lockConfig?.biometric) {
          this.authenticateWithBiometric();
        }
      }
    });
  },

  // 密码输入
  onPasswordInput(e) {
    const value = e.detail.value;
    this.setData({
      inputPassword: value
    });
    
    // 如果是数字密码且达到设定长度，自动验证
    if (this.data.lockConfig.type === 'pin' && 
        value.length === this.data.lockConfig.password.length) {
      this.verifyPassword();
    }
  },

  // 验证密码
  verifyPassword() {
    const { inputPassword, lockConfig } = this.data;
    
    if (inputPassword === lockConfig.password) {
      // 密码正确，解锁成功
      this.unlockSuccess();
    } else {
      // 密码错误
      this.unlockFailed();
    }
  },

  // 生物识别认证
  authenticateWithBiometric() {
    wx.startSoterAuthentication({
      requestAuthModes: ['fingerPrint', 'facial'],
      challenge: 'unlock_app',
      authContent: '请验证身份以解锁应用',
      success: (res) => {
        if (res.isOk) {
          this.unlockSuccess();
        }
      },
      fail: (err) => {
        console.log('生物识别失败', err);
        // 生物识别失败，显示密码输入
      }
    });
  },

  // 解锁成功
  unlockSuccess() {
    // 记录最后活跃时间
    wx.setStorageSync('lastActiveTime', Date.now());
    
    // 重置错误计数
    this.setData({
      errorCount: 0
    });
    
    util.showToast('解锁成功');
    
    // 返回上一页或首页
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.reLaunch({
        url: '/pages/home/home'
      });
    }
  },

  // 解锁失败
  unlockFailed() {
    const errorCount = this.data.errorCount + 1;
    this.setData({
      errorCount: errorCount,
      inputPassword: ''
    });
    
    util.showToast('密码错误');
    
    // 错误次数达到限制，锁定应用
    if (errorCount >= 5) {
      this.lockApp();
    }
  },

  // 锁定应用
  lockApp() {
    const lockTime = 5 * 60 * 1000; // 5分钟
    wx.setStorageSync('appLockTime', Date.now() + lockTime);
    
    this.setData({
      lockTime: lockTime
    });
    
    util.showToast('错误次数过多，应用已锁定5分钟');
    
    // 启动倒计时
    this.startCountdown();
  },

  // 启动倒计时
  startCountdown() {
    const timer = setInterval(() => {
      const lockTime = wx.getStorageSync('appLockTime');
      const now = Date.now();
      
      if (now >= lockTime) {
        // 锁定时间结束
        clearInterval(timer);
        this.setData({
          lockTime: 0,
          errorCount: 0
        });
        wx.removeStorageSync('appLockTime');
      } else {
        // 更新剩余时间
        this.setData({
          lockTime: lockTime - now
        });
      }
    }, 1000);
  },

  // 忘记密码
  onForgotPassword() {
    util.showConfirm(
      '忘记密码将清除所有应用数据，是否继续？',
      '忘记密码'
    ).then(confirmed => {
      if (confirmed) {
        // 清除所有数据并重新登录
        wx.clearStorageSync();
        wx.reLaunch({
          url: '/pages/login/login'
        });
      }
    });
  },

  // 使用生物识别
  onUseBiometric() {
    this.authenticateWithBiometric();
  }
}); 