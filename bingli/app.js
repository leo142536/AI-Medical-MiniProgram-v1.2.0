// app.js
App({
  globalData: {
    userInfo: null,
    currentMember: null,
    systemInfo: null,
    hasAuth: false
  },

  onLaunch(options) {
    console.log('小程序启动', options);
    
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'family-medical-env', // 云开发环境ID
        traceUser: true
      });
    }

    // 获取系统信息
    this.getSystemInfo();
    
    // 检查更新
    this.checkUpdate();
    
    // 检查应用锁
    this.checkAppLock();
  },

  onShow(options) {
    console.log('小程序显示', options);
    
    // 记录最后活跃时间（用于应用锁判断）
    wx.setStorageSync('lastActiveTime', Date.now());
    
    // 检查是否需要锁屏
    if (this.globalData.hasAuth) {
      this.checkAppLock();
    }
  },

  onHide() {
    console.log('小程序隐藏');
    // 记录隐藏时间
    wx.setStorageSync('lastHideTime', Date.now());
  },

  onError(error) {
    console.error('小程序错误', error);
    // 错误上报
    this.reportError(error);
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      
      // 设置状态栏样式
      if (systemInfo.platform === 'ios') {
        wx.setNavigationBarColor({
          frontColor: '#000000',
          backgroundColor: '#ffffff'
        });
      }
    } catch (error) {
      console.error('获取系统信息失败', error);
    }
  },

  // 检查更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
      });
    }
  },

  // 检查应用锁
  checkAppLock() {
    const lockConfig = wx.getStorageSync('lockConfig');
    if (lockConfig && lockConfig.enabled) {
      const lastActiveTime = wx.getStorageSync('lastActiveTime') || 0;
      const now = Date.now();
      const LOCK_TIMEOUT = 60 * 1000; // 60秒锁屏

      if (now - lastActiveTime > LOCK_TIMEOUT) {
        // 需要解锁
        wx.navigateTo({
          url: '/pages/unlock/unlock'
        });
      }
    }
  },

  // 错误上报
  reportError(error) {
    // 这里可以集成错误监控服务
    try {
      wx.cloud.callFunction({
        name: 'reportError',
        data: {
          error: error.toString(),
          stack: error.stack,
          timestamp: new Date(),
          systemInfo: this.globalData.systemInfo
        }
      });
    } catch (e) {
      console.error('错误上报失败', e);
    }
  },

  // 全局方法：显示loading
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    });
  },

  // 全局方法：隐藏loading
  hideLoading() {
    wx.hideLoading();
  },

  // 全局方法：显示成功提示
  showSuccess(title) {
    wx.showToast({
      title,
      icon: 'success',
      duration: 1500
    });
  },

  // 全局方法：显示错误提示
  showError(title) {
    wx.showToast({
      title,
      icon: 'error',
      duration: 2000
    });
  }
}); 