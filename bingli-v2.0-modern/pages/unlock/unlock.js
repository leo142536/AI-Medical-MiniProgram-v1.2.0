/* global getCurrentPages */
// pages/unlock/unlock.js
const util = require('../../utils/util');
const InteractionFeedback = require('../../utils/interaction-feedback');

Page({
  data: {
    lockConfig: null,
    inputPassword: '',
    showBiometric: false,
    errorCount: 0,
    lockTime: 0,
    loading: false,
    password: '', // 当前输入的密码
    remainingAttempts: 5,
    errorMessage: '',
    biometricEnabled: false,
    biometricIcon: '👆',
    biometricText: '指纹解锁',
    isLocked: false,
    lockTimeRemaining: 0,
    lockProgress: 0,
    emergencyMode: false,
    userInfo: null
  },

  onLoad() {
    this.setData({ loading: true });
    InteractionFeedback.showLoading('正在初始化解锁界面...');
    this.loadLockConfig();
    this.checkBiometricSupport();
    this.loadUserInfo();
    this.setData({ loading: false });
    InteractionFeedback.hideLoading();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = util.getStorage('userInfo');
    this.setData({ userInfo });
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
        
        let biometricIcon = '👆';
        let biometricText = '指纹解锁';
        
        if (res.supportMode.includes('facial')) {
          biometricIcon = '😊';
          biometricText = '面容解锁';
        }
        
        this.setData({
          showBiometric: supportBiometric && this.data.lockConfig?.biometric,
          biometricEnabled: supportBiometric && this.data.lockConfig?.biometric,
          biometricIcon,
          biometricText
        });
        
        // 如果支持生物识别且已启用，自动唤起
        if (supportBiometric && this.data.lockConfig?.biometric) {
          setTimeout(() => {
            this.authenticateWithBiometric();
          }, 500);
        }
      }
    });
  },

  // 数字键盘输入
  inputNumber(e) {
    const num = e.currentTarget.dataset.num;
    const currentPassword = this.data.password;
    
    if (currentPassword.length >= 6) {
      return; // 最多6位密码
    }
    
    const newPassword = currentPassword + num;
    this.setData({
      password: newPassword,
      errorMessage: ''
    });
    
    // 如果达到密码长度，自动验证
    if (newPassword.length === (this.data.lockConfig?.password?.length || 6)) {
      setTimeout(() => {
        this.verifyPassword();
      }, 200);
    }
  },

  // 删除数字
  deleteNumber() {
    const currentPassword = this.data.password;
    if (currentPassword.length > 0) {
      this.setData({
        password: currentPassword.slice(0, -1),
        errorMessage: ''
      });
    }
  },

  // 验证密码
  verifyPassword() {
    const { password, lockConfig } = this.data;
    
    if (password === (lockConfig?.password || '123456')) {
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
        InteractionFeedback.showInfo('生物识别失败，请使用密码解锁');
      }
    });
  },

  // 使用生物识别
  useBiometric() {
    this.authenticateWithBiometric();
  },

  // 解锁成功
  unlockSuccess() {
    // 记录最后活跃时间
    wx.setStorageSync('lastActiveTime', Date.now());
    
    // 重置错误计数
    this.setData({
      errorCount: 0,
      password: '',
      errorMessage: ''
    });
    
    InteractionFeedback.showSuccess('解锁成功');
    
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
    const remainingAttempts = 5 - errorCount;
    
    this.setData({
      errorCount: errorCount,
      password: '',
      remainingAttempts: remainingAttempts,
      errorMessage: `密码错误，还可尝试 ${remainingAttempts} 次`
    });
    
    // 震动反馈
    wx.vibrateShort();
    
    InteractionFeedback.showError(`密码错误，还可尝试 ${remainingAttempts} 次`);
    
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
      isLocked: true,
      lockTimeRemaining: 300, // 5分钟 = 300秒
      emergencyMode: true
    });
    
    InteractionFeedback.showError('错误次数过多，应用已锁定5分钟');
    
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
          isLocked: false,
          lockTimeRemaining: 0,
          errorCount: 0,
          remainingAttempts: 5,
          emergencyMode: false
        });
        wx.removeStorageSync('appLockTime');
        InteractionFeedback.showSuccess('应用已解锁，请重新输入密码');
      } else {
        // 更新剩余时间
        const remaining = Math.ceil((lockTime - now) / 1000);
        const progress = ((300 - remaining) / 300) * 100;
        
        this.setData({
          lockTimeRemaining: remaining,
          lockProgress: progress
        });
      }
    }, 1000);
  },

  // 忘记密码
  forgotPassword() {
    InteractionFeedback.showConfirm(
      '忘记密码将清除所有应用数据，是否继续？',
      '此操作不可恢复'
    ).then(confirmed => {
      if (confirmed) {
        InteractionFeedback.showLoading('正在清除数据...');
        
        // 清除所有数据并重新登录
        wx.clearStorageSync();
        
        setTimeout(() => {
          InteractionFeedback.hideLoading();
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }, 1000);
      }
    });
  },

  // 紧急电话
  callEmergency() {
    wx.makePhoneCall({
      phoneNumber: '120',
      fail: () => {
        InteractionFeedback.showError('无法拨打电话，请手动拨打120');
      }
    });
  },

  // 联系家人
  contactFamily() {
    InteractionFeedback.showInfo('紧急联系功能开发中');
  },

  // 紧急操作事件处理
  onEmergencyAction(e) {
    // 通过判断点击的按钮来执行对应操作
    const detail = e.detail;
    if (detail && detail.buttonIndex !== undefined) {
      if (detail.buttonIndex === 0) {
        // 紧急电话
        this.callEmergency();
      } else if (detail.buttonIndex === 1) {
        // 联系家人
        this.contactFamily();
      }
    }
  }
}); 