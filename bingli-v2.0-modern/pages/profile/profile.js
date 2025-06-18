// pages/profile/profile.js
const util = require('../../utils/util');
const InteractionFeedback = require('../../utils/interaction-feedback');

Page({
  data: {
    userInfo: {
      nickname: '张三',
      avatar: '/images/default-avatar.png'
    },
    familyInfo: null,
    loading: false,
    settings: [
      {
        id: 'security',
        title: '安全设置',
        icon: '🔒',
        path: '/pages/settings/security/security',
        description: '密码锁、生物识别'
      },
      {
        id: 'notification',
        title: '通知设置',
        icon: '🔔',
        path: '/pages/settings/notification/notification',
        description: '提醒通知管理'
      },
      {
        id: 'privacy',
        title: '隐私设置',
        icon: '🛡️',
        path: '/pages/settings/privacy/privacy',
        description: '数据隐私保护'
      },
      {
        id: 'backup',
        title: '数据备份',
        icon: '☁️',
        path: '/pages/settings/backup/backup',
        description: '云端数据同步'
      },
      {
        id: 'about',
        title: '关于我们',
        icon: 'ℹ️',
        path: '/pages/settings/about/about',
        description: '版本信息、帮助文档'
      }
    ],
    quickStats: {
      recordCount: 0,
      reminderCount: 0,
      familyMemberCount: 0
    },
    menuItems: [
      {
        icon: '🤖',
        title: 'AI分析报告',
        desc: '查看历史AI健康分析报告',
        arrow: true,
        action: 'aiReports'
      },
      {
        icon: '🔐',
        title: '安全设置',
        desc: '密码锁定、指纹解锁',
        arrow: true,
        action: 'security'
      },
      {
        icon: '📱',
        title: '关于我们',
        desc: '版本信息、意见反馈',
        arrow: true,
        action: 'about'
      }
    ]
  },

  onLoad() {
    this.setData({ loading: true });
    InteractionFeedback.showLoading('正在加载个人信息...');
    this.loadUserData();
    this.loadQuickStats();
    this.setData({ loading: false });
    InteractionFeedback.hideLoading();
  },

  onShow() {
    this.loadUserData();
    this.loadQuickStats();
  },

  // 加载用户数据
  loadUserData() {
    const userInfo = util.getStorage('userInfo');
    const familyInfo = util.getStorage('familyInfo');
    
    if (!userInfo) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }

    this.setData({
      userInfo,
      familyInfo
    });
  },

  // 加载快速统计
  loadQuickStats() {
    // TODO: 从云数据库加载实际统计数据
    const mockStats = {
      recordCount: 12,
      reminderCount: 5,
      familyMemberCount: 4
    };
    
    this.setData({
      quickStats: mockStats
    });
  },

  // 设置项点击
  onSettingTap(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({
      url: path,
      fail: () => {
        InteractionFeedback.showInfo('页面开发中，敬请期待');
      }
    });
  },

  // 编辑个人信息
  onEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit/edit'
    });
  },

  // 查看统计详情
  onStatTap(e) {
    const { type } = e.currentTarget.dataset;
    let path = '';
    
    switch(type) {
      case 'record':
        path = '/pages/home/home';
        break;
      case 'reminder':
        path = '/pages/reminder/reminder';
        break;
      case 'family':
        path = '/pages/family/family';
        break;
    }
    
    if (path) {
      wx.switchTab({
        url: path
      });
    }
  },

  // 退出登录
  onLogout() {
    InteractionFeedback.showConfirm('确定要退出登录吗？', '退出后需要重新登录').then(confirmed => {
      if (confirmed) {
        InteractionFeedback.showLoading('正在退出...');
        
        // 清除本地存储
        util.removeStorage('userInfo');
        util.removeStorage('familyInfo');
        util.removeStorage('loginToken');
        
        // 跳转到登录页面
        wx.reLaunch({
          url: '/pages/login/login'
        });
        
        InteractionFeedback.showSuccess('已安全退出');
      }
    });
  },

  // 联系客服
  onContactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: () => {
        InteractionFeedback.showInfo('请手动拨打：400-123-4567');
      }
    });
  },

  // 分享小程序
  onShareAppMessage() {
    return {
      title: '家庭病历管理助手',
      desc: '智能管理家庭健康记录',
      path: '/pages/home/home'
    };
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserData();
    this.loadQuickStats();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 菜单项点击
  onMenuTap(e) {
    const { action } = e.currentTarget.dataset;
    
    switch(action) {
      case 'aiReports':
        this.viewAIReports();
        break;
      case 'security':
        wx.navigateTo({
          url: '/pages/settings/settings',
          fail: () => {
            InteractionFeedback.showInfo('安全设置功能开发中');
          }
        });
        break;
      case 'about':
        wx.navigateTo({
          url: '/pages/settings/settings',
          fail: () => {
            InteractionFeedback.showInfo('关于页面功能开发中');
          }
        });
        break;
      default:
        InteractionFeedback.showInfo('功能开发中，敬请期待');
    }
  },

  // 操作按钮点击
  onActionTap(e) {
    // 通过判断点击的按钮来执行对应操作
    const detail = e.detail;
    if (detail && detail.buttonIndex !== undefined) {
      if (detail.buttonIndex === 0) {
        // 联系客服
        this.onContactService();
      } else if (detail.buttonIndex === 1) {
        // 退出登录
        this.onLogout();
      }
    }
  },

  // 查看AI报告
  viewAIReports() {
    InteractionFeedback.showLoading('正在加载AI分析报告...');
    
    // 模拟加载数据
    setTimeout(() => {
      InteractionFeedback.hideLoading();
      
      const mockReports = [
        {
          date: '2024-12-18',
          type: '健康评估',
          score: 85,
          summary: '整体健康状况良好，建议继续保持...'
        },
        {
          date: '2024-12-15',
          type: '用药分析',
          score: 92,
          summary: '用药规律性较好，未发现异常...'
        }
      ];
      
      if (mockReports.length > 0) {
        this.showReportDetail(mockReports[0]);
      } else {
        InteractionFeedback.showInfo('暂无AI分析报告');
      }
    }, 1500);
  },

  // 显示报告详情
  showReportDetail(report) {
    wx.showModal({
      title: `AI分析报告 - ${report.type}`,
      content: `评估日期：${report.date}\n健康评分：${report.score}/100\n\n分析摘要：\n${report.summary}`,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '查看详情',
      success: (res) => {
        if (res.confirm) {
          InteractionFeedback.showInfo('详细报告功能开发中');
        }
      }
    });
  }
}); 