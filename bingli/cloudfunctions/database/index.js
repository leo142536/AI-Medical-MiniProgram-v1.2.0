/* global exports */
// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action, collection, data, docId, where, limit, skip, orderBy } = event;
  
  try {
    console.log('数据库操作:', { 
      action, 
      collection, 
      openid: wxContext.OPENID,
      timestamp: new Date().toISOString()
    });

    switch (action) {
      case 'add':
        return await addDocument(collection, data, wxContext.OPENID);
      
      case 'get':
        return await getDocument(collection, docId, wxContext.OPENID);
      
      case 'list':
        return await listDocuments(collection, where, limit, skip, orderBy, wxContext.OPENID);
      
      case 'update':
        return await updateDocument(collection, docId, data, wxContext.OPENID);
      
      case 'delete':
        return await deleteDocument(collection, docId, wxContext.OPENID);
      
      case 'count':
        return await countDocuments(collection, where, wxContext.OPENID);
      
      default:
        throw new Error('未知操作类型');
    }
  } catch (error) {
    console.error('数据库操作失败:', error);
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
};

// 添加文档
async function addDocument(collection, data, openid) {
  const result = await db.collection(collection).add({
    data: {
      ...data,
      _openid: openid,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });
  
  console.log('添加成功:', result._id);
  return {
    success: true,
    id: result._id,
    data: { ...data, _id: result._id, _openid: openid }
  };
}

// 获取单个文档
async function getDocument(collection, docId, openid) {
  const result = await db.collection(collection)
    .where({ _id: docId, _openid: openid })
    .limit(1)
    .get();
  
  const data = result.data.length > 0 ? result.data[0] : null;
  console.log('获取文档:', data ? '成功' : '未找到');
  
  return {
    success: true,
    data: data
  };
}

// 获取文档列表
async function listDocuments(collection, where = {}, limit = 20, skip = 0, orderBy = null, openid) {
  let query = db.collection(collection).where({
    _openid: openid,
    ...where
  });
  
  // 添加查询条件
  if (Object.keys(where).length > 0) {
    Object.keys(where).forEach(key => {
      const condition = where[key];
      if (typeof condition === 'object' && condition.operator) {
        switch (condition.operator) {
          case '==':
            query = query.where({ [key]: db.command.eq(condition.value) });
            break;
          case '>':
            query = query.where({ [key]: db.command.gt(condition.value) });
            break;
          case '>=':
            query = query.where({ [key]: db.command.gte(condition.value) });
            break;
          case '<':
            query = query.where({ [key]: db.command.lt(condition.value) });
            break;
          case '<=':
            query = query.where({ [key]: db.command.lte(condition.value) });
            break;
          case 'in':
            query = query.where({ [key]: db.command.in(condition.value) });
            break;
          case 'regex':
            query = query.where({ [key]: db.RegExp(condition.value, 'i') });
            break;
        }
      }
    });
  }
  
  // 添加排序
  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
  } else {
    query = query.orderBy('createTime', 'desc');
  }
  
  // 分页
  const result = await query.skip(skip).limit(limit).get();
  
  console.log('查询成功:', result.data.length, '条记录');
  return {
    success: true,
    data: result.data,
    total: result.data.length
  };
}

// 更新文档
async function updateDocument(collection, docId, data) {
  const result = await db.collection(collection).doc(docId).update({
    data: {
      ...data,
      updateTime: db.serverDate()
    }
  });
  
  return {
    success: true,
    data: result
  };
}

// 删除文档
async function deleteDocument(collection, docId) {
  const result = await db.collection(collection).doc(docId).remove();
  
  return {
    success: true,
    data: result
  };
}

// 统计文档数量
async function countDocuments(collection, where = {}) {
  let query = db.collection(collection);
  
  // 添加查询条件
  if (Object.keys(where).length > 0) {
    Object.keys(where).forEach(key => {
      query = query.where({ [key]: where[key] });
    });
  }
  
  const result = await query.count();
  
  return {
    success: true,
    count: result.total
  };
} 