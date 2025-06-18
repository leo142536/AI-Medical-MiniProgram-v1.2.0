# 🚀 云数据库集成指南

## 📋 方案概述

本项目采用**微信云开发 + 腾讯云MySQL**混合架构，确保数据安全性和开发效率的最佳平衡。

## 🎯 架构设计

### 数据分层策略
- **微信云开发**: 实时数据、缓存、文件存储
- **腾讯云MySQL**: 核心业务数据、敏感信息

## 📱 第一阶段：微信云开发配置

### 1. 开通云开发服务

```bash
# 1. 在微信开发者工具中开通云开发
# 2. 创建云开发环境
# 3. 获取环境ID (env-id)
```

### 2. 项目配置

#### app.js 配置
```javascript
// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 替换为您的环境ID
        traceUser: true,
      })
    }
  }
})
```

### 3. 数据库集合设计

#### 健康提醒集合 (health_reminders)
```javascript
{
  _id: "auto-generated",
  _openid: "user-openid",
  title: "服药提醒",
  type: "medication", // medication, appointment, checkup
  time: "2024-12-18 08:00:00",
  frequency: "daily", // daily, weekly, monthly
  medication: {
    name: "阿莫西林",
    dosage: "1片",
    notes: "饭后服用"
  },
  status: "active", // active, completed, cancelled
  createTime: "2024-12-18 10:00:00",
  updateTime: "2024-12-18 10:00:00"
}
```

#### 用户设置集合 (user_settings)
```javascript
{
  _id: "auto-generated",
  _openid: "user-openid",
  appLock: true,
  biometric: false,
  notification: true,
  darkMode: false,
  autoBackup: true,
  createTime: "2024-12-18 10:00:00",
  updateTime: "2024-12-18 10:00:00"
}
```

#### 文件存储集合 (file_records)
```javascript
{
  _id: "auto-generated",
  _openid: "user-openid",
  fileId: "cloud://env-id.xxx",
  fileName: "检查报告.pdf",
  fileType: "pdf",
  fileSize: 1024000,
  relatedType: "medical_record", // medical_record, prescription
  relatedId: "record-id",
  createTime: "2024-12-18 10:00:00"
}
```

### 4. 云函数更新

#### database/index.js 增强版
```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, collection, data, where, limit = 20, skip = 0 } = event

  try {
    switch (action) {
      case 'add':
        return await add(collection, { ...data, _openid: wxContext.OPENID })
      
      case 'list':
        return await list(collection, where, limit, skip, wxContext.OPENID)
      
      case 'update':
        return await update(collection, where, data, wxContext.OPENID)
      
      case 'delete':
        return await remove(collection, where, wxContext.OPENID)
      
      case 'count':
        return await count(collection, where, wxContext.OPENID)
      
      default:
        throw new Error('不支持的操作')
    }
  } catch (error) {
    console.error('数据库操作失败:', error)
    return { success: false, error: error.message }
  }
}

// 添加数据
async function add(collection, data) {
  const result = await db.collection(collection).add({
    data: {
      ...data,
      createTime: new Date(),
      updateTime: new Date()
    }
  })
  return { success: true, id: result._id }
}

// 查询数据
async function list(collection, where = {}, limit, skip, openid) {
  const query = db.collection(collection).where({
    _openid: openid,
    ...where
  })
  
  const result = await query
    .orderBy('createTime', 'desc')
    .limit(limit)
    .skip(skip)
    .get()
  
  return { success: true, data: result.data, total: result.data.length }
}

// 更新数据
async function update(collection, where, data, openid) {
  const result = await db.collection(collection)
    .where({ _openid: openid, ...where })
    .update({
      data: {
        ...data,
        updateTime: new Date()
      }
    })
  
  return { success: true, updated: result.stats.updated }
}

// 删除数据
async function remove(collection, where, openid) {
  const result = await db.collection(collection)
    .where({ _openid: openid, ...where })
    .remove()
  
  return { success: true, removed: result.stats.removed }
}

// 计数
async function count(collection, where = {}, openid) {
  const result = await db.collection(collection)
    .where({ _openid: openid, ...where })
    .count()
  
  return { success: true, total: result.total }
}
```

### 5. 数据库服务层完善

