// pages/home/home.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    familyMembers: [],
    recentRecords: [],
    upcomingReminders: [],
    quickActions: [
      {
        id: 'add-record',
        title: '添加病历',
        icon: '📋',
        path: '/pages/record/add/add'
      },
      {
        id: 'add-reminder',
        title: '设置提醒',
        icon: '⏰',
        path: '/pages/reminder/add/add'
      },
      {
        id: 'family-manage',
        title: '家庭管理',
        icon: '👨‍👩‍👧‍👦',
        path: '/pages/family/family'
      },
      {
        id: 'settings',
        title: '设置',
        icon: '⚙️',
        path: '/pages/settings/settings'
      }
    ]
  },

  onLoad() {
    console.log('首页加载');
    this.checkUserInfo();
    this.loadData();
  },

  onShow() {
    console.log('首页显示');
    this.loadData();
  },

  // 检查用户信息
  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  // 加载首页数据
  loadData() {
    this.loadFamilyMembers();
    this.loadRecentRecords();
    this.loadUpcomingReminders();
  },

  // 加载家庭成员
  loadFamilyMembers() {
    // TODO: 从云数据库加载家庭成员数据
    const mockData = [
      { id: 1, name: '张三', relation: '本人', avatar: '' },
      { id: 2, name: '李四', relation: '配偶', avatar: '' },
      { id: 3, name: '王五', relation: '子女', avatar: '' }
    ];
    this.setData({
      familyMembers: mockData
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
        hospital: '中山医院'
      },
      {
        id: 2,
        title: '体检报告',
        date: '2024-12-15',
        member: '李四',
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
        type: 'medical'
      },
      {
        id: 2,
        title: '服药提醒',
        time: '今天 18:00',
        member: '李四',
        type: 'medicine'
      }
    ];
    this.setData({
      upcomingReminders: mockData
    });
  },

  // 快捷操作点击
  onQuickActionTap(e) {
    const { path } = e.currentTarget.dataset;
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

  // 家庭成员点击
  onFamilyMemberTap(e) {
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

  // 分享
  onShareAppMessage() {
    return {
      title: 'AI病例管理 - 智能健康管理助手',
      path: '/pages/home/home'
    };
  }
}); 