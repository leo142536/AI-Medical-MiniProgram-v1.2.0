// pages/record/record-optimized.js - 全面优化的病历管理逻辑
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    // 基础数据
    records: [],
    filteredRecords: [],
    totalRecords: 0,
    
    // 搜索相关
    searchKeyword: '',
    showSearchSuggestions: false,
    searchSuggestions: [
      { id: 1, keyword: '发烧', icon: '🌡️', count: 12 },
      { id: 2, keyword: '头痛', icon: '🤕', count: 8 },
      { id: 3, keyword: '体检', icon: '🏥', count: 5 },
      { id: 4, keyword: '疫苗', icon: '💉', count: 3 }
    ],
    
    // 筛选相关
    activeFilter: 'all',
    filterCounts: {
      all: 0,
      recent: 0,
      important: 0,
      emergency: 0,
      prescription: 0
    },
    
    // 高级筛选
    showAdvancedFilter: false,
    advancedFilter: {
      startDate: '',
      endDate: '',
      members: [],
      hospitals: [],
      types: [],
      maxCost: 10000,
      scoreRangeIndex: 0
    },
    
    // 视图模式
    viewMode: 'card', // card, timeline, calendar
    
    // AI功能
    showAIInsights: false,
    aiInsights: null,
    
    // 状态管理
    loading: false,
    globalLoading: false,
    loadingText: '',
    page: 0,
    hasMore: true,
    
    // 浮动菜单
    showFabMenu: false,
    
    // 家庭成员
    familyMembers: [],
    hospitalList: [],
    recordTypes: [
      { value: 'outpatient', label: '门诊', icon: '🏥' },
      { value: 'emergency', label: '急诊', icon: '🚨' },
      { value: 'inpatient', label: '住院', icon: '🏨' },
      { value: 'checkup', label: '体检', icon: '📋' },
      { value: 'vaccination', label: '疫苗', icon: '💉' },
      { value: 'dental', label: '牙科', icon: '🦷' }
    ],
    
    // 评分范围
    scoreRanges: [
      { label: '全部评分', min: 0, max: 100 },
      { label: '优秀 (90-100)', min: 90, max: 100 },
      { label: '良好 (70-89)', min: 70, max: 89 },
      { label: '一般 (50-69)', min: 50, max: 69 },
      { label: '需关注 (0-49)', min: 0, max: 49 }
    ],
    
    // 时间线数据
    timelineGroups: [],
    
    // 日历数据
    calendarTitle: '',
    calendarDays: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    selectedDate: '',
    selectedDateRecords: [],
    currentCalendarDate: new Date(),
    
    // 预览
    showPreviewModal: false,
    previewRecord: null,
    
    // 空状态配置
    emptyStateConfig: {
      title: '还没有病历记录',
      description: '开始记录您的健康历程，让AI为您提供智能分析和建议',
      suggestions: [
        { id: 1, title: '快速记录', icon: '⚡', action: 'quick' },
        { id: 2, title: '扫描处方', icon: '📷', action: 'scan' },
        { id: 3, title: '语音输入', icon: '🎤', action: 'voice' },
        { id: 4, title: '导入数据', icon: '📥', action: 'import' }
      ]
    }
  },

  onLoad(options) {
    this.initializePage()
    this.loadFamilyMembers()
    this.loadRecords()
    this.setupAIInsights()
  },

  onShow() {
    this.refreshData()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    this.loadMoreRecords()
  },

  // 初始化页面
  async initializePage() {
    try {
      // 获取用户偏好设置
      const viewMode = wx.getStorageSync('recordViewMode') || 'card'
      this.setData({ viewMode })
      
      // 初始化日历
      this.initializeCalendar()
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: '病历管理'
      })
      
      console.log('病历页面初始化完成')
    } catch (error) {
      console.error('页面初始化失败:', error)
    }
  },

  // 加载家庭成员
  async loadFamilyMembers() {
    try {
      const { data: members } = await db.collection('family_members')
        .where({ userId: app.globalData.userId })
        .get()
      
      // 添加默认医院列表
      const hospitals = ['市人民医院', '中医院', '儿童医院', '妇幼保健院', '社区卫生服务中心']
      
      this.setData({
        familyMembers: members,
        hospitalList: hospitals
      })
    } catch (error) {
      console.error('加载家庭成员失败:', error)
    }
  },

  // 加载病历记录
  async loadRecords(reset = false) {
    if (this.data.loading && !reset) return
    
    try {
      this.setData({ loading: true })
      
      const page = reset ? 0 : this.data.page
      const pageSize = 20
      
      const { data: records } = await db.collection('medical_records')
        .where({ userId: app.globalData.userId })
        .orderBy('date', 'desc')
        .orderBy('time', 'desc')
        .skip(page * pageSize)
        .limit(pageSize)
        .get()
      
      // 处理记录数据
      const processedRecords = records.map(record => this.processRecordData(record))
      
      const newRecords = reset ? processedRecords : [...this.data.records, ...processedRecords]
      
      this.setData({
        records: newRecords,
        page: page + 1,
        hasMore: records.length === pageSize,
        totalRecords: reset ? processedRecords.length : this.data.totalRecords + processedRecords.length
      })
      
      // 应用筛选
      this.applyFilters()
      
      // 更新统计数据
      this.updateFilterCounts()
      
      // 生成时间线数据
      this.generateTimelineData()
      
      // 更新日历数据
      this.updateCalendarData()
      
    } catch (error) {
      console.error('加载病历记录失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 处理记录数据
  processRecordData(record) {
    // 添加类型标签
    const typeMap = {
      'outpatient': { label: '门诊', priority: 'normal' },
      'emergency': { label: '急诊', priority: 'urgent' },
      'inpatient': { label: '住院', priority: 'important' },
      'checkup': { label: '体检', priority: 'normal' }
    }
    
    const typeInfo = typeMap[record.type] || { label: '门诊', priority: 'normal' }
    
    // 生成AI分析（模拟）
    const aiAnalysis = this.generateAIAnalysis(record)
    
    // 计算健康评分（模拟）
    const aiScore = this.calculateHealthScore(record)
    
    return {
      ...record,
      typeLabel: typeInfo.label,
      priority: typeInfo.priority,
      priorityLabel: this.getPriorityLabel(typeInfo.priority),
      aiAnalysis,
      aiScore,
      attachments: this.getAttachments(record)
    }
  },

  // 生成AI分析
  generateAIAnalysis(record) {
    const symptoms = record.symptoms || ''
    const diagnosis = record.diagnosis || ''
    
    const tags = []
    
    // 基于症状和诊断生成标签
    if (symptoms.includes('发烧') || diagnosis.includes('发热')) {
      tags.push('发热症状')
    }
    if (symptoms.includes('咳嗽') || diagnosis.includes('咳嗽')) {
      tags.push('呼吸道症状')
    }
    if (record.type === 'emergency') {
      tags.push('紧急就诊')
    }
    if (record.cost > 1000) {
      tags.push('高费用')
    }
    
    return {
      tags,
      summary: this.generateAISummary(record, tags)
    }
  },

  // 生成AI摘要
  generateAISummary(record, tags) {
    if (tags.includes('紧急就诊')) {
      return '本次为紧急就诊，建议密切关注病情变化'
    }
    if (tags.includes('发热症状')) {
      return '存在发热症状，建议注意休息和补充水分'
    }
    if (tags.includes('高费用')) {
      return '本次就诊费用较高，建议关注后续治疗成本'
    }
    return '常规就诊记录，建议按医嘱执行治疗方案'
  },

  // 计算健康评分
  calculateHealthScore(record) {
    let score = 80 // 基础分
    
    // 根据记录类型调整
    if (record.type === 'checkup') score += 10
    if (record.type === 'emergency') score -= 20
    
    // 根据症状严重程度调整
    const symptoms = record.symptoms || ''
    if (symptoms.includes('严重') || symptoms.includes('剧烈')) {
      score -= 15
    }
    
    // 根据费用调整
    if (record.cost > 2000) score -= 10
    
    return Math.max(0, Math.min(100, score))
  },

  // 获取优先级标签
  getPriorityLabel(priority) {
    const map = {
      'normal': '',
      'important': '重要',
      'urgent': '紧急',
      'emergency': '急诊'
    }
    return map[priority] || ''
  },

  // 获取附件信息
  getAttachments(record) {
    const attachments = []
    
    if (record.images && record.images.length > 0) {
      attachments.push({ type: 'images', count: record.images.length })
    }
    if (record.documents && record.documents.length > 0) {
      attachments.push({ type: 'documents', count: record.documents.length })
    }
    if (record.prescriptions && record.prescriptions.length > 0) {
      attachments.push({ type: 'prescriptions', count: record.prescriptions.length })
    }
    
    return attachments
  },

  // 搜索相关方法
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ 
      searchKeyword: keyword,
      showSearchSuggestions: keyword.length > 0
    })
    
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.performSearch(keyword)
    }, 300)
  },

  onSearchFocus() {
    if (this.data.searchKeyword) {
      this.setData({ showSearchSuggestions: true })
    }
  },

  onSearchBlur() {
    // 延迟隐藏，允许点击建议项
    setTimeout(() => {
      this.setData({ showSearchSuggestions: false })
    }, 200)
  },

  onClearSearch() {
    this.setData({ 
      searchKeyword: '',
      showSearchSuggestions: false
    })
    this.applyFilters()
  },

  onSelectSuggestion(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ 
      searchKeyword: keyword,
      showSearchSuggestions: false
    })
    this.performSearch(keyword)
  },

  onVoiceSearch() {
    wx.showToast({
      title: '语音搜索功能开发中',
      icon: 'none'
    })
  },

  onAISearch() {
    wx.showToast({
      title: 'AI智能搜索功能开发中',
      icon: 'none'
    })
  },

  // 执行搜索
  performSearch(keyword) {
    if (!keyword.trim()) {
      this.applyFilters()
      return
    }
    
    const filtered = this.data.records.filter(record => {
      return record.title.includes(keyword) ||
             record.hospital.includes(keyword) ||
             (record.symptoms && record.symptoms.includes(keyword)) ||
             (record.diagnosis && record.diagnosis.includes(keyword)) ||
             (record.treatment && record.treatment.includes(keyword))
    })
    
    this.setData({ filteredRecords: filtered })
  },

  // 快速筛选
  onQuickFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ activeFilter: filter })
    this.applyFilters()
  },

  // 应用筛选
  applyFilters() {
    let filtered = [...this.data.records]
    
    // 应用快速筛选
    switch (this.data.activeFilter) {
      case 'recent':
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 30)
        filtered = filtered.filter(record => new Date(record.date) >= recentDate)
        break
      case 'important':
        filtered = filtered.filter(record => record.priority === 'important' || record.priority === 'urgent')
        break
      case 'emergency':
        filtered = filtered.filter(record => record.type === 'emergency')
        break
      case 'prescription':
        filtered = filtered.filter(record => record.prescriptions && record.prescriptions.length > 0)
        break
    }
    
    // 应用搜索关键词
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(record => {
        return record.title.toLowerCase().includes(keyword) ||
               record.hospital.toLowerCase().includes(keyword) ||
               (record.symptoms && record.symptoms.toLowerCase().includes(keyword)) ||
               (record.diagnosis && record.diagnosis.toLowerCase().includes(keyword))
      })
    }
    
    // 应用高级筛选
    filtered = this.applyAdvancedFilters(filtered)
    
    this.setData({ filteredRecords: filtered })
  },

  // 应用高级筛选
  applyAdvancedFilters(records) {
    let filtered = [...records]
    const filter = this.data.advancedFilter
    
    // 日期范围筛选
    if (filter.startDate) {
      filtered = filtered.filter(record => record.date >= filter.startDate)
    }
    if (filter.endDate) {
      filtered = filtered.filter(record => record.date <= filter.endDate)
    }
    
    // 家庭成员筛选
    if (filter.members.length > 0) {
      filtered = filtered.filter(record => filter.members.includes(record.memberId))
    }
    
    // 医院筛选
    if (filter.hospitals.length > 0) {
      filtered = filtered.filter(record => filter.hospitals.includes(record.hospital))
    }
    
    // 记录类型筛选
    if (filter.types.length > 0) {
      filtered = filtered.filter(record => filter.types.includes(record.type))
    }
    
    // 费用筛选
    if (filter.maxCost < 10000) {
      filtered = filtered.filter(record => (record.cost || 0) <= filter.maxCost)
    }
    
    // AI评分筛选
    if (filter.scoreRangeIndex > 0) {
      const range = this.data.scoreRanges[filter.scoreRangeIndex]
      filtered = filtered.filter(record => {
        const score = record.aiScore || 0
        return score >= range.min && score <= range.max
      })
    }
    
    return filtered
  },

  // 更新筛选计数
  updateFilterCounts() {
    const records = this.data.records
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 30)
    
    this.setData({
      filterCounts: {
        all: records.length,
        recent: records.filter(r => new Date(r.date) >= recentDate).length,
        important: records.filter(r => r.priority === 'important' || r.priority === 'urgent').length,
        emergency: records.filter(r => r.type === 'emergency').length,
        prescription: records.filter(r => r.prescriptions && r.prescriptions.length > 0).length
      }
    })
  },

  // 视图切换
  onToggleView(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ viewMode: mode })
    
    // 保存用户偏好
    wx.setStorageSync('recordViewMode', mode)
    
    // 根据视图模式加载相应数据
    if (mode === 'timeline') {
      this.generateTimelineData()
    } else if (mode === 'calendar') {
      this.updateCalendarData()
    }
  },

  // 生成时间线数据
  generateTimelineData() {
    const records = this.data.filteredRecords
    const groups = {}
    
    records.forEach(record => {
      const date = record.date
      if (!groups[date]) {
        groups[date] = {
          date,
          records: []
        }
      }
      groups[date].records.push(record)
    })
    
    const timelineGroups = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
    
    this.setData({ timelineGroups })
  },

  // 初始化日历
  initializeCalendar() {
    const now = new Date()
    this.setData({ currentCalendarDate: now })
    this.updateCalendarData()
  },

  // 更新日历数据
  updateCalendarData() {
    const currentDate = this.data.currentCalendarDate
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // 设置标题
    const title = `${year}年${month + 1}月`
    
    // 生成日历网格
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const today = new Date()
    const todayStr = this.formatDate(today)
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dateStr = this.formatDate(date)
      const dayRecords = this.data.filteredRecords.filter(record => record.date === dateStr)
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: dateStr === todayStr,
        hasRecords: dayRecords.length > 0,
        records: dayRecords.slice(0, 3) // 最多显示3个指示器
      })
    }
    
    this.setData({
      calendarTitle: title,
      calendarDays: days
    })
  },

  // 日历导航
  onPrevMonth() {
    const currentDate = this.data.currentCalendarDate
    currentDate.setMonth(currentDate.getMonth() - 1)
    this.setData({ currentCalendarDate: currentDate })
    this.updateCalendarData()
  },

  onNextMonth() {
    const currentDate = this.data.currentCalendarDate
    currentDate.setMonth(currentDate.getMonth() + 1)
    this.setData({ currentCalendarDate: currentDate })
    this.updateCalendarData()
  },

  onSelectDate(e) {
    const date = e.currentTarget.dataset.date
    const records = this.data.filteredRecords.filter(record => record.date === date)
    
    this.setData({
      selectedDate: date,
      selectedDateRecords: records
    })
  },

  // 浮动菜单
  onToggleFab() {
    this.setData({ showFabMenu: !this.data.showFabMenu })
  },

  onQuickAddRecord() {
    this.setData({ showFabMenu: false })
    wx.navigateTo({
      url: '/pages/record/edit/edit?mode=quick'
    })
  },

  onScanPrescription() {
    this.setData({ showFabMenu: false })
    wx.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: (res) => {
        // 处理处方扫描
        this.processPrescriptionScan(res.tempFilePaths[0])
      }
    })
  },

  onVoiceRecord() {
    this.setData({ showFabMenu: false })
    wx.showToast({
      title: '语音记录功能开发中',
      icon: 'none'
    })
  },

  onImportRecord() {
    this.setData({ showFabMenu: false })
    wx.showToast({
      title: '导入功能开发中',
      icon: 'none'
    })
  },

  // 处理处方扫描
  async processPrescriptionScan(imagePath) {
    try {
      this.setData({ 
        globalLoading: true,
        loadingText: 'AI识别处方中...'
      })
      
      // 这里应该调用AI识别API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      wx.showToast({
        title: '识别完成',
        icon: 'success'
      })
      
      // 跳转到编辑页面
      wx.navigateTo({
        url: '/pages/record/edit/edit?mode=prescription&image=' + encodeURIComponent(imagePath)
      })
      
    } catch (error) {
      console.error('处方识别失败:', error)
      wx.showToast({
        title: '识别失败',
        icon: 'error'
      })
    } finally {
      this.setData({ globalLoading: false })
    }
  },

  // 记录操作
  onViewRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/record/detail/detail?id=${id}`
    })
  },

  onLongPressRecord(e) {
    const id = e.currentTarget.dataset.id
    const record = this.data.filteredRecords.find(r => r._id === id)
    
    this.setData({
      showPreviewModal: true,
      previewRecord: record
    })
  },

  onQuickEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/record/edit/edit?id=${id}&mode=quick`
    })
  },

  onQuickShare(e) {
    const id = e.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: ['分享给家庭成员', '生成分享链接', '导出PDF'],
      success: (res) => {
        this.handleShareAction(id, res.tapIndex)
      }
    })
  },

  onMoreActions(e) {
    const id = e.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: ['编辑', '复制', '删除', '设为重要', '添加提醒'],
      success: (res) => {
        this.handleMoreAction(id, res.tapIndex)
      }
    })
  },

  // 处理分享操作
  handleShareAction(recordId, actionIndex) {
    switch (actionIndex) {
      case 0: // 分享给家庭成员
        this.shareToFamily(recordId)
        break
      case 1: // 生成分享链接
        this.generateShareLink(recordId)
        break
      case 2: // 导出PDF
        this.exportToPDF(recordId)
        break
    }
  },

  // 处理更多操作
  handleMoreAction(recordId, actionIndex) {
    switch (actionIndex) {
      case 0: // 编辑
        wx.navigateTo({
          url: `/pages/record/edit/edit?id=${recordId}`
        })
        break
      case 1: // 复制
        this.copyRecord(recordId)
        break
      case 2: // 删除
        this.deleteRecord(recordId)
        break
      case 3: // 设为重要
        this.toggleImportant(recordId)
        break
      case 4: // 添加提醒
        this.addReminder(recordId)
        break
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({ page: 0 })
    await this.loadRecords(true)
    
    // 重新生成AI洞察
    this.generateAIInsights()
  },

  // 加载更多
  loadMoreRecords() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadRecords()
  },

  // 设置AI洞察
  setupAIInsights() {
    // 检查是否显示AI洞察
    const showAI = wx.getStorageSync('showAIInsights') !== false
    this.setData({ showAIInsights: showAI })
    
    if (showAI) {
      this.generateAIInsights()
    }
  },

  // 生成AI洞察
  generateAIInsights() {
    const records = this.data.records
    if (records.length === 0) return
    
    // 分析最近的就诊模式
    const recentRecords = records.slice(0, 10)
    const commonSymptoms = this.analyzeCommonSymptoms(recentRecords)
    const healthTrend = this.analyzeHealthTrend(recentRecords)
    
    const insights = {
      summary: this.generateInsightsSummary(commonSymptoms, healthTrend),
      tags: [...commonSymptoms.slice(0, 3), healthTrend]
    }
    
    this.setData({ aiInsights: insights })
  },

  // 分析常见症状
  analyzeCommonSymptoms(records) {
    const symptoms = {}
    
    records.forEach(record => {
      if (record.symptoms) {
        const words = record.symptoms.split(/[，,、\s]+/)
        words.forEach(word => {
          if (word.length > 1) {
            symptoms[word] = (symptoms[word] || 0) + 1
          }
        })
      }
    })
    
    return Object.entries(symptoms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom]) => symptom)
  },

  // 分析健康趋势
  analyzeHealthTrend(records) {
    const emergencyCount = records.filter(r => r.type === 'emergency').length
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0)
    
    if (emergencyCount > 2) return '急诊频繁'
    if (totalCost > 5000) return '医疗费用较高'
    if (records.length > 8) return '就诊频繁'
    return '健康状况稳定'
  },

  // 生成洞察摘要
  generateInsightsSummary(symptoms, trend) {
    if (symptoms.length > 0) {
      return `最近常见症状包括${symptoms.slice(0, 2).join('、')}等，${trend}。建议关注身体状况变化。`
    }
    return `健康状况${trend}，建议保持良好的生活习惯。`
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 其他辅助方法...
  onAddRecord() {
    wx.navigateTo({
      url: '/pages/record/edit/edit'
    })
  },

  onShowStats() {
    wx.navigateTo({
      url: '/pages/record/stats/stats'
    })
  },

  onShowSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  onShowAdvancedFilter() {
    this.setData({ showAdvancedFilter: true })
  },

  onCloseAdvancedFilter() {
    this.setData({ showAdvancedFilter: false })
  },

  onCloseInsights() {
    this.setData({ showAIInsights: false })
    wx.setStorageSync('showAIInsights', false)
  },

  onViewMoreInsights() {
    wx.navigateTo({
      url: '/pages/record/insights/insights'
    })
  },

  onClosePreview() {
    this.setData({ showPreviewModal: false, previewRecord: null })
  },

  onEditFromPreview() {
    const id = this.data.previewRecord._id
    this.onClosePreview()
    wx.navigateTo({
      url: `/pages/record/edit/edit?id=${id}`
    })
  },

  onViewFromPreview() {
    const id = this.data.previewRecord._id
    this.onClosePreview()
    wx.navigateTo({
      url: `/pages/record/detail/detail?id=${id}`
    })
  }
}) 