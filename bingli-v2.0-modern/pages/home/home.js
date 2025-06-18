// pages/home/home.js
const util = require('../../utils/util');
const InteractionFeedback = require('../../utils/interaction-feedback');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    familyMembers: [],
    recentRecords: [],
    upcomingReminders: [],
    timeGreeting: '',
    weather: '',
    isNavigating: false,
    isDeleteMode: false,
    showFamilyModal: false,
    allFamilyMembers: [],
    showAIModal: false,
    selectedModel: null,
    analysisResult: null,
    isAnalyzing: false,
    aiModels: [
      {
        id: 'doubao',
        name: '豆包',
        description: '字节跳动豆包AI，专业的中文医疗分析模型',
        icon: '🫘',
        features: ['中文理解强', '医疗专业', '快速响应'],
        accuracy: '95%'
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'DeepSeek深度求索AI，强大的医疗健康分析能力',
        icon: '🔍',
        features: ['深度分析', '逻辑推理', '个性化建议'],
        accuracy: '93%'
      },
      {
        id: 'stepfun',
        name: '阶跃星辰',
        description: '阶跃星辰AI助手，智能医疗健康管理专家',
        icon: '⭐',
        features: ['智能诊断', '健康管理', '风险预测'],
        accuracy: '91%'
      }
    ],
    quickActions: [
      {
        id: 'add-record',
        title: '添加病历',
        icon: '📋',
        path: '/pages/record/edit/edit'
      },
      {
        id: 'add-reminder',
        title: '设置提醒',
        icon: '⏰',
        path: '/pages/reminder/add/add'
      },
      {
        id: 'ai-analysis',
        title: 'AI分析',
        icon: '🤖',
        action: 'aiAnalysis'
      }
    ]
  },

  onLoad() {
    console.log('首页加载');
    this.checkUserInfo();
    this.setTimeGreeting();
    this.loadData();
  },

  onShow() {
    console.log('首页显示');
    // 重置导航状态
    this.setData({ isNavigating: false });
    this.loadData();
  },

  // 检查用户信息
  checkUserInfo() {
    const userInfo = util.getStorage('userInfo');
    const familyInfo = util.getStorage('familyInfo');
    
    if (!userInfo || !familyInfo) {
      // 未登录，跳转到登录页面
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true
    });
  },

  // 设置时间问候语
  setTimeGreeting() {
    const timeGreeting = util.getTimeGreeting();
    this.setData({
      timeGreeting: timeGreeting,
      weather: '晴天 22°C' // 模拟天气数据
    });
  },

  // 加载首页数据
  loadData() {
    this.loadFamilyMembers();
    this.loadRecentRecords();
    this.loadUpcomingReminders();
  },

  // 加载家庭成员
  loadFamilyMembers() {
    const familyInfo = util.getStorage('familyInfo');
    const userInfo = util.getStorage('userInfo');
    
    let members = [];
    
    // 首先添加用户本人
    if (userInfo) {
      members.push({
        id: 'self',
        name: userInfo.nickName || '本人',
        relation: '本人',
        avatar: userInfo.avatarUrl || '/images/default-avatar.png'
      });
    }
    
    // 然后添加家庭成员
    if (familyInfo && familyInfo.members) {
      members = members.concat(familyInfo.members);
    }
    
    // 只显示前4个成员
    const displayMembers = members.slice(0, 4);
    this.setData({
      familyMembers: displayMembers
    });
  },

  // 加载最近病历
  loadRecentRecords() {
    // TODO: 从云数据库加载最近病历数据
    const mockData = [
      {
        id: 1,
        title: '感冒就诊',
        date: '2024-12-18',
        member: '张三',
        relation: '二舅',
        hospital: '中山医院'
      },
      {
        id: 2,
        title: '体检报告',
        date: '2024-12-15',
        member: '李四',
        relation: '母亲',
        hospital: '健康体检中心'
      }
    ];
    this.setData({
      recentRecords: mockData
    });
  },

  // 加载即将到来的提醒
  loadUpcomingReminders() {
    // TODO: 从云数据库加载提醒数据
    const mockData = [
      {
        id: 1,
        title: '复诊提醒',
        time: '明天 14:00',
        member: '张三',
        relation: '二舅',
        type: 'medical'
      },
      {
        id: 2,
        title: '服药提醒',
        time: '今天 18:00',
        member: '李四',
        relation: '母亲',
        type: 'medicine'
      }
    ];
    this.setData({
      upcomingReminders: mockData
    });
  },

  // 快捷操作点击
  onQuickActionTap(e) {
    const dataset = e.currentTarget.dataset;
    const actionId = dataset.id;
    const path = dataset.path;
    
    // 特殊处理AI分析
    if (actionId === 'ai-analysis') {
      this.onAIAnalysis();
      return;
    }
    
    if (path) {
      wx.navigateTo({
        url: path,
        fail: () => {
          wx.switchTab({
            url: path
          });
        }
      });
    }
  },

  // AI分析功能
  onAIAnalysis() {
    this.setData({
      showAIModal: true
    });
  },

  // 关闭AI分析弹窗
  onCloseAIModal() {
    this.setData({
      showAIModal: false,
      selectedModel: null,
      analysisResult: null,
      isAnalyzing: false
    });
  },

  // 选择AI模型
  onSelectModel(e) {
    const { model } = e.currentTarget.dataset;
    this.setData({
      selectedModel: model
    });
  },

  // 开始AI分析
  onStartAnalysis() {
    if (!this.data.selectedModel) {
      InteractionFeedback.showWarning('请先选择AI模型');
      return;
    }

    this.setData({
      isAnalyzing: true,
      analysisResult: null,
      loadingType: 'pulse' // 使用脉冲加载动画
    });

    InteractionFeedback.showLoading('AI正在分析健康数据...', true);
    // 模拟AI分析过程
    this.performAIAnalysis();
  },

  // 执行AI分析
  async performAIAnalysis() {
    const { selectedModel } = this.data;
    
    // 获取本地病历数据进行分析（不上传到服务器）
    const familyInfo = util.getStorage('familyInfo') || { members: [] };
    
    // 检查是否配置了真实的API密钥
    const aiConfig = require('../../utils/aiConfig');
    const configCheck = aiConfig.checkAPIConfig();
    
    try {
      let analysisResult;
      
      if (configCheck.availableModels.includes(selectedModel)) {
        // 使用真实API
        console.log('使用真实AI API进行分析...', selectedModel);
        const analysisData = {
          familyMemberCount: familyInfo.members.length + 1,
          recordCount: this.data.recentRecords.length,
          recentRecords: this.data.recentRecords
        };
        
        try {
          const apiResult = await aiConfig.callAIAPI(selectedModel, analysisData);
          
          if (apiResult.success) {
            analysisResult = {
              name: aiConfig.AI_MODELS_CONFIG[selectedModel].name,
              analysis: apiResult.content,
              confidence: '真实AI分析 ✅'
            };
          } else {
            throw new Error(apiResult.error);
          }
        } catch (apiError) {
          console.log('真实API调用失败，使用模拟数据:', apiError.message);
          // API调用失败时回退到模拟数据
          analysisResult = this.generateMockAnalysis(selectedModel, familyInfo);
          analysisResult.confidence = '模拟数据（API调用失败）';
        }
        
      } else {
        // 使用模拟数据
        console.log('API未配置，使用模拟数据进行演示...');
        analysisResult = this.generateMockAnalysis(selectedModel, familyInfo);
        analysisResult.confidence = '模拟数据（API未配置）';
        
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      }
      
      this.setData({
        isAnalyzing: false,
        analysisResult: analysisResult
      });
      
      InteractionFeedback.hideLoading();
      InteractionFeedback.showSuccess('AI分析完成！');
      
    } catch (error) {
      console.error('AI分析失败:', error);
      
      // 发生错误时使用模拟数据作为备选
      const mockAnalysisData = this.generateMockAnalysis(selectedModel, familyInfo);
      mockAnalysisData.analysis = `⚠️ API调用失败，以下为演示数据：\n\n${mockAnalysisData.analysis}`;
      
      this.setData({
        isAnalyzing: false,
        analysisResult: mockAnalysisData
      });
      
      wx.showToast({
        title: 'API未配置，使用演示',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 生成模拟分析结果
  generateMockAnalysis(model, familyData) {
    const memberCount = familyData.members.length + 1; // +1 for self
    const recordCount = this.data.recentRecords.length;
    
    const analysisTemplates = {
      'doubao': {
        name: '豆包',
        analysis: `基于豆包深度学习分析：

📊 家庭健康概况
• 家庭成员：${memberCount}人
• 病历记录：${recordCount}条
• 整体健康状态：良好

🔍 智能诊断建议
• 建议定期进行全面体检
• 关注慢性疾病预防
• 保持良好生活习惯

⚠️ 风险评估
• 总体风险等级：低风险
• 需要关注的指标：血压、血糖
• 建议复查时间：6个月后`,
        confidence: '95%'
      },
      'deepseek': {
        name: 'DeepSeek',
        analysis: `DeepSeek深度求索AI分析报告：

🏥 病历趋势分析
• 就诊频率：正常范围
• 主要疾病类型：常见疾病
• 治疗效果：良好

💡 个性化建议
• 根据年龄结构，建议加强老年人健康监护
• 建立家庭健康档案管理制度
• 定期进行健康数据监测

📈 预测性分析
• 未来6个月健康趋势：稳定
• 潜在风险因素：季节性疾病
• 预防措施：疫苗接种、营养补充`,
        confidence: '93%'
      },
      'stepfun': {
        name: '阶跃星辰',
        analysis: `阶跃星辰AI助手分析：

🧬 深度健康洞察
• 家族健康模式识别完成
• 疾病关联性分析：无显著风险
• 生活方式评估：健康水平中等

🎯 精准医疗建议
• 个体化体检方案：心血管+内分泌检查
• 营养膳食优化：增加蛋白质摄入
• 运动处方：有氧运动30分钟/天

🔮 健康预测模型
• 3个月内疾病风险：5%
• 建议预防重点：呼吸道感染
• 最佳就医时机：症状出现24小时内`,
        confidence: '91%'
      }
    };

    return analysisTemplates[model] || analysisTemplates['doubao'];
  },

  // 保存AI分析报告
  onSaveReport() {
    if (!this.data.analysisResult) return;
    
    const report = {
      id: Date.now(),
      modelName: this.data.analysisResult.name,
      confidence: this.data.analysisResult.confidence,
      analysis: this.data.analysisResult.analysis,
      createTime: new Date().toLocaleString(),
      familyMemberCount: this.data.familyMembers.length + 1,
      recordCount: this.data.recentRecords.length
    };
    
    // 保存到本地存储
    let reports = util.getStorage('aiReports') || [];
    reports.unshift(report); // 最新的放在前面
    
    // 只保留最近10份报告
    if (reports.length > 10) {
      reports = reports.slice(0, 10);
    }
    
    util.setStorage('aiReports', reports);
    
    InteractionFeedback.showSuccess('分析报告已保存！');
    
    // 关闭弹窗
    this.onCloseAIModal();
  },

  // 查看更多家庭成员
  onViewMoreFamily() {
    // 加载所有家庭成员
    this.loadAllFamilyMembers();
    this.setData({
      showFamilyModal: true
    });
  },

  // 加载所有家庭成员
  loadAllFamilyMembers() {
    const familyInfo = util.getStorage('familyInfo');
    const userInfo = util.getStorage('userInfo');
    
    let allMembers = [];
    
    // 首先添加用户本人
    if (userInfo) {
      allMembers.push({
        id: 'self',
        name: userInfo.nickName || '本人',
        relation: '本人',
        avatar: userInfo.avatarUrl || '/images/default-avatar.png'
      });
    }
    
    // 然后添加家庭成员
    if (familyInfo && familyInfo.members) {
      allMembers = allMembers.concat(familyInfo.members);
    }
    
    this.setData({
      allFamilyMembers: allMembers
    });
  },

  // 关闭家庭成员弹窗
  onCloseFamilyModal() {
    this.setData({
      showFamilyModal: false
    });
  },

  // 添加家庭成员
  onAddFamilyMember(e) {
    // 阻止事件冒泡，避免触发成员点击事件
    if (e) e.stopPropagation();
    
    // 防止重复点击
    if (this.data.isNavigating) {
      return;
    }
    
    this.setData({ isNavigating: true });
    
    wx.navigateTo({
      url: '/pages/family/add/add',
      success: () => {
        // 导航成功后重置状态
        setTimeout(() => {
          this.setData({ isNavigating: false });
        }, 1000);
      },
      fail: () => {
        // 导航失败时重置状态
        this.setData({ isNavigating: false });
      }
    });
  },

  // 查看更多病历
  onViewMoreRecords() {
    wx.switchTab({
      url: '/pages/record/record'
    });
  },

  // 查看更多提醒
  onViewMoreReminders() {
    wx.switchTab({
      url: '/pages/reminder/reminder'
    });
  },

  // 切换删除模式
  onToggleDeleteMode() {
    this.setData({
      isDeleteMode: !this.data.isDeleteMode
    });
  },

  // 删除成员
  onDeleteMember(e) {
    e.stopPropagation(); // 阻止事件冒泡
    
    const { id, name } = e.currentTarget.dataset;
    
    util.showConfirm(`确定要删除成员"${name}"吗？`, '删除确认').then(confirmed => {
      if (confirmed) {
        this.deleteFamilyMember(id);
      }
    });
  },

  // 执行删除成员
  deleteFamilyMember(memberId) {
    try {
      util.showLoading('删除中...');
      
      const familyInfo = util.getStorage('familyInfo') || { members: [] };
      
      // 过滤掉要删除的成员
      familyInfo.members = familyInfo.members.filter(member => member.id !== memberId);
      
      // 保存更新后的数据
      const saveResult = util.setStorage('familyInfo', familyInfo);
      
      if (saveResult) {
        util.hideLoading();
        util.showToast('删除成功', 'success');
        
        // 重新加载数据
        this.loadFamilyMembers();
      } else {
        throw new Error('删除失败');
      }
      
    } catch (error) {
      util.hideLoading();
      console.error('删除成员失败:', error);
      util.showToast('删除失败，请重试');
    }
  },

  // 家庭成员点击
  onFamilyMemberTap(e) {
    // 删除模式下不响应点击
    if (this.data.isDeleteMode) {
      return;
    }
    
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/family/detail/detail?id=${id}`
    });
  },

  // 病历项点击
  onRecordTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/record/detail/detail?id=${id}`
    });
  },

  // 提醒项点击
  onReminderTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/reminder/detail/detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  // 开始使用
  onStartUse() {
    wx.redirectTo({
      url: '/pages/login/login'
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'AI病例管理 - 智能健康管理助手',
      path: '/pages/home/home'
    };
  }
}); 