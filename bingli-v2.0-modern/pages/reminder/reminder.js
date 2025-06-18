// pages/reminder/reminder.js
// 基于GitHub最佳实践的现代化提醒页面
const cloudDB = require('../../services/cloudDatabase');
const util = require('../../utils/util');
const InteractionFeedback = require('../../utils/interaction-feedback');

Page({
  data: {
    reminders: [],
    todayReminders: [],
    upcomingReminders: [],
    activeTab: 0,
    tabs: [
      { title: '今日', count: 0 },
      { title: '即将到来', count: 0 },
      { title: '全部', count: 0 }
    ],
    loading: false,
    loadingMore: false,
    hasMore: true,
    page: 0,
    pageSize: 20
  },

  onLoad() {
    this.loadReminders();
  },

  onShow() {
    this.refreshData();
  },

  // 刷新数据
  async refreshData() {
    this.setData({
      page: 0,
      hasMore: true,
      reminders: [],
      todayReminders: [],
      upcomingReminders: []
    });
    await this.loadReminders();
  },

  // 加载提醒数据
  async loadReminders() {
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true });
      
      // 获取模拟数据（实际应用中从云数据库获取）
      const mockData = this.getMockReminders();
      
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // 分类提醒并添加倒计时
      const todayReminders = mockData.filter(item => {
        const reminderDate = item.date;
        return reminderDate === today && item.status !== 'completed';
      }).map(item => ({
        ...item,
        completed: item.status === 'completed'
      }));
      
      const upcomingReminders = mockData.filter(item => {
        return item.date > today && item.status !== 'completed';
      }).map(item => {
        const reminderTime = new Date(`${item.date} ${item.time}`);
        const timeDiff = reminderTime - now;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        return {
          ...item,
          countdown: daysLeft === 1 ? '明天' : `${daysLeft}天后`
        };
      });
      
      // 更新标签计数
      const updatedTabs = this.data.tabs.map((tab, index) => {
        let count = 0;
        switch(index) {
          case 0: count = todayReminders.length; break;
          case 1: count = upcomingReminders.length; break;
          case 2: count = mockData.length; break;
        }
        return { ...tab, count };
      });
      
      this.setData({
        reminders: mockData,
        todayReminders,
        upcomingReminders,
        tabs: updatedTabs,
        loading: false
      });
      
    } catch (error) {
      console.error('加载提醒失败:', error);
      this.setData({ loading: false });
      InteractionFeedback.showError('加载提醒数据失败');
    }
  },

  // 获取模拟提醒数据
  getMockReminders() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    
    return [
      {
        id: '1',
        title: '服用降压药',
        description: '每日早晨8点服用降压药',
        date: util.formatDate(today),
        time: '08:00',
        type: 'medicine',
        member: '张爸爸',
        status: 'pending',
        urgent: true
      },
      {
        id: '2',
        title: '血糖检测',
        description: '餐后2小时检测血糖',
        date: util.formatDate(today),
        time: '14:00',
        type: 'medical',
        member: '李妈妈',
        status: 'pending',
        urgent: false
      },
      {
        id: '3',
        title: '复查心脏彩超',
        description: '定期心脏检查',
        date: util.formatDate(tomorrow),
        time: '09:30',
        type: 'medical',
        member: '张爸爸',
        status: 'pending',
        urgent: false
      },
      {
        id: '4',
        title: '服用维生素',
        description: '每日补充维生素C',
        date: util.formatDate(dayAfter),
        time: '20:00',
        type: 'medicine',
        member: '小明',
        status: 'pending',
        urgent: false
      },
      {
        id: '5',
        title: '眼科检查',
        description: '已完成的检查项目',
        date: '2024-12-15',
        time: '10:00',
        type: 'medical',
        member: '小明',
        status: 'completed',
        urgent: false
      }
    ];
  },

  // 切换标签
  onTabChange(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      activeTab: index
    });
  },

  // 添加提醒
  onAddReminder() {
    wx.navigateTo({
      url: '/pages/reminder/add/add'
    });
  },

  // 提醒项点击
  onReminderTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/reminder/detail/detail?id=${id}`
    });
  },

  // 完成提醒
  async onCompleteReminder(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      InteractionFeedback.showLoading('正在标记完成...');
      
      // 更新提醒状态为已完成
      const updatedReminders = this.data.reminders.map(item => {
        if (item.id === id) {
          return { ...item, status: 'completed' };
        }
        return item;
      });
      
      this.setData({ reminders: updatedReminders });
      
      InteractionFeedback.hideLoading();
      InteractionFeedback.showSuccess('提醒已完成');
      
      // 重新分类数据
      await this.loadReminders();
      
    } catch (error) {
      InteractionFeedback.hideLoading();
      console.error('完成提醒失败:', error);
      InteractionFeedback.showError('操作失败，请重试');
    }
  },

  // 编辑提醒
  onEditReminder(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/reminder/add/add?id=${id}&mode=edit`
    });
  },

  // 延后提醒
  async onSnoozeReminder(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      const options = ['延后1小时', '延后2小时', '延后1天'];
      const result = await new Promise((resolve) => {
        wx.showActionSheet({
          itemList: options,
          success: (res) => resolve(res.tapIndex),
          fail: () => resolve(-1)
        });
      });
      
      if (result === -1) return;
      
      InteractionFeedback.showLoading('正在延后提醒...');
      
      // TODO: 实现延后逻辑
      
      InteractionFeedback.hideLoading();
      InteractionFeedback.showSuccess(`提醒已${options[result]}`);
      
    } catch (error) {
      InteractionFeedback.hideLoading();
      InteractionFeedback.showError('延后失败');
    }
  },

  // 提醒更多操作
  onReminderMoreActions(e) {
    const { id } = e.currentTarget.dataset;
    const reminder = this.data.reminders.find(item => item.id === id);
    
    if (!reminder) return;
    
    const actionList = ['查看详情', '编辑提醒'];
    
    if (reminder.status !== 'completed') {
      actionList.push('延后提醒');
      actionList.push('删除提醒');
    } else {
      actionList.push('删除提醒');
    }
    
    wx.showActionSheet({
      itemList: actionList,
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.onReminderTap({ currentTarget: { dataset: { id } } });
            break;
          case 1:
            this.onEditReminder({ currentTarget: { dataset: { id } } });
            break;
          case 2:
            if (reminder.status !== 'completed') {
              this.onSnoozeReminder({ currentTarget: { dataset: { id } } });
            } else {
              this.onDeleteReminder(id);
            }
            break;
          case 3:
            this.onDeleteReminder(id);
            break;
        }
      }
    });
  },

  // 删除提醒
  async onDeleteReminder(id) {
    try {
      const confirmed = await InteractionFeedback.showConfirm({
        title: '删除提醒',
        content: '确定要删除这条提醒吗？',
        confirmText: '删除',
        confirmColor: '#FF3B30'
      });
      
      if (!confirmed) return;
      
      InteractionFeedback.showLoading('正在删除...');
      
      // 从列表中移除
      const updatedReminders = this.data.reminders.filter(item => item.id !== id);
      this.setData({ reminders: updatedReminders });
      
      InteractionFeedback.hideLoading();
      InteractionFeedback.showSuccess('提醒已删除');
      
      // 重新分类数据
      await this.loadReminders();
      
    } catch (error) {
      InteractionFeedback.hideLoading();
      InteractionFeedback.showError('删除失败');
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.refreshData();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  async onReachBottom() {
    if (this.data.activeTab !== 2 || !this.data.hasMore || this.data.loadingMore) {
      return;
    }
    
    this.setData({ loadingMore: true });
    
    // 模拟加载更多
    setTimeout(() => {
      this.setData({ 
        loadingMore: false,
        hasMore: false // 模拟没有更多数据
      });
    }, 1000);
  }
}); 