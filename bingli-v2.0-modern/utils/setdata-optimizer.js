// utils/setdata-optimizer.js - setData性能优化器
class SetDataOptimizer {
  constructor(page) {
    this.page = page;
    this.pendingData = {};
    this.timer = null;
    this.batchSize = 0;
    this.maxBatchSize = 10; // 最大批量大小
    this.throttleTime = 16; // 节流时间 (一帧)
    this.forceUpdateTime = 100; // 强制更新时间
    this.lastUpdate = 0;
    this.updateCount = 0;
    this.stats = {
      batchCount: 0,
      totalUpdates: 0,
      savedCalls: 0
    };
  }

  // 批量设置数据
  batchSetData(data, options = {}) {
    const { 
      immediate = false, 
      priority = 0,
      merge = true 
    } = options;

    // 立即更新（紧急情况）
    if (immediate) {
      this.immediateSetData(data);
      return;
    }

    // 合并数据
    if (merge) {
      Object.assign(this.pendingData, data);
    } else {
      this.pendingData = { ...this.pendingData, ...data };
    }

    this.batchSize += Object.keys(data).length;
    this.updateCount++;

    // 检查是否需要立即更新
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdate;
    
    if (
      this.batchSize >= this.maxBatchSize || 
      timeSinceLastUpdate >= this.forceUpdateTime ||
      priority > 5
    ) {
      this.flushUpdates();
      return;
    }

    // 防抖处理
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flushUpdates();
    }, this.throttleTime);
  }

  // 立即设置数据
  immediateSetData(data) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // 合并待处理的数据
    const finalData = { ...this.pendingData, ...data };
    
    // 清空待处理数据
    this.pendingData = {};
    this.batchSize = 0;

    // 执行setData
    this.executeSetData(finalData);
  }

  // 刷新更新
  flushUpdates() {
    if (Object.keys(this.pendingData).length === 0) {
      return;
    }

    const dataToUpdate = { ...this.pendingData };
    
    // 清空待处理数据
    this.pendingData = {};
    this.batchSize = 0;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // 执行setData
    this.executeSetData(dataToUpdate);
  }

  // 执行setData
  executeSetData(data) {
    const startTime = Date.now();
    
    try {
      // 优化数据结构
      const optimizedData = this.optimizeData(data);
      
      // 执行实际的setData
      this.page.setData(optimizedData, () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 更新统计信息
        this.updateStats(optimizedData, duration);
        
        // 性能监控
        if (duration > 50) {
          console.warn('setData耗时较长:', duration + 'ms', '数据量:', this.getDataSize(optimizedData));
        }
      });

      this.lastUpdate = Date.now();
      
    } catch (error) {
      console.error('setData执行失败:', error);
    }
  }

  // 优化数据结构
  optimizeData(data) {
    const optimized = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // 跳过undefined值
      if (value === undefined) {
        return;
      }

      // 深度比较，避免不必要的更新
      const currentValue = this.getValueByPath(this.page.data, key);
      if (this.deepEqual(currentValue, value)) {
        return;
      }

      // 压缩大型数组
      if (Array.isArray(value) && value.length > 100) {
        optimized[key] = this.compressArray(value);
      } 
      // 压缩大型对象
      else if (typeof value === 'object' && value !== null) {
        const size = JSON.stringify(value).length;
        if (size > 10000) { // 大于10KB
          optimized[key] = this.compressObject(value);
        } else {
          optimized[key] = value;
        }
      } else {
        optimized[key] = value;
      }
    });

    return optimized;
  }

  // 压缩数组（分页处理）
  compressArray(array) {
    console.log('压缩大型数组:', array.length, '项');
    // 只更新前100项，其余延迟加载
    return array.slice(0, 100);
  }

  // 压缩对象
  compressObject(obj) {
    console.log('压缩大型对象');
    // 移除一些非必要的属性
    const compressed = {};
    Object.entries(obj).forEach(([key, value]) => {
      // 跳过大型字符串或复杂对象
      if (typeof value === 'string' && value.length > 1000) {
        compressed[key] = value.substring(0, 1000) + '...';
      } else if (typeof value === 'object' && value !== null) {
        compressed[key] = JSON.stringify(value).length > 5000 ? '[Large Object]' : value;
      } else {
        compressed[key] = value;
      }
    });
    return compressed;
  }

  // 根据路径获取值
  getValueByPath(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  // 深度比较
  deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
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

  // 获取数据大小
  getDataSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  // 更新统计信息
  updateStats(data, duration) {
    this.stats.batchCount++;
    this.stats.totalUpdates++;
    this.stats.savedCalls += this.updateCount - 1; // 减去实际执行的1次
    
    this.updateCount = 0; // 重置计数器
  }

  // 设置数组项
  setArrayItem(arrayPath, index, item, options = {}) {
    const path = `${arrayPath}[${index}]`;
    this.batchSetData({ [path]: item }, options);
  }

  // 批量设置数组项
  setArrayItems(arrayPath, items, options = {}) {
    const updates = {};
    items.forEach((item, index) => {
      updates[`${arrayPath}[${index}]`] = item;
    });
    this.batchSetData(updates, options);
  }

  // 追加数组项
  appendArrayItem(arrayPath, item, options = {}) {
    const currentArray = this.getValueByPath(this.page.data, arrayPath) || [];
    const newIndex = currentArray.length;
    this.setArrayItem(arrayPath, newIndex, item, options);
  }

  // 批量追加数组项
  appendArrayItems(arrayPath, items, options = {}) {
    const currentArray = this.getValueByPath(this.page.data, arrayPath) || [];
    const updates = {};
    items.forEach((item, index) => {
      updates[`${arrayPath}[${currentArray.length + index}]`] = item;
    });
    this.batchSetData(updates, options);
  }

  // 删除数组项
  removeArrayItem(arrayPath, index, options = {}) {
    const currentArray = this.getValueByPath(this.page.data, arrayPath);
    if (currentArray && index >= 0 && index < currentArray.length) {
      const newArray = [...currentArray];
      newArray.splice(index, 1);
      this.batchSetData({ [arrayPath]: newArray }, options);
    }
  }

  // 更新对象属性
  updateObject(objectPath, updates, options = {}) {
    const currentObject = this.getValueByPath(this.page.data, objectPath) || {};
    const newObject = { ...currentObject, ...updates };
    this.batchSetData({ [objectPath]: newObject }, options);
  }

  // 获取性能统计
  getStats() {
    return {
      ...this.stats,
      efficiency: this.stats.totalUpdates > 0 ? 
        ((this.stats.savedCalls / this.stats.totalUpdates) * 100).toFixed(2) + '%' : '0%'
    };
  }

  // 重置统计
  resetStats() {
    this.stats = {
      batchCount: 0,
      totalUpdates: 0,
      savedCalls: 0
    };
  }

  // 清理资源
  cleanup() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingData = {};
    this.batchSize = 0;
  }

  // 强制更新所有待处理的数据
  forceUpdate() {
    this.flushUpdates();
  }
}

