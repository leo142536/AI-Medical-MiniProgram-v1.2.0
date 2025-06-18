// =================================================
//  微信小程序交互反馈工具类 - 基于GitHub最佳实践
//  参考: WeUI、TDesign、Ant Design Mini 等优秀库
// =================================================

/**
 * 统一的交互反馈管理器
 */
class InteractionFeedback {
  
  /**
   * 显示成功提示
   * @param {String} title 提示内容
   * @param {Number} duration 持续时间（毫秒）
   * @param {String} description 描述信息
   */
  static showSuccess(title = '操作成功', duration = 2000, description = '') {
    // 优先使用现代化Toast组件，如果不可用则降级到系统Toast
    try {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      if (currentPage && currentPage.selectComponent) {
        const toastComponent = currentPage.selectComponent('#modern-toast');
        if (toastComponent) {
          toastComponent.setData({
            show: true,
            type: 'success',
            message: title,
            description,
            duration,
            position: 'top'
          });
          return;
        }
      }
    } catch (e) {
      console.log('现代化Toast不可用，使用系统Toast');
    }
    
    // 降级方案
    wx.showToast({
      title,
      icon: 'success',
      duration,
      mask: true
    });
  }

  /**
   * 显示错误提示
   * @param {String} title 错误内容
   * @param {Number} duration 持续时间（毫秒）
   */
  static showError(title = '操作失败', duration = 3000) {
    wx.showToast({
      title,
      icon: 'error',
      duration,
      mask: true
    });
  }

  /**
   * 显示加载中提示
   * @param {String} title 加载文案
   * @param {Boolean} mask 是否显示透明蒙层
   */
  static showLoading(title = '加载中...', mask = true) {
    wx.showLoading({
      title,
      mask
    });
  }

  /**
   * 隐藏加载提示
   */
  static hideLoading() {
    wx.hideLoading();
  }

  /**
   * 显示模态对话框
   * @param {Object} options 配置选项
   */
  static showModal(options = {}) {
    const defaultOptions = {
      title: '提示',
      content: '',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      cancelColor: '#000000',
      confirmColor: '#576B95'
    };

    return new Promise((resolve, reject) => {
      wx.showModal({
        ...defaultOptions,
        ...options,
        success: (res) => {
          if (res.confirm) {
            resolve(true);
          } else if (res.cancel) {
            resolve(false);
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 显示操作菜单
   * @param {Array} itemList 菜单项数组
   * @param {String} itemColor 文字颜色
   */
  static showActionSheet(itemList, itemColor = '#000000') {
    return new Promise((resolve, reject) => {
      wx.showActionSheet({
        itemList,
        itemColor,
        success: (res) => {
          resolve(res.tapIndex);
        },
        fail: (res) => {
          if (res.errMsg === 'showActionSheet:fail cancel') {
            resolve(-1); // 用户取消
          } else {
            reject(res);
          }
        }
      });
    });
  }

  /**
   * 轻微的触觉反馈
   * @param {String} type 反馈类型 'light' | 'medium' | 'heavy'
   */
  static vibrate(type = 'light') {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type });
    }
  }

  /**
   * API调用封装 - 带统一错误处理
   * @param {Function} apiCall API调用函数
   * @param {Object} params 参数
   * @param {Object} options 配置选项
   */
  static async callAPI(apiCall, params = {}, options = {}) {
    const {
      showLoading = true,
      loadingText = '请稍候...',
      successMessage = '',
      errorMessage = '请求失败，请重试',
      vibrate = false
    } = options;

    try {
      if (showLoading) {
        this.showLoading(loadingText);
      }

      const result = await apiCall(params);

      if (showLoading) {
        this.hideLoading();
      }

      if (successMessage) {
        this.showSuccess(successMessage);
      }

      if (vibrate) {
        this.vibrate('light');
      }

      return result;
    } catch (error) {
      if (showLoading) {
        this.hideLoading();
      }

      console.error('API调用错误:', error);
      this.showError(errorMessage);
      throw error;
    }
  }

  /**
   * 网络状态检查
   */
  static async checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          if (res.networkType === 'none') {
            this.showError('网络连接异常，请检查网络设置');
            resolve(false);
          } else {
            resolve(true);
          }
        },
        fail: () => {
          this.showError('无法获取网络状态');
          resolve(false);
        }
      });
    });
  }

  /**
   * 防抖处理 - 防止重复点击
   * @param {Function} func 要执行的函数
   * @param {Number} delay 延迟时间（毫秒）
   */
  static debounce(func, delay = 500) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 节流处理 - 限制执行频率
   * @param {Function} func 要执行的函数
   * @param {Number} limit 时间间隔（毫秒）
   */
  static throttle(func, limit = 1000) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 页面跳转封装 - 带加载状态
   * @param {String} url 跳转路径
   * @param {Object} params 传递参数
   * @param {String} type 跳转类型 'navigateTo' | 'redirectTo' | 'switchTab'
   */
  static async navigateWithLoading(url, params = {}, type = 'navigateTo') {
    try {
      this.showLoading('跳转中...');
      
      // 构建完整URL
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      await new Promise((resolve, reject) => {
        wx[type]({
          url: fullUrl,
          success: resolve,
          fail: reject
        });
      });

      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('页面跳转失败');
      throw error;
    }
  }

  /**
   * 复制到剪贴板 - 带反馈
   * @param {String} data 要复制的内容
   * @param {String} successMessage 成功提示
   */
  static async copyToClipboard(data, successMessage = '已复制到剪贴板') {
    try {
      await new Promise((resolve, reject) => {
        wx.setClipboardData({
          data,
          success: resolve,
          fail: reject
        });
      });
      
      this.showSuccess(successMessage);
      this.vibrate('light');
    } catch (error) {
      this.showError('复制失败');
      throw error;
    }
  }
}

module.exports = InteractionFeedback; 