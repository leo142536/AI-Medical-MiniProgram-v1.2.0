const util = require('../../utils/util');
const InteractionFeedback = require('../../utils/interaction-feedback');

Page({
  data: {
    familyInfo: null,
    members: [],
    isAdmin: false,
    loading: false,
    showFabMenu: false,
    monthlyRecords: 0,
    pendingReminders: 0
  },

  onLoad() {
    this.loadFamilyData();
  },

  onShow() {
    this.loadFamilyData();
  },

  // 加载家庭数据
  async loadFamilyData() {
    try {
      this.setData({ loading: true });
      
      const familyInfo = util.getStorage('familyInfo');
      const userInfo = util.getStorage('userInfo');
      
      if (!familyInfo) {
        // 使用模拟数据
        const mockFamilyData = this.getMockFamilyData();
        this.setData({
          familyInfo: mockFamilyData,
          members: mockFamilyData.members,
          isAdmin: true,
          monthlyRecords: 12,
          pendingReminders: 3
        });
        InteractionFeedback.showInfo('使用示例家庭数据');
        return;
      }

      // 检查当前用户是否为管理员
      const currentUserMember = familyInfo.members.find(
        member => member.name === userInfo.name
      );
      
      this.setData({
        familyInfo: familyInfo,
        members: familyInfo.members,
        isAdmin: currentUserMember && currentUserMember.role === 'admin',
        monthlyRecords: familyInfo.monthlyRecords || 0,
        pendingReminders: familyInfo.pendingReminders || 0
      });
    } catch (error) {
      console.error('加载家庭数据失败:', error);
      InteractionFeedback.showError('加载家庭数据失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 获取模拟家庭数据
  getMockFamilyData() {
    return {
      name: '幸福之家',
      members: [
        {
          id: '1',
          name: '张爸爸',
          relation: '自己',
          gender: 'male',
          birthday: '1980-05-15',
          avatar: '/images/default-avatar.png',
          role: 'admin',
          isOnline: true
        },
        {
          id: '2',
          name: '李妈妈',
          relation: '配偶',
          gender: 'female',
          birthday: '1982-08-20',
          avatar: '/images/default-avatar.png',
          role: 'member',
          isOnline: false
        },
        {
          id: '3',
          name: '小明',
          relation: '孩子',
          gender: 'male',
          birthday: '2010-03-10',
          avatar: '/images/default-avatar.png',
          role: 'member',
          isOnline: true
        }
      ],
      monthlyRecords: 12,
      pendingReminders: 3
    };
  },

  // 添加家庭成员
  onAddMember() {
    if (!this.data.isAdmin) {
      InteractionFeedback.showWarning('只有管理员才能添加成员');
      return;
    }
    
    this.setData({ showFabMenu: false });
    wx.navigateTo({
      url: '/pages/family/add/add'
    });
  },

  // 查看成员详情
  onMemberTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/family/detail/detail?id=${id}`
    });
  },

  // 编辑家庭信息
  onEditFamily() {
    if (!this.data.isAdmin) {
      InteractionFeedback.showWarning('只有管理员才能编辑家庭信息');
      return;
    }
    
    wx.navigateTo({
      url: '/pages/family/edit/edit'
    });
  },

  // 分享家庭
  onShareFamily() {
    // TODO: 实现家庭邀请功能
    InteractionFeedback.showInfo('家庭邀请功能正在开发中');
  },

  // 邀请成员
  onInviteMember() {
    if (!this.data.isAdmin) {
      InteractionFeedback.showWarning('只有管理员才能邀请成员');
      return;
    }
    
    this.setData({ showFabMenu: false });
    InteractionFeedback.showInfo('邀请功能正在开发中');
  },

  // 家庭设置
  onFamilySettings() {
    if (!this.data.isAdmin) {
      InteractionFeedback.showWarning('只有管理员才能修改设置');
      return;
    }
    
    this.setData({ showFabMenu: false });
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 显示/隐藏FAB菜单
  onShowFabMenu() {
    this.setData({
      showFabMenu: !this.data.showFabMenu
    });
  },

  // 查看成员病历记录
  onViewMemberRecords(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/record/record?memberId=${id}`
    });
  },

  // 查看成员健康提醒
  onViewMemberReminders(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/reminder/reminder?memberId=${id}`
    });
  },

  // 成员更多操作
  onMemberMoreActions(e) {
    const { id } = e.currentTarget.dataset;
    const member = this.data.members.find(m => m.id === id);
    
    if (!member) return;
    
    const actionList = ['查看详情', '查看病历', '查看提醒'];
    
    if (this.data.isAdmin && member.role !== 'admin') {
      actionList.push('编辑成员');
      actionList.push('移除成员');
    }
    
    wx.showActionSheet({
      itemList: actionList,
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.onMemberTap({ currentTarget: { dataset: { id } } });
            break;
          case 1:
            this.onViewMemberRecords({ currentTarget: { dataset: { id } } });
            break;
          case 2:
            this.onViewMemberReminders({ currentTarget: { dataset: { id } } });
            break;
          case 3:
            if (this.data.isAdmin) {
              this.onEditMember(id);
            }
            break;
          case 4:
            if (this.data.isAdmin) {
              this.onRemoveMember(id);
            }
            break;
        }
      }
    });
  },

  // 编辑成员
  onEditMember(id) {
    wx.navigateTo({
      url: `/pages/family/add/add?id=${id}&mode=edit`
    });
  },

  // 移除成员
  async onRemoveMember(id) {
    const member = this.data.members.find(m => m.id === id);
    if (!member) return;
    
    try {
      const confirmed = await InteractionFeedback.showConfirm({
        title: '移除成员',
        content: `确定要移除成员"${member.name}"吗？`,
        confirmText: '移除',
        confirmColor: '#FF3B30'
      });
      
      if (!confirmed) return;
      
      // TODO: 调用API移除成员
      const updatedMembers = this.data.members.filter(m => m.id !== id);
      this.setData({ 
        members: updatedMembers,
        'familyInfo.members': updatedMembers
      });
      
      InteractionFeedback.showSuccess('成员已移除');
    } catch (error) {
      console.error('移除成员失败:', error);
      InteractionFeedback.showError('移除成员失败');
    }
  },

  // 去登录
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadFamilyData();
    wx.stopPullDownRefresh();
  }
}); 