// scripts/init-database.js - 数据库初始化脚本
// 在微信开发者工具的云开发控制台中运行此脚本

// TODO: 请根据实际数据库初始化方式补充 db 的定义
const db = {};

// 健康提醒集合初始化
async function initHealthReminders() {
  try {
    console.log('开始初始化 health_reminders 集合...');
    
    // 创建集合（如果不存在）
    await db.createCollection('health_reminders');
    
    // 插入示例数据
    const sampleReminders = [
      {
        title: '早餐后服药',
        type: 'medication',
        time: '2024-12-19 08:30:00',
        frequency: 'daily',
        medication: {
          name: '维生素C',
          dosage: '1片',
          notes: '饭后服用'
        },
        status: 'active'
      },
      {
        title: '体检复查',
        type: 'appointment', 
        time: '2024-12-25 14:00:00',
        frequency: 'once',
        notes: '携带上次检查报告',
        status: 'active'
      },
      {
        title: '血压测量',
        type: 'checkup',
        time: '2024-12-19 19:00:00', 
        frequency: 'daily',
        notes: '每日晚餐后测量',
        status: 'active'
      }
    ];

    for (const reminder of sampleReminders) {
      await db.collection('health_reminders').add({
        data: {
          ...reminder,
          createTime: new Date(),
          updateTime: new Date()
        }
      });
    }

    console.log('health_reminders 集合初始化完成');
  } catch (error) {
    console.error('初始化 health_reminders 失败:', error);
  }
}

// 用户设置集合初始化
async function initUserSettings() {
  try {
    console.log('开始初始化 user_settings 集合...');
    
    // 创建集合
    await db.createCollection('user_settings');
    
    // 插入默认设置
    const defaultSettings = {
      appLock: false,
      biometric: false,
      notification: true,
      reminderSound: true,
      vibration: true,
      darkMode: false,
      animation: true,
      autoBackup: true,
      dataSharing: false,
      fontSize: 'medium',
      lockTimeout: 60000 // 1分钟
    };

    await db.collection('user_settings').add({
      data: {
        ...defaultSettings,
        createTime: new Date(),
        updateTime: new Date()
      }
    });

    console.log('user_settings 集合初始化完成');
  } catch (error) {
    console.error('初始化 user_settings 失败:', error);
  }
}

// 文件记录集合初始化
async function initFileRecords() {
  try {
    console.log('开始初始化 file_records 集合...');
    
    // 创建集合
    await db.createCollection('file_records');
    
    console.log('file_records 集合初始化完成');
  } catch (error) {
    console.error('初始化 file_records 失败:', error);
  }
}

// 创建索引
async function createIndexes() {
  try {
    console.log('开始创建索引...');
    
    // health_reminders 索引
    await db.collection('health_reminders').createIndex({
      keys: {
        _openid: 1,
        status: 1,
        time: 1
      }
    });

    await db.collection('health_reminders').createIndex({
      keys: {
        _openid: 1,
        type: 1
      }
    });

    // user_settings 索引
    await db.collection('user_settings').createIndex({
      keys: {
        _openid: 1
      }
    });

    // file_records 索引  
    await db.collection('file_records').createIndex({
      keys: {
        _openid: 1,
        relatedType: 1,
        relatedId: 1
      }
    });

    console.log('索引创建完成');
  } catch (error) {
    console.error('创建索引失败:', error);
  }
}

// 主初始化函数
async function initDatabase() {
  console.log('==== 开始数据库初始化 ====');
  
  try {
    await initHealthReminders();
    await initUserSettings(); 
    await initFileRecords();
    await createIndexes();
    
    console.log('==== 数据库初始化完成 ====');
    
    // 显示统计信息
    const stats = await getCollectionStats();
    console.log('集合统计信息:', stats);
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 获取集合统计信息
async function getCollectionStats() {
  const collections = ['health_reminders', 'user_settings', 'file_records'];
  const stats = {};
  
  for (const collection of collections) {
    try {
      const count = await db.collection(collection).count();
      stats[collection] = count.total;
    } catch (error) {
      stats[collection] = 'error';
    }
  }
  
  return stats;
}

// 清理测试数据（慎用）
async function clearTestData() {
  console.log('==== 开始清理测试数据 ====');
  
  try {
    const collections = ['health_reminders', 'user_settings', 'file_records'];
    
    for (const collection of collections) {
      const result = await db.collection(collection).where({}).remove();
      console.log(`清理 ${collection}:`, result.stats.removed, '条记录');
    }
    
    console.log('==== 测试数据清理完成 ====');
  } catch (error) {
    console.error('清理测试数据失败:', error);
  }
}

// 执行初始化
// 在微信开发者工具云开发控制台中运行：
// initDatabase()

// 如需清理数据，运行：
// clearTestData()

module.exports = {
  initDatabase,
  clearTestData,
  getCollectionStats
}; 