#### services/database.js 云开发版本
```javascript
// 云开发数据库服务
class CloudDatabaseService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  // 通用调用云函数方法
  async callFunction(action, params = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'database',
        data: { action, ...params }
      })
      
      if (result.result.success) {
        return result.result
      } else {
        throw new Error(result.result.error)
      }
    } catch (error) {
      console.error('云函数调用失败:', error)
      throw error
    }
  }

  // 健康提醒相关操作
  async getReminders(type = null) {
    const cacheKey = `reminders_${type || 'all'}`
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    const where = type ? { type } : {}
    const result = await this.callFunction('list', {
      collection: 'health_reminders',
      where
    })

    // 更新缓存
    this.cache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    })

    return result.data
  }

  async addReminder(reminderData) {
    const result = await this.callFunction('add', {
      collection: 'health_reminders',
      data: reminderData
    })
    
    // 清除相关缓存
    this.clearReminderCache()
    return result
  }

  async updateReminder(id, updateData) {
    const result = await this.callFunction('update', {
      collection: 'health_reminders',
      where: { _id: id },
      data: updateData
    })
    
    this.clearReminderCache()
    return result
  }

  async deleteReminder(id) {
    const result = await this.callFunction('delete', {
      collection: 'health_reminders',
      where: { _id: id }
    })
    
    this.clearReminderCache()
    return result
  }

  // 用户设置相关操作
  async getUserSettings() {
    const cacheKey = 'user_settings'
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    const result = await this.callFunction('list', {
      collection: 'user_settings',
      limit: 1
    })

    const settings = result.data.length > 0 ? result.data[0] : null
    
    this.cache.set(cacheKey, {
      data: settings,
      timestamp: Date.now()
    })

    return settings
  }

  async updateUserSettings(settings) {
    const existingSettings = await this.getUserSettings()
    
    if (existingSettings) {
      // 更新现有设置
      await this.callFunction('update', {
        collection: 'user_settings',
        where: { _id: existingSettings._id },
        data: settings
      })
    } else {
      // 创建新设置
      await this.callFunction('add', {
        collection: 'user_settings',
        data: settings
      })
    }
    
    // 清除缓存
    this.cache.delete('user_settings')
  }

  // 文件上传相关
  async uploadFile(filePath, fileName, relatedType, relatedId) {
    try {
      // 上传文件到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: `${relatedType}/${Date.now()}_${fileName}`,
        filePath: filePath,
      })

      // 记录文件信息到数据库
      const fileRecord = await this.callFunction('add', {
        collection: 'file_records',
        data: {
          fileId: uploadResult.fileID,
          fileName,
          relatedType,
          relatedId,
          cloudPath: uploadResult.cloudPath
        }
      })

      return {
        fileId: uploadResult.fileID,
        recordId: fileRecord.id
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      throw error
    }
  }

  // 缓存管理
  clearReminderCache() {
    for (const key of this.cache.keys()) {
      if (key.startsWith('reminders_')) {
        this.cache.delete(key)
      }
    }
  }

  clearAllCache() {
    this.cache.clear()
  }
}

// 导出单例
const cloudDB = new CloudDatabaseService()
export default cloudDB
```

## 🛠️ 快速部署步骤

### 1. 立即可执行的配置
```bash
# 1. 微信开发者工具 -> 云开发 -> 开通
# 2. 创建环境 (推荐选择按量计费)
# 3. 复制环境ID到 app.js
# 4. 上传并部署云函数
# 5. 创建数据库集合
```

### 2. 数据库集合初始化
```javascript
// 在微信开发者工具控制台执行
db.createCollection('health_reminders')
db.createCollection('user_settings') 
db.createCollection('file_records')
```

### 3. 测试数据插入
```javascript
// 插入测试提醒数据
db.collection('health_reminders').add({
  data: {
    title: "测试用药提醒",
    type: "medication",
    time: "2024-12-19 08:00:00",
    frequency: "daily",
    status: "active"
  }
})
```

## 💰 成本预估

### 微信云开发免费额度
- **数据库**: 2GB存储 + 5万次读写
- **云存储**: 5GB存储 + 10GB流量  
- **云函数**: 1000GBs资源使用量

### 预期使用量（100个活跃用户）
- **数据库**: ~100MB （充足）
- **存储**: ~2GB （充足）
- **请求量**: ~1万次/月 （充足）

**结论**: 免费额度完全够用，成本几乎为零！

## 🔄 第二阶段：MySQL集成预告

下一阶段将集成腾讯云MySQL处理核心业务数据，实现混合架构的完整方案。

## 📞 技术支持

如需详细配置帮助，请参考：
- [微信云开发官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [项目GitHub仓库](https://github.com/your-repo) 