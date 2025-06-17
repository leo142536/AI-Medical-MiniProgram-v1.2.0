/**
 * 格式化时间
 */
const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

/**
 * 格式化日期
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${formatNumber(month)}-${formatNumber(day)}`;
};

/**
 * 补零
 */
const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

/**
 * 获取时间问候语
 */
const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) {
    return '凌晨好';
  } else if (hour < 9) {
    return '早上好';
  } else if (hour < 12) {
    return '上午好';
  } else if (hour < 14) {
    return '中午好';
  } else if (hour < 18) {
    return '下午好';
  } else if (hour < 22) {
    return '晚上好';
  } else {
    return '夜深了';
  }
};

/**
 * 生成唯一ID
 */
const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 深拷贝
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      clonedObj[key] = deepClone(obj[key]);
    }
    return clonedObj;
  }
};

/**
 * 防抖函数
 */
const debounce = (func, wait, immediate) => {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

/**
 * 节流函数
 */
const throttle = (func, wait) => {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    if (!timeout) {
      timeout = setTimeout(function() {
        timeout = null;
        func.apply(context, args);
      }, wait);
    }
  };
};

/**
 * 显示Loading
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  });
};

/**
 * 隐藏Loading
 */
const hideLoading = () => {
  wx.hideLoading();
};

/**
 * 显示Toast
 */
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title: title,
    icon: icon,
    duration: duration
  });
};

/**
 * 显示确认对话框
 */
const showConfirm = (content, title = '提示') => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: title,
      content: content,
      success: (res) => {
        if (res.confirm) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: reject
    });
  });
};

/**
 * 获取存储数据
 */
const getStorage = (key) => {
  try {
    return wx.getStorageSync(key);
  } catch (e) {
    console.error('获取存储数据失败:', e);
    return null;
  }
};

/**
 * 设置存储数据
 */
const setStorage = (key, data) => {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (e) {
    console.error('设置存储数据失败:', e);
    return false;
  }
};

/**
 * 删除存储数据
 */
const removeStorage = (key) => {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (e) {
    console.error('删除存储数据失败:', e);
    return false;
  }
};

/**
 * 检查网络状态
 */
const checkNetwork = () => {
  return new Promise((resolve, reject) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none');
      },
      fail: reject
    });
  });
};

/**
 * 获取系统信息
 */
const getSystemInfo = () => {
  return new Promise((resolve, reject) => {
    wx.getSystemInfo({
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 数据验证
 */
const validate = {
  // 验证手机号
  phone: (phone) => {
    return /^1[3-9]\d{9}$/.test(phone);
  },
  // 验证邮箱
  email: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  // 验证身份证号
  idCard: (idCard) => {
    return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(idCard);
  },
  // 验证非空
  required: (value) => {
    return value !== null && value !== undefined && value !== '';
  }
};

/**
 * 获取时间差描述
 */
const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatDate(past);
};

/**
 * 弹窗输入
 */
const showPrompt = (title, placeholder = '', defaultValue = '') => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content: placeholder,
      editable: true,
      placeholderText: placeholder,
      success: (res) => {
        if (res.confirm) {
          resolve(res.content || defaultValue);
        } else {
          resolve(null);
        }
      },
      fail: () => {
        resolve(null);
      }
    });
  });
};

/**
 * 计算年龄
 */
const calculateAge = (birthday) => {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  getTimeGreeting,
  generateId,
  deepClone,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showToast,
  showConfirm,
  getStorage,
  setStorage,
  removeStorage,
  checkNetwork,
  getSystemInfo,
  validate,
  getTimeAgo,
  showPrompt,
  calculateAge
}; 