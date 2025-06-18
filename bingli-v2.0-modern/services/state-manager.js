// services/state-manager.js - 全局状态管理系统
class GlobalStateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.middleware = [];
    this.history = [];
    this.maxHistorySize = 50;
    this.persistKeys = new Set(); // 需要持久化的状态键
    this.batchUpdates = new Map(); // 批量更新
    this.updateTimer = null;
  }

  // 初始化状态管理器
  init() {
    // 从本地存储恢复状态
    this.restoreFromStorage();
    
    // 监听应用生命周期
    this.setupLifecycleListeners();
    
    console.log('状态管理器已初始化');
  }

  // 设置状态
  setState(key, value, options = {}) {
    const { 
      notify = true, 
      persist = false, 
      batch = false,
      merge = false 
    } = options;

    const oldValue = this.state[key];
    
    // 深度比较，避免不必要的更新
    if (this.deepEqual(oldValue, value)) {
      return;
    }

    // 合并对象
    if (merge && typeof oldValue === 'object' && typeof value === 'object') {
      this.state[key] = { ...oldValue, ...value };
    } else {
      this.state[key] = value;
    }

    // 记录历史
    this.addToHistory('setState', key, oldValue, this.state[key]);

    // 标记需要持久化
    if (persist) {
      this.persistKeys.add(key);
    }

    // 执行中间件
    this.runMiddleware('setState', { key, oldValue, newValue: this.state[key] });

    // 批量更新或立即通知
    if (batch) {
      this.addToBatchUpdate(key, this.state[key]);
    } else if (notify) {
      this.notifyListeners(key, this.state[key], oldValue);
    }

    // 持久化状态
    if (persist || this.persistKeys.has(key)) {
      this.persistToStorage(key, this.state[key]);
    }
  }

  // 获取状态
  getState(key, defaultValue = null) {
    return this.state.hasOwnProperty(key) ? this.state[key] : defaultValue;
  }

  // 获取所有状态
  getAllState() {
    return { ...this.state };
  }

  // 批量设置状态
  setBatchState(updates, options = {}) {
    const { notify = true, persist = false } = options;
    
    Object.entries(updates).forEach(([key, value]) => {
      this.setState(key, value, { 
        notify: false, 
        persist, 
        batch: true 
      });
    });

    // 统一通知
    if (notify) {
      this.flushBatchUpdates();
    }
  }

  // 添加到批量更新
  addToBatchUpdate(key, value) {
    this.batchUpdates.set(key, value);
    
    // 防抖处理
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    this.updateTimer = setTimeout(() => {
      this.flushBatchUpdates();
    }, 16); // 一帧时间
  }

  // 刷新批量更新
  flushBatchUpdates() {
    if (this.batchUpdates.size === 0) return;

    const updates = new Map(this.batchUpdates);
    this.batchUpdates.clear();

    // 通知所有监听者
    updates.forEach((value, key) => {
      this.notifyListeners(key, value);
    });

    console.log('批量更新完成:', updates.size, '个状态');
  }

  // 订阅状态变化
  subscribe(key, listener, options = {}) {
    const { immediate = false, once = false } = options;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    // 包装监听器
    const wrappedListener = once ? (...args) => {
      listener(...args);
      this.unsubscribe(key, wrappedListener);
    } : listener;

    this.listeners.get(key).add(wrappedListener);

    // 立即执行
    if (immediate && this.state.hasOwnProperty(key)) {
      try {
        wrappedListener(this.state[key], undefined);
      } catch (error) {
        console.error('监听器执行失败:', error);
      }
    }

    // 返回取消订阅函数
    return () => this.unsubscribe(key, wrappedListener);
  }

  // 取消订阅
  unsubscribe(key, listener) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  // 通知监听者
  notifyListeners(key, newValue, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners && listeners.size > 0) {
      listeners.forEach(listener => {
        try {
          listener(newValue, oldValue);
        } catch (error) {
          console.error('监听器执行失败:', key, error);
        }
      });
    }

    // 通知通配符监听者
    this.notifyWildcardListeners(key, newValue, oldValue);
  }

  // 通知通配符监听者
  notifyWildcardListeners(key, newValue, oldValue) {
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners && wildcardListeners.size > 0) {
      wildcardListeners.forEach(listener => {
        try {
          listener({ key, newValue, oldValue });
        } catch (error) {
          console.error('通配符监听器执行失败:', error);
        }
      });
    }
  }

  // 添加中间件
  use(middleware) {
    this.middleware.push(middleware);
  }

  // 运行中间件
  runMiddleware(action, payload) {
    this.middleware.forEach(middleware => {
      try {
        middleware(action, payload, this.state);
      } catch (error) {
        console.error('中间件执行失败:', error);
      }
    });
  }

  // 计算属性
  computed(key, computeFn, dependencies = []) {
    // 初始计算
    const compute = () => {
      try {
        const value = computeFn(this.state);
        this.setState(key, value, { notify: true });
      } catch (error) {
        console.error('计算属性失败:', key, error);
      }
    };

    // 监听依赖变化
    dependencies.forEach(dep => {
      this.subscribe(dep, compute);
    });

    // 立即计算
    compute();

    return () => {
      // 清理函数
      dependencies.forEach(dep => {
        this.unsubscribe(dep, compute);
      });
    };
  }

  // 重置状态
  reset(keys = null) {
    if (keys === null) {
      // 重置所有状态
      const oldState = { ...this.state };
      this.state = {};
      
      // 通知所有监听者
      Object.keys(oldState).forEach(key => {
        this.notifyListeners(key, undefined, oldState[key]);
      });
    } else {
      // 重置指定状态
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => {
        const oldValue = this.state[key];
        delete this.state[key];
        this.notifyListeners(key, undefined, oldValue);
      });
    }

    console.log('状态已重置:', keys || 'all');
  }

  // 持久化到本地存储
  persistToStorage(key, value) {
    try {
      const storageKey = `state_${key}`;
      wx.setStorageSync(storageKey, {
        value,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('持久化状态失败:', key, error);
    }
  }

  // 从本地存储恢复
  restoreFromStorage() {
    try {
      // 获取所有状态键
      const info = wx.getStorageInfoSync();
      const stateKeys = info.keys.filter(key => key.startsWith('state_'));

      stateKeys.forEach(storageKey => {
        try {
          const data = wx.getStorageSync(storageKey);
          if (data && data.value !== undefined) {
            const stateKey = storageKey.replace('state_', '');
            this.state[stateKey] = data.value;
            this.persistKeys.add(stateKey);
          }
        } catch (error) {
          console.error('恢复状态失败:', storageKey, error);
        }
      });

      console.log('状态已从本地存储恢复');
    } catch (error) {
      console.error('恢复状态失败:', error);
    }
  }

  // 添加到历史记录
  addToHistory(action, key, oldValue, newValue) {
    this.history.push({
      action,
      key,
      oldValue,
      newValue,
      timestamp: Date.now()
    });

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // 获取历史记录
  getHistory(key = null) {
    if (key) {
      return this.history.filter(record => record.key === key);
    }
    return [...this.history];
  }

  // 深度比较
  deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }

  // 设置应用生命周期监听
  setupLifecycleListeners() {
    // 应用进入后台时保存状态
    wx.onAppHide && wx.onAppHide(() => {
      this.saveAllPersistentStates();
    });

    // 应用从后台进入前台时恢复状态
    wx.onAppShow && wx.onAppShow(() => {
      this.restoreFromStorage();
    });
  }

  // 保存所有需要持久化的状态
  saveAllPersistentStates() {
    this.persistKeys.forEach(key => {
      if (this.state.hasOwnProperty(key)) {
        this.persistToStorage(key, this.state[key]);
      }
    });
    console.log('持久化状态已保存');
  }

  // 获取状态统计信息
  getStats() {
    return {
      stateCount: Object.keys(this.state).length,
      listenerCount: Array.from(this.listeners.values())
        .reduce((total, set) => total + set.size, 0),
      persistentKeys: this.persistKeys.size,
      historySize: this.history.length,
      middlewareCount: this.middleware.length
    };
  }

  // 调试信息
  debug() {
    console.log('状态管理器调试信息:');
    console.log('当前状态:', this.state);
    console.log('监听器:', this.listeners);
    console.log('持久化键:', this.persistKeys);
    console.log('历史记录:', this.history);
    console.log('统计信息:', this.getStats());
  }
}

// 创建全局状态管理器实例
const stateManager = new GlobalStateManager();

// 添加一些有用的中间件
stateManager.use((action, payload, state) => {
  // 日志中间件
  console.log(`状态变化 [${action}]:`, payload.key, payload.oldValue, '=>', payload.newValue);
});

stateManager.use((action, payload, state) => {
  // 性能监控中间件
  if (action === 'setState') {
    const size = JSON.stringify(payload.newValue || '').length;
    if (size > 10000) { // 大于10KB
      console.warn(`状态 ${payload.key} 数据量较大:`, size, 'bytes');
    }
  }
});

// 初始化
stateManager.init();

module.exports = stateManager; 