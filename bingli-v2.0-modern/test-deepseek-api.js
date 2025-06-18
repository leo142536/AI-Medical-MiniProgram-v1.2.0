// test-deepseek-api.js - DeepSeek API 测试文件
const https = require('https');

// DeepSeek API 配置
const API_CONFIG = {
  url: 'https://api.deepseek.com/chat/completions',
  key: 'sk-3dc5157f94f446278442e40b9f230406',
  model: 'deepseek-chat'
};

// 测试数据
const testData = {
  familyMemberCount: 3,
  recordCount: 5,
  recentRecords: [
    {
      memberName: '张三',
      hospital: '中山医院',
      diagnosis: '感冒',
      date: '2024-12-15'
    },
    {
      memberName: '李四',
      hospital: '人民医院', 
      diagnosis: '体检',
      date: '2024-12-10'
    }
  ]
};

// 构建请求数据
function buildRequestData(data) {
  const { familyMemberCount, recordCount, recentRecords } = data;
  
  const userPrompt = `请分析以下家庭健康数据：
- 家庭成员数量：${familyMemberCount}人
- 病历记录数量：${recordCount}条
- 近期就诊情况：${recentRecords.map(r => `${r.memberName}在${r.hospital}就诊，诊断：${r.diagnosis}`).join('；')}

请提供专业的健康分析和建议。`;

  return {
    model: API_CONFIG.model,
    messages: [
      {
        role: 'system',
        content: `你是一位经验丰富的健康分析师，擅长从病历数据中发现健康趋势和风险因素。请为用户提供个性化的健康建议。
分析要点：
1. 病历趋势分析
2. 风险因素识别
3. 预防措施建议
4. 生活方式优化`
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.2
  };
}

// 发送API请求
function callDeepSeekAPI(requestData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.key}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🔍 发送请求到 DeepSeek API...');
    console.log('📤 请求数据:', JSON.stringify(requestData, null, 2));

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📡 响应状态码: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ API 调用成功');
            console.log('📥 响应数据:', JSON.stringify(response, null, 2));
            resolve(response);
          } else {
            console.log('❌ API 调用失败');
            console.log('📥 错误响应:', JSON.stringify(response, null, 2));
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(response)}`));
          }
        } catch (error) {
          console.log('❌ 解析响应失败');
          console.log('📥 原始响应:', data);
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 请求发送失败');
      console.log('🔥 错误信息:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 解析响应
function parseResponse(response) {
  try {
    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      return {
        success: true,
        content: content,
        usage: response.usage
      };
    } else {
      throw new Error('响应格式异常：缺少 choices 字段');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 主测试函数
async function testDeepSeekAPI() {
  console.log('🚀 开始测试 DeepSeek API...');
  console.log('🔧 API 配置:', {
    url: API_CONFIG.url,
    model: API_CONFIG.model,
    key: API_CONFIG.key.slice(0, 10) + '****'
  });
  console.log('📊 测试数据:', testData);
  console.log('─'.repeat(60));

  try {
    // 1. 构建请求数据
    const requestData = buildRequestData(testData);
    
    // 2. 调用API
    const response = await callDeepSeekAPI(requestData);
    
    // 3. 解析响应
    const result = parseResponse(response);
    
    if (result.success) {
      console.log('─'.repeat(60));
      console.log('🎉 测试完成 - 成功！');
      console.log('📝 AI 分析结果:');
      console.log(result.content);
      console.log('─'.repeat(60));
      console.log('📊 使用统计:', result.usage);
      
      return {
        success: true,
        analysis: result.content,
        usage: result.usage
      };
    } else {
      console.log('─'.repeat(60));
      console.log('❌ 测试完成 - 失败！');
      console.log('🔥 错误信息:', result.error);
      
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.log('─'.repeat(60));
    console.log('❌ 测试异常！');
    console.log('🔥 异常信息:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
if (require.main === module) {
  testDeepSeekAPI()
    .then(result => {
      console.log('\n🏁 测试结束');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 测试崩溃:', error);
      process.exit(1);
    });
}

module.exports = {
  testDeepSeekAPI,
  callDeepSeekAPI,
  buildRequestData,
  parseResponse
}; 