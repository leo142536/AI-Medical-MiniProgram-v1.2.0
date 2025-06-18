// pages/home/home-optimized.js - 优化后的首页逻辑（保证功能稳定性）
const util = require('../../utils/util');

Page({
  data: {
    // 原有数据结构保持不变
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
    
    // 新增数据项，用于优化后的UI
    isLoading: false,
    hasData: false,
    totalRecords: 0,
    recentActivities: [],
    
    // AI模型配置保持不变
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
    
    // 快捷操作配置 - 增加徽章数据
    quickActions: [
      {
        id: 'add-record',
        title: '添加病历',
        icon: '📋',
        path: '/pages/record/edit/edit',
        badge: null
      },
      {
        id: 'add-reminder',
        title: '设置提醒',
        icon: '⏰',
        path: '/pages/reminder/add/add',
        badge: null
      },
      {
        id: 'ai-analysis',
        title: 'AI分析',
        icon: '🤖',
        action: 'aiAnalysis',
        badge: 'NEW'
      }
    ]
  },

  onLoad() {
    console.log('优化版首页加载');
    this.setLoadingState(true);
    this.checkUserInfo();
    this.setTimeGreeting();
    this.loadData();
  },

  onShow() {
    console.log('优化版首页显示');
    // 重置导航状态
    this.setData({ isNavigating: false });
    this.loadData();
  },

  // 新增：设置加载状态
  setLoadingState(loading) {
    this.setData({ isLoading: loading });
  },

  // 原有方法保持不变 - 检查用户信息
  checkUserInfo() {
    const userInfo = util.getStorage('userInfo');
    const familyInfo = util.getStorage('familyInfo');
    
    if (!userInfo || !familyInfo) {
      this.setLoadingState(false);
      // 未登录，跳转到登录页面
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true,
      hasData: true
    });
  },

  // 原有方法保持不变 - 设置时间问候语
  setTimeGreeting() {
    const timeGreeting = util.getTimeGreeting();
    this.setData({
      timeGreeting: timeGreeting,
      weather: '晴天 22°C' // 模拟天气数据
    });
  },

  // 增强版数据加载 - 保持原有逻辑稳定性
  async loadData() {
    try {
      await Promise.all([
        this.loadFamilyMembers(),
        this.loadRecentRecords(),
        this.loadUpcomingReminders(),
        this.loadRecentActivities(), // 新增
        this.loadStatistics() // 新增
      ]);
      
      this.setLoadingState(false);
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setLoadingState(false);
      this.showError('数据加载失败，请重试');
    }
  },

  // 原有方法保持不变 - 加载家庭成员
  loadFamilyMembers() {
    return new Promise((resolve) => {
      const familyInfo = util.getStorage('familyInfo');
      const userInfo = util.getStorage('userInfo');
      
      let members = [];
      
      // 首先添加用户本人
      if (userInfo) {
        members.push({
          id: 'self',
          name: userInfo.nickName || '本人',
          relation: '本人',
          avatar: userInfo.avatarUrl || '/images/default-avatar.png',
          healthStatus: 'good' // 新增健康状态
        });
      }
      
      // 然后添加家庭成员
      if (familyInfo && familyInfo.members) {
        const enhancedMembers = familyInfo.members.map(member => ({
          ...member,
          healthStatus: member.healthStatus || 'good' // 确保有健康状态
        }));
        members = members.concat(enhancedMembers);
      }
      
      // 只显示前4个成员
      const displayMembers = members.slice(0, 4);
      this.setData({
        familyMembers: displayMembers
      });
      
      resolve();
    });
  },

  // 原有方法保持不变 - 加载最近病历
  loadRecentRecords() {
    return new Promise((resolve) => {
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
        recentRecords: mockData,
        totalRecords: mockData.length + 8 // 模拟总记录数
      });
      
      resolve();
    });
  },

  // 原有方法保持不变 - 加载即将到来的提醒
  loadUpcomingReminders() {
    return new Promise((resolve) => {
      // TODO: 从云数据库加载提醒数据
      const mockData = [
        {
          id: 1,
          title: '复诊提醒',
          time: '明天 14:00',
          member: '张三',
          relation: '二舅',
          type: 'medical',
          priority: 'high' // 新增优先级
        },
        {
          id: 2,
          title: '服药提醒',
          time: '今天 18:00',
          member: '李四',
          relation: '母亲',
          type: 'medicine',
          priority: 'medium'
        }
      ];
      
      this.setData({
        upcomingReminders: mockData
      });
      
      resolve();
    });
  },

  // 新增：加载最近活动时间线
  loadRecentActivities() {
    return new Promise((resolve) => {
      const mockActivities = [
        {
          id: 1,
          title: '添加了新的病历记录',
          description: '张三的感冒就诊记录已添加',
          time: '2小时前',
          type: 'record',
          typeLabel: '病历',
          member: '张三'
        },
        {
          id: 2,
          title: '设置了服药提醒',
          description: '李四的降压药提醒已设置',
          time: '1天前',
          type: 'reminder',
          typeLabel: '提醒',
          member: '李四'
        },
        {
          id: 3,
          title: '完成了体检预约',
          description: '年度体检预约成功',
          time: '3天前',
          type: 'medical',
          typeLabel: '医疗',
          member: '本人'
        }
      ];
      
      this.setData({
        recentActivities: mockActivities
      });
      
      resolve();
    });
  },

  // 新增：加载统计数据
  loadStatistics() {
    return new Promise((resolve) => {
      // 这里可以从实际数据源计算统计信息
      const totalRecords = this.data.recentRecords.length + 8; // 模拟总数
      const familyCount = this.data.familyMembers.length;
      
      this.setData({
        totalRecords: totalRecords
      });
      
      resolve();
    });
  },

  // 原有方法保持不变 - 快捷操作点击
  onQuickActionTap(e) {
    if (this.data.isNavigating) return;
    
    const { id, path, action } = e.currentTarget.dataset;
    
    if (action === 'aiAnalysis') {
      this.onAIAnalysis();
      return;
    }
    
    if (path) {
      this.setData({ isNavigating: true });
      wx.navigateTo({
        url: path,
        fail: () => {
          this.setData({ isNavigating: false });
        }
      });
    }
  },

  // 新增：FAB点击事件
  onFabTap() {
    wx.showActionSheet({
      itemList: ['添加病历', '设置提醒', 'AI分析'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.navigateTo('/pages/record/edit/edit');
            break;
          case 1:
            this.navigateTo('/pages/reminder/add/add');
            break;
          case 2:
            this.onAIAnalysis();
            break;
        }
      }
    });
  },

  // 新增：活动点击事件
  onActivityTap(e) {
    const { id } = e.currentTarget.dataset;
    console.log('点击活动:', id);
    // 根据活动类型跳转到对应页面
  },

  // 新增：演示按钮点击事件
  onViewDemo() {
    wx.showToast({
      title: '演示功能开发中',
      icon: 'none'
    });
  },

  // 工具方法：安全导航
  navigateTo(url) {
    if (this.data.isNavigating) return;
    
    this.setData({ isNavigating: true });
    wx.navigateTo({
      url: url,
      fail: () => {
        this.setData({ isNavigating: false });
      }
    });
  },

  // 工具方法：显示错误信息
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  // 工具方法：显示成功信息
  showSuccess(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 1500
    });
  },

  // === 以下保持原有方法不变，确保功能稳定性 ===

  // AI分析相关方法
  onAIAnalysis() {
    this.setData({
      showAIModal: true
    });
  },

  onCloseAIModal() {
    this.setData({
      showAIModal: false,
      selectedModel: null,
      analysisResult: null,
      isAnalyzing: false
    });
  },

  onSelectModel(e) {
    const modelId = e.currentTarget.dataset.id;
    this.setData({
      selectedModel: modelId
    });
  },

  onStartAnalysis() {
    if (!this.data.selectedModel) {
      wx.showToast({
        title: '请选择AI模型',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isAnalyzing: true });
    this.performAIAnalysis();
  },

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
              model: this.data.aiModels.find(m => m.id === selectedModel),
              summary: apiResult.content,
              recommendations: [],
              riskFactors: [],
              timestamp: new Date().toISOString(),
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
        analysisResult: analysisResult,
        isAnalyzing: false
      });
      
    } catch (error) {
      console.error('AI分析失败:', error);
      this.setData({ isAnalyzing: false });
      wx.showToast({
        title: 'AI分析失败，请重试',
        icon: 'none'
      });
    }
  },

  generateMockAnalysis(modelId, familyData) {
    const modelInfo = this.data.aiModels.find(m => m.id === modelId);
    
    return {
      model: modelInfo,
      summary: '基于您的家庭健康数据分析，整体健康状况良好。',
      recommendations: [
        {
          type: 'health',
          title: '健康建议',
          content: '建议定期体检，保持良好作息。'
        },
        {
          type: 'medication',
          title: '用药提醒',
          content: '按时服药，注意药物副作用。'
        }
      ],
      riskFactors: [
        {
          level: 'low',
          factor: '血压偏高',
          suggestion: '控制饮食，适量运动'
        }
      ],
      timestamp: new Date().toISOString()
    };
  },

  // 其他原有方法保持不变
  onViewMoreFamily() {
    this.loadAllFamilyMembers();
    this.setData({ showFamilyModal: true });
  },

  onViewMoreRecords() {
    this.navigateTo('/pages/record/record');
  },

  onViewMoreReminders() {
    this.navigateTo('/pages/reminder/reminder');
  },

  onViewMoreActivities() {
    // 新增：查看更多活动
    console.log('查看更多活动');
  },

  onToggleDeleteMode() {
    this.setData({
      isDeleteMode: !this.data.isDeleteMode
    });
  },

  onDeleteMember(e) {
    const { id, name } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除家庭成员"${name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deleteFamilyMember(id);
        }
      }
    });
  },

  deleteFamilyMember(memberId) {
    const familyInfo = util.getStorage('familyInfo');
    if (familyInfo && familyInfo.members) {
      familyInfo.members = familyInfo.members.filter(member => member.id !== memberId);
      util.setStorage('familyInfo', familyInfo);
      
      this.loadFamilyMembers();
      this.loadAllFamilyMembers();
      
      this.showSuccess('删除成功');
    }
  },

  onAddFamilyMember() {
    this.navigateTo('/pages/family/add/add');
  },

  onFamilyMemberTap(e) {
    if (this.data.isDeleteMode) return;
    
    const { id } = e.currentTarget.dataset;
    console.log('点击家庭成员:', id);
  },

  onRecordTap(e) {
    const { id } = e.currentTarget.dataset;
    this.navigateTo(`/pages/record/detail/detail?id=${id}`);
  },

  onReminderTap(e) {
    const { id } = e.currentTarget.dataset;
    console.log('点击提醒:', id);
  },

  onStartUse() {
    this.navigateTo('/pages/family/add/add');
  },

  // 页面生命周期方法
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return {
      title: 'AI病例管理 - 智能健康管理助手',
      path: '/pages/home/home'
    };
  }
}); 