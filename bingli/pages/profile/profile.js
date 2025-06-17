// pages/profile/profile.js
const util = require('../../utils/util');

Page({
  data: {
    userInfo: {
      nickname: '张三',
      avatar: '/images/default-avatar.png'
    },
    familyInfo: null,
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
    this.loadUserData();
    this.loadQuickStats();
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
        util.showToast('页面开发中');
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
    util.showConfirm('确定要退出登录吗？', '确认退出').then(confirmed => {
      if (confirmed) {
        // 清除本地存储
        util.removeStorage('userInfo');
        util.removeStorage('familyInfo');
        util.removeStorage('loginToken');
        
        // 跳转到登录页面
        wx.reLaunch({
          url: '/pages/login/login'
        });
      }
    });
  },

  // 联系客服
  onContactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: () => {
        util.showToast('请手动拨打：400-123-4567');
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
    wx.stopPullDownRefresh();
  },

  // 菜单点击事件
  onMenuTap(e) {
    const { action } = e.currentTarget.dataset;
    
    switch (action) {
      case 'aiReports':
        this.viewAIReports();
        break;
      case 'security':
        wx.navigateTo({
          url: '/pages/settings/settings'
        });
        break;
      case 'about':
        wx.showModal({
          title: '关于我们',
          content: 'AI病例管理小程序\n版本：1.0.0\n专为中老年人设计的智能健康管理工具',
          showCancel: false
        });
        break;
    }
  },

  // 查看AI报告
  viewAIReports() {
    const reports = util.getStorage('aiReports') || [];
    
    if (reports.length === 0) {
      wx.showModal({
        title: '暂无报告',
        content: '您还没有AI分析报告，请先在首页进行AI分析',
        showCancel: false
      });
      return;
    }
    
    // 显示报告列表
    const reportTitles = reports.map((report, index) => 
      `${index + 1}. ${report.modelName} - ${report.createTime}`
    );
    
    wx.showActionSheet({
      itemList: reportTitles,
      success: (res) => {
        this.showReportDetail(reports[res.tapIndex]);
      }
    });
  },

  // 显示报告详情
  showReportDetail(report) {
    wx.showModal({
      title: report.modelName,
      content: `分析时间：${report.createTime}\n可信度：${report.confidence}\n\n${report.analysis}`,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '分享',
      success: (res) => {
        if (res.confirm) {
          // 分享功能
          wx.showShareMenu({
            withShareTicket: true
          });
        }
      }
    });
  }
}); 