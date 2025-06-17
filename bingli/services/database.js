// services/database.js - 数据库服务模块
const util = require('../utils/util');

class DatabaseService {
  constructor() {
    // 数据库集合名称
    this.collections = {
      records: 'medical_records',      // 病历记录
      families: 'family_members',      // 家庭成员
      reminders: 'health_reminders',   // 健康提醒
      users: 'users',                  // 用户信息
      prescriptions: 'prescriptions'   // 处方信息
    };
  }

  // 调用云函数
  async callFunction(action, collection, params = {}) {
    try {
      console.log('调用云函数:', { action, collection, params });
      
      const result = await wx.cloud.callFunction({
        name: 'database',
        data: {
          action,
          collection,
          ...params
        }
      });
      
      console.log('云函数返回:', result.result);
      
      if (result.result && result.result.success !== false) {
        return result.result;
      } else {
        const error = result.result?.error || '未知错误';
        console.error('云函数业务错误:', error);
        throw new Error(error);
      }
    } catch (error) {
      console.error('数据库操作失败:', error);
      
      // 网络错误提示
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
      }
      
      throw error;
    }
  }

  // 病历相关操作
  async createRecord(recordData) {
    const data = {
      ...recordData,
      userId: await this.getCurrentUserId()
    };
    return await this.callFunction('add', this.collections.records, { data });
  }

  async getRecord(recordId) {
    return await this.callFunction('get', this.collections.records, { docId: recordId });
  }

  async updateRecord(recordId, recordData) {
    return await this.callFunction('update', this.collections.records, { 
      docId: recordId, 
      data: recordData 
    });
  }

  async deleteRecord(recordId) {
    return await this.callFunction('delete', this.collections.records, { docId: recordId });
  }

  async getRecords(options = {}) {
    const {
      memberId = null,
      keyword = '',
      startDate = null,
      endDate = null,
      limit = 20,
      skip = 0
    } = options;

    const where = {
      userId: await this.getCurrentUserId()
    };

    // 按家庭成员筛选
    if (memberId) {
      where.memberId = memberId;
    }

    // 关键词搜索
    if (keyword) {
      where.title = { 
        operator: 'regex', 
        value: keyword 
      };
    }

    // 日期范围筛选
    if (startDate) {
      where.date = {
        operator: '>=',
        value: startDate
      };
    }
    if (endDate) {
      where.date = {
        ...where.date,
        operator: '<=',
        value: endDate
      };
    }

    return await this.callFunction('list', this.collections.records, {
      where,
      limit,
      skip,
      orderBy: { field: 'date', direction: 'desc' }
    });
  }

  // 家庭成员相关操作
  async createFamilyMember(memberData) {
    const data = {
      ...memberData,
      userId: await this.getCurrentUserId()
    };
    return await this.callFunction('add', this.collections.families, { data });
  }

  async getFamilyMembers() {
    const where = {
      userId: await this.getCurrentUserId()
    };
    return await this.callFunction('list', this.collections.families, { where });
  }

  async updateFamilyMember(memberId, memberData) {
    return await this.callFunction('update', this.collections.families, {
      docId: memberId,
      data: memberData
    });
  }

  async deleteFamilyMember(memberId) {
    return await this.callFunction('delete', this.collections.families, { docId: memberId });
  }

  // 健康提醒相关操作
  async createReminder(reminderData) {
    const data = {
      ...reminderData,
      userId: await this.getCurrentUserId()
    };
    return await this.callFunction('add', this.collections.reminders, { data });
  }

  async getReminders(options = {}) {
    const {
      status = null,
      date = null,
      limit = 20,
      skip = 0
    } = options;

    const where = {
      userId: await this.getCurrentUserId()
    };

    if (status !== null) {
      where.completed = status === 'completed';
    }

    if (date) {
      where.reminderDate = date;
    }

    return await this.callFunction('list', this.collections.reminders, {
      where,
      limit,
      skip,
      orderBy: { field: 'reminderTime', direction: 'asc' }
    });
  }

  async updateReminder(reminderId, reminderData) {
    return await this.callFunction('update', this.collections.reminders, {
      docId: reminderId,
      data: reminderData
    });
  }

  async deleteReminder(reminderId) {
    return await this.callFunction('delete', this.collections.reminders, { docId: reminderId });
  }

  async completeReminder(reminderId) {
    return await this.updateReminder(reminderId, {
      completed: true,
      completedTime: new Date().toISOString()
    });
  }

  // 用户相关操作
  async createUser(userData) {
    return await this.callFunction('add', this.collections.users, { data: userData });
  }

  async getUser(userId) {
    return await this.callFunction('get', this.collections.users, { docId: userId });
  }

  async updateUser(userId, userData) {
    return await this.callFunction('update', this.collections.users, {
      docId: userId,
      data: userData
    });
  }

  // 统计数据
  async getStatistics() {
    const userId = await this.getCurrentUserId();
    
    const [recordsResult, remindersResult, familyResult] = await Promise.all([
      this.callFunction('count', this.collections.records, {
        where: { userId }
      }),
      this.callFunction('count', this.collections.reminders, {
        where: { userId, completed: false }
      }),
      this.callFunction('count', this.collections.families, {
        where: { userId }
      })
    ]);

    return {
      totalRecords: recordsResult.count,
      pendingReminders: remindersResult.count,
      familyMembers: familyResult.count
    };
  }

  // 获取当前用户ID
  async getCurrentUserId() {
    try {
      const userInfo = util.getStorage('userInfo');
      if (userInfo && userInfo.openid) {
        return userInfo.openid;
      }
      
      // 如果没有openid，调用云函数获取
      const result = await wx.cloud.callFunction({
        name: 'login'
      });
      
      const openid = result.result.openid;
      util.setStorage('userInfo', { openid });
      return openid;
    } catch (error) {
      console.error('获取用户ID失败:', error);
      throw new Error('用户身份验证失败');
    }
  }

  // 数据同步
  async syncData() {
    try {
      util.showLoading('同步数据中...');
      
      // 获取本地数据时间戳
      const lastSyncTime = util.getStorage('lastSyncTime') || '1970-01-01T00:00:00.000Z';
      
      // 同步各类数据
      const [records, reminders, families] = await Promise.all([
        this.getRecords({ limit: 100 }),
        this.getReminders({ limit: 100 }),
        this.getFamilyMembers()
      ]);
      
      // 更新本地缓存
      util.setStorage('cachedRecords', records.data);
      util.setStorage('cachedReminders', reminders.data);
      util.setStorage('cachedFamilies', families.data);
      util.setStorage('lastSyncTime', new Date().toISOString());
      
      util.hideLoading();
      return { success: true };
    } catch (error) {
      util.hideLoading();
      console.error('数据同步失败:', error);
      throw error;
    }
  }

  // 离线数据操作
  getCachedRecords() {
    return util.getStorage('cachedRecords') || [];
  }

  getCachedReminders() {
    return util.getStorage('cachedReminders') || [];
  }

  getCachedFamilies() {
    return util.getStorage('cachedFamilies') || [];
  }
}

// 导出单例
const databaseService = new DatabaseService();
module.exports = databaseService; 