const util = require('../../utils/util');
const databaseService = require('../../services/database');

Page({
  data: {
    activeTab: 0,
    searchKeyword: '',
    recordList: [],
    filteredRecords: [],
    showFilterModal: false,
    filterOptions: {
      startDate: '',
      endDate: '',
      member: '',
      type: ''
    },
    familyMembers: [],
    loading: false,
    hasMore: true,
    page: 0,
    pageSize: 20
  },

  onLoad() {
    this.loadRecords();
    this.loadFamilyMembers();
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMoreRecords();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData();
  },

  // 刷新数据
  async refreshData() {
    this.setData({
      page: 0,
      hasMore: true,
      recordList: [],
      filteredRecords: []
    });
    await this.loadRecords();
    wx.stopPullDownRefresh();
  },

  // 加载病历数据
  async loadRecords() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const result = await databaseService.getRecords({
        limit: this.data.pageSize,
        skip: this.data.page * this.data.pageSize,
        keyword: this.data.searchKeyword,
        startDate: this.data.filterOptions.startDate,
        endDate: this.data.filterOptions.endDate,
        memberId: this.data.filterOptions.member
      });
      
      const newRecords = result.data || [];
      const allRecords = this.data.page === 0 ? newRecords : [...this.data.recordList, ...newRecords];
      
      this.setData({
        recordList: allRecords,
        filteredRecords: allRecords,
        hasMore: newRecords.length === this.data.pageSize,
        page: this.data.page + 1
      });
    } catch (error) {
      console.error('加载病历失败:', error);
      // 使用模拟数据作为后备
      const mockData = this.getMockData();
      this.setData({
        recordList: mockData,
        filteredRecords: mockData
      });
      util.showToast('加载数据失败，显示示例数据');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 获取模拟数据
  getMockData() {
    return [
      {
        _id: '1',
        title: '感冒就诊记录',
        date: '2024-12-18',
        time: '14:30',
        member: '张三',
        hospital: '中山医院',
        diagnosis: '急性上呼吸道感染',
        symptoms: '咳嗽、流鼻涕、轻微发热',
        treatment: '开具感冒药物，注意休息多喝水',
        cost: '168.50',
        images: []
      },
      {
        _id: '2',
        title: '定期体检',
        date: '2024-12-15',
        time: '09:00',
        member: '李四',
        hospital: '人民医院',
        diagnosis: '健康状况良好',
        symptoms: '无明显症状',
        treatment: '继续保持健康生活方式',
        cost: '350.00',
        images: []
      },
      {
        _id: '3',
        title: '牙科检查',
        date: '2024-12-10',
        time: '16:00',
        member: '王五',
        hospital: '口腔医院',
        diagnosis: '轻度蛀牙',
        symptoms: '偶尔牙痛',
        treatment: '补牙治疗，注意口腔卫生',
        cost: '120.00',
        images: []
      }
    ];
  },

  // 加载更多数据
  async loadMoreRecords() {
    if (!this.data.hasMore || this.data.loading) return;
    await this.loadRecords();
  },

  // 加载家庭成员
  async loadFamilyMembers() {
    try {
      const result = await databaseService.getFamilyMembers();
      this.setData({
        familyMembers: result.data || []
      });
    } catch (error) {
      console.error('加载家庭成员失败:', error);
      // 使用模拟数据
      this.setData({
        familyMembers: [
          { _id: '1', name: '张三', relation: 'self' },
          { _id: '2', name: '李四', relation: 'spouse' },
          { _id: '3', name: '王五', relation: 'child' }
        ]
      });
    }
  },

  // 标签页切换
  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    this.applyFilters();
  },

  // 搜索
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ 
      searchKeyword: keyword,
      page: 0
    });
    this.debounceSearch();
  },

  // 防抖搜索
  debounceSearch: util.debounce(function() {
    this.refreshData();
  }, 500),

  // 清空搜索
  onClearSearch() {
    this.setData({ 
      searchKeyword: '',
      page: 0
    });
    this.refreshData();
  },

  // 显示筛选
  onShowFilter() {
    this.setData({ showFilterModal: true });
  },

  // 关闭筛选
  onCloseFilter() {
    this.setData({ showFilterModal: false });
  },

  // 筛选选项改变
  onFilterChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`filterOptions.${field}`]: value
    });
  },

  // 应用筛选
  onApplyFilter() {
    this.setData({ 
      showFilterModal: false,
      page: 0
    });
    this.refreshData();
  },

  // 重置筛选
  onResetFilter() {
    this.setData({
      filterOptions: {
        startDate: '',
        endDate: '',
        member: '',
        type: ''
      },
      page: 0
    });
    this.refreshData();
  },

  // 应用筛选逻辑
  applyFilters() {
    let filtered = [...this.data.recordList];
    
    // 根据标签页筛选
    switch(this.data.activeTab) {
      case 0: // 全部
        break;
      case 1: // 最近
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 30);
        filtered = filtered.filter(record => 
          new Date(record.date) >= recentDate
        );
        break;
      case 2: // 重要
        filtered = filtered.filter(record => 
          record.important || record.diagnosis.includes('严重') || record.diagnosis.includes('重要')
        );
        break;
    }
    
    this.setData({ filteredRecords: filtered });
  },

  // 查看病历详情
  onViewRecord(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/record/detail/detail?id=${id}`
    });
  },

  // 编辑病历
  onEditRecord(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/record/edit/edit?id=${id}`
    });
  },

  // 删除病历
  async onDeleteRecord(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      const confirmed = await util.showConfirm('确定要删除这条病历记录吗？', '删除确认');
      if (!confirmed) return;
      
      util.showLoading('删除中...');
      await databaseService.deleteRecord(id);
      
      // 从列表中移除
      const recordList = this.data.recordList.filter(item => item._id !== id);
      const filteredRecords = this.data.filteredRecords.filter(item => item._id !== id);
      
      this.setData({
        recordList,
        filteredRecords
      });
      
      util.hideLoading();
      util.showToast('删除成功');
    } catch (error) {
      util.hideLoading();
      util.showToast('删除失败');
      console.error('删除病历失败:', error);
    }
  },

  // 添加新病历
  onAddRecord() {
    wx.navigateTo({
      url: '/pages/record/edit/edit'
    });
  },

  // 分享病历
  onShareRecord(e) {
    const { id } = e.currentTarget.dataset;
    const record = this.data.recordList.find(item => item._id === id);
    
    if (record) {
      wx.showActionSheet({
        itemList: ['分享给家人', '导出PDF', '生成图片'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              this.shareToFamily(record);
              break;
            case 1:
              this.exportToPDF(record);
              break;
            case 2:
              this.generateImage(record);
              break;
          }
        }
      });
    }
  },

  // 分享给家人
  shareToFamily(record) {
    // TODO: 实现分享功能
    util.showToast('分享功能开发中');
  },

  // 导出PDF
  exportToPDF(record) {
    // TODO: 实现PDF导出
    util.showToast('PDF导出功能开发中');
  },

  // 生成图片
  generateImage(record) {
    // TODO: 实现图片生成
    util.showToast('图片生成功能开发中');
  }
}); 