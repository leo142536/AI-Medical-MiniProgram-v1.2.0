// services/cloudDatabase.js - 微信云开发数据库服务
class CloudDatabaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.collections = {
      reminders: 'health_reminders',   // 健康提醒
      settings: 'user_settings',       // 用户设置
      files: 'file_records'           // 文件记录
    };
  }

  // 通用云函数调用
  async callFunction(action, params = {}) {
    try {
      console.log('调用云函数:', { action, ...params });
      
      const result = await wx.cloud.callFunction({
        name: 'database',
        data: { action, ...params }
      });
      
      console.log('云函数返回:', result.result);
      
      if (result.result && result.result.success !== false) {
        return result.result;
      } else {
        const error = result.result?.error || '操作失败';
        throw new Error(error);
      }
    } catch (error) {
      console.error('云函数调用失败:', error);
      this.handleError(error);
      throw error;
    }
  }

  // 错误处理
  handleError(error) {
    if (error.errCode === -1 || error.message.includes('网络')) {
      wx.showToast({
        title: '网络连接失败',
        icon: 'error'
      });
    } else if (error.errCode === 'PERMISSION_DENIED') {
      wx.showToast({
        title: '没有访问权限',
        icon: 'error'
      });
    } else if (error.message.includes('云函数')) {
      wx.showToast({
        title: '服务暂时不可用',
        icon: 'error'
      });
    }
  }

  // ==================== 健康提醒相关 ====================
  
  // 获取健康提醒列表
  async getReminders(type = null, status = null) {
    const cacheKey = `reminders_${type || 'all'}_${status || 'all'}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('使用缓存数据:', cacheKey);
        return cached.data;
      }
    }

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const result = await this.callFunction('list', {
      collection: this.collections.reminders,
      where,
      orderBy: { field: 'time', direction: 'asc' }
    });

    // 更新缓存
    this.cache.set(cacheKey, {
      data: result.data || [],
      timestamp: Date.now()
    });

    return result.data || [];
  }

  // 添加健康提醒
  async addReminder(reminderData) {
    const data = {
      ...reminderData,
      status: 'active',
      createTime: new Date().toISOString()
    };

    const result = await this.callFunction('add', {
      collection: this.collections.reminders,
      data
    });
    
    // 清除相关缓存
    this.clearReminderCache();
    
    return result;
  }

  // 更新健康提醒
  async updateReminder(id, updateData) {
    const result = await this.callFunction('update', {
      collection: this.collections.reminders,
      docId: id,
      data: {
        ...updateData,
        updateTime: new Date().toISOString()
      }
    });
    
    this.clearReminderCache();
    return result;
  }

  // 完成提醒
  async completeReminder(id) {
    return await this.updateReminder(id, {
      status: 'completed',
      completedTime: new Date().toISOString()
    });
  }

  // 删除提醒
  async deleteReminder(id) {
    const result = await this.callFunction('delete', {
      collection: this.collections.reminders,
      docId: id
    });
    
    this.clearReminderCache();
    return result;
  }

  // 获取今日提醒
  async getTodayReminders() {
    const today = new Date().toISOString().split('T')[0];
    return await this.getReminders(null, 'active').then(reminders => {
      return reminders.filter(reminder => {
        const reminderDate = reminder.time.split('T')[0];
        return reminderDate === today;
      });
    });
  }

  // ==================== 用户设置相关 ====================
  
  // 获取用户设置
  async getUserSettings() {
    const cacheKey = 'user_settings';
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = await this.callFunction('list', {
      collection: this.collections.settings,
      limit: 1
    });

    const settings = result.data && result.data.length > 0 ? result.data[0] : null;
    
    // 如果没有设置，返回默认设置
    const defaultSettings = {
      appLock: false,
      biometric: false,
      notification: true,
      reminderSound: true,
      vibration: true,
      darkMode: false,
      animation: true,
      autoBackup: true,
      dataSharing: false
    };

    const finalSettings = settings || defaultSettings;

    // 更新缓存
    this.cache.set(cacheKey, {
      data: finalSettings,
      timestamp: Date.now()
    });

    return finalSettings;
  }

  // 更新用户设置
  async updateUserSettings(settings) {
    const existingSettings = await this.getUserSettings();
    
    if (existingSettings && existingSettings._id) {
      // 更新现有设置
      await this.callFunction('update', {
        collection: this.collections.settings,
        docId: existingSettings._id,
        data: settings
      });
    } else {
      // 创建新设置
      await this.callFunction('add', {
        collection: this.collections.settings,
        data: settings
      });
    }
    
    // 清除缓存
    this.cache.delete('user_settings');
    
    return true;
  }

  // ==================== 文件管理相关 ====================
  
  // 上传文件到云存储
  async uploadFile(filePath, fileName, relatedType = 'general', relatedId = null) {
    try {
      wx.showLoading({ title: '上传中...' });
      
      // 生成云存储路径
      const cloudPath = `${relatedType}/${Date.now()}_${fileName}`;
      
      // 上传文件到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      });

      // 记录文件信息到数据库
      const fileRecord = await this.callFunction('add', {
        collection: this.collections.files,
        data: {
          fileId: uploadResult.fileID,
          fileName,
          fileType: this.getFileType(fileName),
          cloudPath,
          relatedType,
          relatedId,
          uploadTime: new Date().toISOString()
        }
      });

      wx.hideLoading();
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });

      return {
        fileId: uploadResult.fileID,
        recordId: fileRecord.id,
        cloudPath
      };
    } catch (error) {
      wx.hideLoading();
      console.error('文件上传失败:', error);
      wx.showToast({
        title: '上传失败',
        icon: 'error'
      });
      throw error;
    }
  }

  // 获取文件列表
  async getFiles(relatedType = null, relatedId = null) {
    const where = {};
    if (relatedType) where.relatedType = relatedType;
    if (relatedId) where.relatedId = relatedId;

    const result = await this.callFunction('list', {
      collection: this.collections.files,
      where,
      orderBy: { field: 'uploadTime', direction: 'desc' }
    });

    return result.data || [];
  }

  // 删除文件
  async deleteFile(recordId, fileId) {
    try {
      // 删除云存储文件
      await wx.cloud.deleteFile({
        fileList: [fileId]
      });

      // 删除数据库记录
      await this.callFunction('delete', {
        collection: this.collections.files,
        docId: recordId
      });

      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  // 获取文件类型
  getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const typeMap = {
      'jpg': 'image',
      'jpeg': 'image', 
      'png': 'image',
      'gif': 'image',
      'pdf': 'document',
      'doc': 'document',
      'docx': 'document',
      'txt': 'document'
    };
    return typeMap[ext] || 'other';
  }

  // ==================== 缓存管理 ====================
  
  // 清除提醒相关缓存
  clearReminderCache() {
    for (const key of this.cache.keys()) {
      if (key.startsWith('reminders_')) {
        this.cache.delete(key);
      }
    }
  }

  // 清除所有缓存
  clearAllCache() {
    this.cache.clear();
    console.log('所有缓存已清除');
  }

  // ==================== 数据统计 ====================
  
  // 获取数据统计
  async getStatistics() {
    try {
      const [remindersCount, filesCount] = await Promise.all([
        this.callFunction('count', {
          collection: this.collections.reminders
        }),
        this.callFunction('count', {
          collection: this.collections.files
        })
      ]);

      return {
        totalReminders: remindersCount.total || 0,
        totalFiles: filesCount.total || 0,
        cacheSize: this.cache.size
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalReminders: 0,
        totalFiles: 0,
        cacheSize: 0
      };
    }
  }
}

// 导出单例
const cloudDB = new CloudDatabaseService();
export default cloudDB; 