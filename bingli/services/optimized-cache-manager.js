// services/optimized-cache-manager.js - 优化的缓存管理系统
class OptimizedCacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2分钟缓存时间
    this.pendingRequests = new Map(); // 防止重复请求
    this.subscribers = new Map(); // 数据变化订阅者
    this.syncQueue = []; // 同步队列
    this.isSyncing = false;
  }

  // 智能缓存策略
  async get(key, fetcher, options = {}) {
    const { 
      forceRefresh = false, 
      priority = 0,
      timeout = this.cacheTimeout 
    } = options;

    // 强制刷新或缓存过期
    if (forceRefresh || this.isCacheExpired(key, timeout)) {
      return await this.fetchAndCache(key, fetcher, priority);
    }

    // 返回缓存数据
    const cached = this.cache.get(key);
    if (cached) {
      console.log('使用缓存数据:', key);
      return cached.data;
    }

    // 首次获取
    return await this.fetchAndCache(key, fetcher, priority);
  }

  // 防重复请求的数据获取
  async fetchAndCache(key, fetcher, priority = 0) {
    // 如果已有相同请求在进行中
    if (this.pendingRequests.has(key)) {
      console.log('等待进行中的请求:', key);
      return await this.pendingRequests.get(key);
    }

    const promise = this.executeWithRetry(fetcher, 3); // 3次重试
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      
      // 缓存数据
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        priority
      });

      // 通知订阅者
      this.notifySubscribers(key, data);

      console.log('数据已缓存:', key);
      return data;
    } catch (error) {
      console.error('获取数据失败:', key, error);
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // 带重试的执行
  async executeWithRetry(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`第${i + 1}次尝试失败:`, error.message);
        
        if (i === maxRetries - 1) {
          throw error; // 最后一次失败，抛出错误
        }
        
        // 指数退避延迟
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  // 检查缓存是否过期
  isCacheExpired(key, timeout = this.cacheTimeout) {
    const cached = this.cache.get(key);
    if (!cached) return true;
    
    return Date.now() - cached.timestamp > timeout;
  }

  // 智能缓存清除
  invalidate(patterns) {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    
    patternsArray.forEach(pattern => {
      if (typeof pattern === 'string') {
        // 精确匹配
        this.cache.delete(pattern);
        console.log('清除缓存:', pattern);
      } else if (pattern instanceof RegExp) {
        // 正则匹配
        for (const [key] of this.cache) {
          if (pattern.test(key)) {
            this.cache.delete(key);
            console.log('清除缓存(正则):', key);
          }
        }
      }
    });
  }

  // 智能缓存清除 - 根据操作类型
  invalidateByOperation(operation, collection, recordId = null) {
    const patterns = this.getInvalidationPatterns(operation, collection, recordId);
    this.invalidate(patterns);
  }

  // 获取需要清除的缓存模式
  getInvalidationPatterns(operation, collection, recordId = null) {
    const patterns = [];
    
    switch (operation) {
      case 'add':
      case 'create':
        patterns.push(
          new RegExp(`^${collection}_list`),
          new RegExp(`^${collection}_count`),
          `statistics`,
          `recent_${collection}`
        );
        break;
        
      case 'update':
        if (recordId) {
          patterns.push(`${collection}_${recordId}`);
        }
        patterns.push(
          new RegExp(`^${collection}_list`),
          `statistics`
        );
        break;
        
      case 'delete':
        if (recordId) {
          patterns.push(`${collection}_${recordId}`);
        }
        patterns.push(
          new RegExp(`^${collection}_list`),
          new RegExp(`^${collection}_count`),
          `statistics`
        );
        break;
    }
    
    return patterns;
  }

  // 订阅数据变化
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // 通知订阅者
  notifySubscribers(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('订阅者回调失败:', error);
        }
      });
    }
  }

  // 批量预加载
  async preload(items, options = {}) {
    const { concurrency = 3 } = options;
    const chunks = this.chunk(items, concurrency);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(item => {
        return this.get(item.key, item.fetcher, { priority: -1 });
      }));
    }
  }

  // 数组分块
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // 同步队列管理
  addToSyncQueue(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now(),
      id: this.generateId()
    });

    if (!this.isSyncing) {
      this.processSyncQueue();
    }
  }

  // 处理同步队列
  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log('开始处理同步队列, 队列长度:', this.syncQueue.length);

    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue.shift();
      
      try {
        await this.executeSyncOperation(operation);
        console.log('同步操作完成:', operation.id);
      } catch (error) {
        console.error('同步操作失败:', operation.id, error);
        
        // 重要操作重新加入队列
        if (operation.priority > 0 && operation.retryCount < 3) {
          operation.retryCount = (operation.retryCount || 0) + 1;
          this.syncQueue.unshift(operation);
        }
      }
    }

    this.isSyncing = false;
    console.log('同步队列处理完成');
  }

  // 执行同步操作
  async executeSyncOperation(operation) {
    const { type, collection, data, options } = operation;
    
    // 根据操作类型执行相应的云函数
    const result = await wx.cloud.callFunction({
      name: 'database',
      data: {
        action: type,
        collection,
        data,
        ...options
      }
    });

    // 清除相关缓存
    this.invalidateByOperation(type, collection, data?.id);

    return result;
  }

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 获取缓存统计信息
  getStats() {
    const total = this.cache.size;
    const expired = Array.from(this.cache.entries()).filter(
      ([key, value]) => this.isCacheExpired(key)
    ).length;

    return {
      total,
      active: total - expired,
      expired,
      pendingRequests: this.pendingRequests.size,
      subscribers: this.subscribers.size,
      queueLength: this.syncQueue.length
    };
  }

  // 清理过期缓存
  cleanup() {
    const before = this.cache.size;
    
    for (const [key] of this.cache) {
      if (this.isCacheExpired(key)) {
        this.cache.delete(key);
      }
    }

    const cleaned = before - this.cache.size;
    if (cleaned > 0) {
      console.log(`清理了${cleaned}个过期缓存`);
    }
    
    return cleaned;
  }

  // 启动定期清理
  startAutoCleanup(interval = 5 * 60 * 1000) { // 5分钟
    return setInterval(() => {
      this.cleanup();
    }, interval);
  }

  // 清除所有缓存
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
    this.syncQueue.length = 0;
    console.log('所有缓存已清除');
  }
}

// 导出单例
const cacheManager = new OptimizedCacheManager();

// 启动自动清理
cacheManager.startAutoCleanup();

module.exports = cacheManager; 