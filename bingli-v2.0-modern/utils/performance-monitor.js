// utils/performance-monitor.js - 全面的性能监控系统
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
    this.operations = [];
    this.maxOperations = 1000; // 最大操作记录数
    this.alertThresholds = {
      pageLoad: 2000,      // 页面加载超过2秒
      dataSync: 1000,      // 数据同步超过1秒
      setData: 100,        // setData超过100ms
      cloudFunction: 3000   // 云函数超过3秒
    };
    this.isRecording = true;
  }

  // 开始监控操作
  start(operationId, category = 'general', metadata = {}) {
    if (!this.isRecording) return;

    const startTime = Date.now();
    this.startTimes.set(operationId, {
      startTime,
      category,
      metadata
    });

    console.log(`🚀 开始监控: ${operationId} [${category}]`);
  }

  // 结束监控操作
  end(operationId, additionalMetadata = {}) {
    if (!this.isRecording) return;

    const startInfo = this.startTimes.get(operationId);
    if (!startInfo) {
      console.warn(`⚠️  未找到操作开始时间: ${operationId}`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - startInfo.startTime;
    const { category, metadata } = startInfo;

    // 记录操作详情
    const operation = {
      id: operationId,
      category,
      duration,
      startTime: startInfo.startTime,
      endTime,
      metadata: { ...metadata, ...additionalMetadata },
      timestamp: new Date().toISOString()
    };

    this.operations.push(operation);
    
    // 限制操作记录数量
    if (this.operations.length > this.maxOperations) {
      this.operations.shift();
    }

    // 更新指标统计
    this.updateMetrics(category, duration);

    // 性能预警
    this.checkAlert(operationId, category, duration);

    // 清理开始时间记录
    this.startTimes.delete(operationId);

    console.log(`✅ 完成监控: ${operationId} 耗时 ${duration}ms`);
    return duration;
  }

  // 更新指标统计
  updateMetrics(category, duration) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity,
        p95Time: 0,
        recentTimes: []
      });
    }

    const metric = this.metrics.get(category);
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.minTime = Math.min(metric.minTime, duration);

    // 记录最近的时间用于计算P95
    metric.recentTimes.push(duration);
    if (metric.recentTimes.length > 100) {
      metric.recentTimes.shift();
    }

    // 计算P95
    const sorted = [...metric.recentTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    metric.p95Time = sorted[p95Index] || 0;
  }

  // 检查性能预警
  checkAlert(operationId, category, duration) {
    const threshold = this.alertThresholds[category] || 1000;
    
    if (duration > threshold) {
      const alert = {
        type: 'performance',
        level: duration > threshold * 2 ? 'critical' : 'warning',
        operationId,
        category,
        duration,
        threshold,
        timestamp: Date.now()
      };

      console.warn(`⚠️  性能预警 [${alert.level}]: ${operationId} 耗时 ${duration}ms (阈值: ${threshold}ms)`);
      
      // 可以在这里添加上报逻辑
      this.reportAlert(alert);
    }
  }

  // 上报预警（可集成到监控系统）
  reportAlert(alert) {
    try {
      // 可以集成到微信小程序数据统计或第三方监控服务
      wx.reportAnalytics && wx.reportAnalytics('performance_alert', {
        operation: alert.operationId,
        category: alert.category,
        duration: alert.duration,
        level: alert.level
      });
    } catch (error) {
      console.error('上报预警失败:', error);
    }
  }

  // 记录用户操作路径
  recordUserAction(action, page, details = {}) {
    const userAction = {
      type: 'user_action',
      action,
      page,
      details,
      timestamp: Date.now()
    };

    this.operations.push(userAction);
    console.log(`👆 用户操作: ${action} 在 ${page}`);
  }

  // 记录错误信息
  recordError(error, context = {}) {
    const errorRecord = {
      type: 'error',
      message: error.message || error,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };

    this.operations.push(errorRecord);
    console.error(`❌ 错误记录:`, errorRecord);
  }

  // 获取性能报告
  getPerformanceReport(category = null) {
    const report = {
      generated: new Date().toISOString(),
      summary: {},
      operations: this.operations.slice(-100), // 最近100个操作
      alerts: this.getRecentAlerts()
    };

    if (category) {
      // 特定分类的报告
      const metric = this.metrics.get(category);
      if (metric) {
        report.summary[category] = { ...metric };
      }
    } else {
      // 全量报告
      this.metrics.forEach((metric, cat) => {
        report.summary[cat] = { ...metric };
      });
    }

    return report;
  }

  // 获取最近的预警
  getRecentAlerts(limit = 20) {
    return this.operations
      .filter(op => op.type === 'performance' && op.level)
      .slice(-limit);
  }

  // 获取页面性能统计
  getPageStats(page) {
    const pageOps = this.operations.filter(op => 
      op.metadata && op.metadata.page === page
    );

    if (pageOps.length === 0) {
      return null;
    }

    const durations = pageOps.map(op => op.duration).filter(d => d);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
      page,
      operationCount: pageOps.length,
      avgDuration: Math.round(avgDuration),
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      recentOperations: pageOps.slice(-10)
    };
  }

  // 内存使用监控
  recordMemoryUsage(label = 'general') {
    try {
      // 微信小程序内存使用情况
      const memoryInfo = wx.getPerformance && wx.getPerformance().memory;
      
      if (memoryInfo) {
        const memoryRecord = {
          type: 'memory',
          label,
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          usagePercent: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize * 100).toFixed(2),
          timestamp: Date.now()
        };

        this.operations.push(memoryRecord);
        
        // 内存使用过高预警
        if (memoryRecord.usagePercent > 80) {
          console.warn(`🚨 内存使用过高: ${memoryRecord.usagePercent}%`);
        }

        return memoryRecord;
      }
    } catch (error) {
      console.error('记录内存使用失败:', error);
    }
    return null;
  }

  // 网络性能监控
  recordNetworkTiming(url, timing) {
    const networkRecord = {
      type: 'network',
      url,
      timing: {
        requestStart: timing.requestStart || 0,
        responseStart: timing.responseStart || 0,
        responseEnd: timing.responseEnd || 0,
        duration: (timing.responseEnd || 0) - (timing.requestStart || 0)
      },
      timestamp: Date.now()
    };

    this.operations.push(networkRecord);
    console.log(`🌐 网络请求: ${url} 耗时 ${networkRecord.timing.duration}ms`);
  }

  // 导出性能数据
  exportData(format = 'json') {
    const data = {
      metrics: Object.fromEntries(this.metrics),
      operations: this.operations,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(this.operations);
    }

    return data;
  }

  // 转换为CSV格式
  convertToCSV(operations) {
    if (operations.length === 0) return '';

    const headers = ['timestamp', 'type', 'id', 'category', 'duration', 'metadata'];
    const csvRows = [headers.join(',')];

    operations.forEach(op => {
      const row = [
        new Date(op.timestamp).toISOString(),
        op.type || 'operation',
        op.id || '',
        op.category || '',
        op.duration || '',
        JSON.stringify(op.metadata || {}).replace(/"/g, '""')
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // 清理旧数据
  cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    this.operations = this.operations.filter(op => 
      op.timestamp > oneHourAgo
    );

    console.log('🧹 性能监控数据已清理');
  }

  // 获取实时性能状态
  getRealTimeStatus() {
    const now = Date.now();
    const recentOps = this.operations.filter(op => 
      now - op.timestamp < 60000 // 最近1分钟
    );

    const errors = recentOps.filter(op => op.type === 'error');
    const slowOps = recentOps.filter(op => 
      op.duration && op.duration > 1000
    );

    return {
      status: errors.length > 0 ? 'error' : 
              slowOps.length > 5 ? 'warning' : 'healthy',
      recentErrors: errors.length,
      slowOperations: slowOps.length,
      totalOperations: recentOps.length,
      lastUpdate: new Date().toISOString()
    };
  }

  // 开始/停止记录
  startRecording() {
    this.isRecording = true;
    console.log('📊 性能监控已启动');
  }

  stopRecording() {
    this.isRecording = false;
    console.log('⏹️  性能监控已停止');
  }

  // 重置所有数据
  reset() {
    this.metrics.clear();
    this.startTimes.clear();
    this.operations = [];
    console.log('🔄 性能监控数据已重置');
  }

  // 设置预警阈值
  setAlertThreshold(category, threshold) {
    this.alertThresholds[category] = threshold;
    console.log(`⚙️  设置 ${category} 预警阈值为 ${threshold}ms`);
  }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

// 自动定期清理
setInterval(() => {
  performanceMonitor.cleanup();
}, 30 * 60 * 1000); // 每30分钟清理一次

// 监控页面切换性能
const originalPage = Page;
Page = function(options) {
  const originalOnLoad = options.onLoad;
  const originalOnShow = options.onShow;
  const originalOnHide = options.onHide;

  options.onLoad = function(opts) {
    const pageName = this.route || 'unknown';
    performanceMonitor.start(`page_load_${pageName}`, 'pageLoad', { page: pageName });
    
    if (originalOnLoad) {
      originalOnLoad.call(this, opts);
    }
    
    performanceMonitor.end(`page_load_${pageName}`, { loaded: true });
  };

  options.onShow = function() {
    const pageName = this.route || 'unknown';
    performanceMonitor.recordUserAction('page_show', pageName);
    
    if (originalOnShow) {
      originalOnShow.call(this);
    }
  };

  options.onHide = function() {
    const pageName = this.route || 'unknown';
    performanceMonitor.recordUserAction('page_hide', pageName);
    
    if (originalOnHide) {
      originalOnHide.call(this);
    }
  };

  return originalPage(options);
};

module.exports = performanceMonitor; 