// 为Page增加优化器混入
const mixinSetDataOptimizer = {
  onLoad(options) {
    // 创建优化器实例
    this._setDataOptimizer = new SetDataOptimizer(this);
    
    // 保存原始setData方法
    this._originalSetData = this.setData;
    
    // 重写setData方法
    this.setData = (data, callback) => {
      if (callback) {
        // 如果有回调，直接使用原始方法
        this._originalSetData.call(this, data, callback);
      } else {
        // 使用优化器
        this._setDataOptimizer.batchSetData(data);
      }
    };

    // 添加新的优化方法
    this.batchSetData = (data, options) => {
      this._setDataOptimizer.batchSetData(data, options);
    };

    this.immediateSetData = (data) => {
      this._setDataOptimizer.immediateSetData(data);
    };

    this.setArrayItem = (arrayPath, index, item, options) => {
      this._setDataOptimizer.setArrayItem(arrayPath, index, item, options);
    };

    this.appendArrayItem = (arrayPath, item, options) => {
      this._setDataOptimizer.appendArrayItem(arrayPath, item, options);
    };

    this.updateObject = (objectPath, updates, options) => {
      this._setDataOptimizer.updateObject(objectPath, updates, options);
    };

    this.getSetDataStats = () => {
      return this._setDataOptimizer.getStats();
    };

    // 调用原始onLoad
    if (this._originalOnLoad) {
      this._originalOnLoad.call(this, options);
    }
  },

  onUnload() {
    // 清理资源
    if (this._setDataOptimizer) {
      this._setDataOptimizer.cleanup();
    }
    
    // 调用原始onUnload
    if (this._originalOnUnload) {
      this._originalOnUnload.call(this);
    }
  }
};

// 扩展Page函数
const originalPage = Page;
Page = function(options) {
  // 保存原始生命周期方法
  options._originalOnLoad = options.onLoad;
  options._originalOnUnload = options.onUnload;
  
  // 混入优化器
  Object.assign(options, mixinSetDataOptimizer);
  
  return originalPage(options);
};

module.exports = {
  SetDataOptimizer,
  mixinSetDataOptimizer
}; 