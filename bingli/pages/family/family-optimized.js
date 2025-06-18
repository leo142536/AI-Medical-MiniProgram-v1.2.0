// pages/family/family-optimized.js - 现代化家庭成员管理逻辑
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    // 基础数据
    familyInfo: null,
    members: [],
    filteredMembers: [],
    recentMembers: [],
    
    // 搜索和筛选
    searchKeyword: '',
    activeFilter: 'all',
    
    // 健康统计数据
    healthStats: {
      totalRecords: 0,
      recordsChange: 0,
      activeReminders: 0,
      remindersChange: 0,
      checkups: 0,
      nextCheckup: 0,
      medicationCompliance: 0,
      medicationStatus: ''
    },
    
    // AI健康评分
    aiHealthScore: {
      score: 85,
      percentage: 85,
      level: 'good',
      levelText: '良好',
      description: '您的家庭健康状况整体良好，继续保持健康的生活方式。',
      suggestions: [
        '建议增加运动频率',
        '注意定期体检',
        '保持良好作息'
      ]
    },
    
    // 智能建议
    familySuggestions: [
      {
        id: 1,
        icon: '🏥',
        title: '体检提醒',
        description: '妈妈距离上次体检已超过6个月',
        actionText: '预约体检'
      },
      {
        id: 2,
        icon: '💊',
        title: '用药管理',
        description: '爸爸的血压药需要及时补充',
        actionText: '设置提醒'
      },
      {
        id: 3,
        icon: '🍎',
        title: '健康计划',
        description: '为家庭制定个性化健康计划',
        actionText: '立即制定'
      }
    ],
    
    // 家庭成就
    familyAchievements: [
      {
        id: 1,
        icon: '🏆',
        title: '健康达人',
        description: '连续30天记录健康数据',
        unlocked: true
      },
      {
        id: 2,
        icon: '👨‍👩‍👧‍👦',
        title: '家庭团结',
        description: '全家成员都加入应用',
        unlocked: true
      },
      {
        id: 3,
        icon: '💪',
        title: '运动先锋',
        description: '完成100次运动记录',
        unlocked: false,
        progress: 68,
        target: 100
      },
      {
        id: 4,
        icon: '🎯',
        title: '目标达成',
        description: '完成所有健康目标',
        unlocked: false,
        progress: 7,
        target: 10
      }
    ],
    
    // 界面状态
    loading: false,
    globalLoading: false,
    loadingText: '',
    loadingMembers: false,
    hasMoreMembers: false,
    showQuickMenu: false,
    
    // 统计数据
    unlockedAchievements: 2,
    totalAchievements: 4
  },

  onLoad(options) {
    this.initializePage()
    this.loadFamilyInfo()
    this.loadMembers()
    this.loadHealthStats()
    this.setupRealtimeUpdates()
  },

  onShow() {
    this.refreshData()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    this.loadMoreMembers()
  },

  // 初始化页面
  async initializePage() {
    try {
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: '我的家庭'
      })
      
      // 初始化筛选器
      this.applyMemberFilter()
      
      console.log('家庭页面初始化完成')
    } catch (error) {
      console.error('页面初始化失败:', error)
    }
  },

  // 加载家庭信息
  async loadFamilyInfo() {
    try {
      this.setData({ loading: true })
      
      const { data: familyData } = await db.collection('families')
        .where({ 
          $or: [
            { createdBy: app.globalData.userId },
            { 'members.userId': app.globalData.userId }
          ]
        })
        .get()
      
      if (familyData.length > 0) {
        const family = familyData[0]
        
        // 计算创建天数
        const createdDays = Math.floor((Date.now() - new Date(family.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        
        this.setData({
          familyInfo: {
            ...family,
            createdDays
          }
        })
        
        // 生成AI健康评分
        this.generateAIHealthScore()
      }
      
    } catch (error) {
      console.error('加载家庭信息失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载家庭成员
  async loadMembers() {
    try {
      this.setData({ loadingMembers: true })
      
      const { data: membersData } = await db.collection('family_members')
        .where({ familyId: this.data.familyInfo?._id })
        .orderBy('role', 'desc')
        .orderBy('createdAt', 'asc')
        .get()
      
      // 处理成员数据
      const processedMembers = await Promise.all(
        membersData.map(member => this.processMemberData(member))
      )
      
      // 获取最近活跃成员
      const recentMembers = processedMembers
        .filter(member => member.lastActiveTime)
        .sort((a, b) => new Date(b.lastActiveTime) - new Date(a.lastActiveTime))
        .slice(0, 4)
      
      this.setData({
        members: processedMembers,
        recentMembers
      })
      
      // 应用筛选
      this.applyMemberFilter()
      
    } catch (error) {
      console.error('加载家庭成员失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loadingMembers: false })
    }
  },

  // 处理成员数据
  async processMemberData(member) {
    try {
      // 计算年龄
      const age = this.calculateAge(member.birthday)
      
      // 获取健康摘要
      const healthSummary = await this.getMemberHealthSummary(member._id)
      
      // 获取AI健康提醒
      const aiAlerts = await this.getMemberAIAlerts(member._id)
      
      // 获取最近活动
      const recentActivities = await this.getMemberRecentActivities(member._id)
      
      // 判断在线状态（模拟）
      const isOnline = Math.random() > 0.7
      
      return {
        ...member,
        age,
        healthSummary,
        aiAlerts,
        recentActivities,
        isOnline,
        healthStatus: this.determineHealthStatus(healthSummary)
      }
    } catch (error) {
      console.error('处理成员数据失败:', error)
      return member
    }
  },

  // 计算年龄
  calculateAge(birthday) {
    if (!birthday) return 0
    
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  },

  // 获取成员健康摘要
  async getMemberHealthSummary(memberId) {
    try {
      // 获取最近的健康记录
      const { data: records } = await db.collection('medical_records')
        .where({ memberId, userId: app.globalData.userId })
        .orderBy('date', 'desc')
        .limit(10)
        .get()
      
      // 获取用药信息
      const { data: medications } = await db.collection('medications')
        .where({ memberId, userId: app.globalData.userId, isActive: true })
        .get()
      
      // 获取健康条件
      const { data: conditions } = await db.collection('health_conditions')
        .where({ memberId, userId: app.globalData.userId, isActive: true })
        .get()
      
      // 计算健康评分
      const score = this.calculateMemberHealthScore(records, medications, conditions)
      
      // 获取最后体检时间
      const lastCheckup = this.getLastCheckupTime(records)
      
      return {
        score,
        lastCheckup,
        medications: medications.length,
        conditions: conditions.length,
        recordsCount: records.length
      }
    } catch (error) {
      console.error('获取健康摘要失败:', error)
      return {
        score: 75,
        lastCheckup: '3个月前',
        medications: 0,
        conditions: 0,
        recordsCount: 0
      }
    }
  },

  // 计算成员健康评分
  calculateMemberHealthScore(records, medications, conditions) {
    let score = 80 // 基础分
    
    // 根据记录频率调整
    if (records.length === 0) score -= 20
    else if (records.length < 5) score -= 10
    else if (records.length > 10) score += 10
    
    // 根据用药情况调整
    if (medications.length > 3) score -= 5
    
    // 根据健康条件调整
    score -= conditions.length * 5
    
    // 根据最近就诊情况调整
    const recentRecord = records[0]
    if (recentRecord) {
      const daysSinceLastRecord = Math.floor((Date.now() - new Date(recentRecord.date).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceLastRecord > 90) score -= 10
      if (recentRecord.type === 'emergency') score -= 15
    }
    
    return Math.max(0, Math.min(100, score))
  },

  // 获取最后体检时间
  getLastCheckupTime(records) {
    const checkupRecord = records.find(record => record.type === 'checkup')
    if (checkupRecord) {
      const daysSince = Math.floor((Date.now() - new Date(checkupRecord.date).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince < 30) return `${daysSince}天前`
      if (daysSince < 365) return `${Math.floor(daysSince / 30)}个月前`
      return `${Math.floor(daysSince / 365)}年前`
    }
    return '未记录'
  },

  // 获取成员AI健康提醒
  async getMemberAIAlerts(memberId) {
    try {
      // 这里应该调用AI分析服务
      // 现在返回模拟数据
      const alerts = []
      
      // 随机生成一些提醒
      if (Math.random() > 0.7) {
        alerts.push({
          id: 1,
          level: 'medium',
          icon: '💊',
          message: '记得按时服药'
        })
      }
      
      if (Math.random() > 0.8) {
        alerts.push({
          id: 2,
          level: 'low',
          icon: '🏥',
          message: '建议进行体检'
        })
      }
      
      return alerts
    } catch (error) {
      console.error('获取AI提醒失败:', error)
      return []
    }
  },

  // 获取成员最近活动
  async getMemberRecentActivities(memberId) {
    try {
      const activities = []
      
      // 获取最近的医疗记录
      const { data: records } = await db.collection('medical_records')
        .where({ memberId, userId: app.globalData.userId })
        .orderBy('date', 'desc')
        .limit(3)
        .get()
      
      records.forEach(record => {
        const timeAgo = this.getTimeAgo(record.date)
        activities.push({
          id: record._id,
          type: 'medical',
          description: `在${record.hospital}就诊`,
          timeAgo
        })
      })
      
      // 获取最近的提醒
      const { data: reminders } = await db.collection('reminders')
        .where({ memberId, userId: app.globalData.userId, status: 'completed' })
        .orderBy('completedAt', 'desc')
        .limit(2)
        .get()
      
      reminders.forEach(reminder => {
        const timeAgo = this.getTimeAgo(reminder.completedAt)
        activities.push({
          id: reminder._id,
          type: 'reminder',
          description: `完成${reminder.title}`,
          timeAgo
        })
      })
      
      return activities.sort((a, b) => new Date(b.date || b.completedAt) - new Date(a.date || a.completedAt)).slice(0, 3)
    } catch (error) {
      console.error('获取成员活动失败:', error)
      return []
    }
  },

  // 获取时间差描述
  getTimeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffDays > 0) return `${diffDays}天前`
    if (diffHours > 0) return `${diffHours}小时前`
    if (diffMinutes > 0) return `${diffMinutes}分钟前`
    return '刚刚'
  },

  // 判断健康状态
  determineHealthStatus(healthSummary) {
    if (!healthSummary) return 'normal'
    
    const { score, conditions } = healthSummary
    
    if (score >= 80 && conditions === 0) return 'normal'
    if (score >= 60 && conditions <= 1) return 'attention'
    return 'concern'
  },

  // 加载健康统计数据
  async loadHealthStats() {
    try {
      // 获取本月病历记录数
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const { data: currentMonthRecords } = await db.collection('medical_records')
        .where({ 
          userId: app.globalData.userId,
          date: db.command.gte(startOfMonth.toISOString().split('T')[0])
        })
        .get()
      
      // 获取上月数据用于对比
      const lastMonth = new Date(startOfMonth)
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const { data: lastMonthRecords } = await db.collection('medical_records')
        .where({ 
          userId: app.globalData.userId,
          date: db.command.gte(lastMonth.toISOString().split('T')[0]).and(db.command.lt(startOfMonth.toISOString().split('T')[0]))
        })
        .get()
      
      // 获取活跃提醒数
      const { data: activeReminders } = await db.collection('reminders')
        .where({ 
          userId: app.globalData.userId,
          status: 'pending',
          isActive: true
        })
        .get()
      
      // 获取体检记录
      const { data: checkupRecords } = await db.collection('medical_records')
        .where({ 
          userId: app.globalData.userId,
          type: 'checkup',
          date: db.command.gte(startOfMonth.toISOString().split('T')[0])
        })
        .get()
      
      // 计算用药依从性
      const medicationCompliance = await this.calculateMedicationCompliance()
      
      this.setData({
        healthStats: {
          totalRecords: currentMonthRecords.length,
          recordsChange: currentMonthRecords.length - lastMonthRecords.length,
          activeReminders: activeReminders.length,
          remindersChange: 0, // 简化处理
          checkups: checkupRecords.length,
          nextCheckup: this.calculateNextCheckupDays(),
          medicationCompliance: medicationCompliance.percentage,
          medicationStatus: medicationCompliance.status
        }
      })
      
    } catch (error) {
      console.error('加载健康统计失败:', error)
    }
  },

  // 计算用药依从性
  async calculateMedicationCompliance() {
    try {
      // 获取最近30天的用药提醒
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: medicationReminders } = await db.collection('reminders')
        .where({ 
          userId: app.globalData.userId,
          type: 'medicine',
          date: db.command.gte(thirtyDaysAgo.toISOString().split('T')[0])
        })
        .get()
      
      if (medicationReminders.length === 0) {
        return { percentage: 0, status: '无用药记录' }
      }
      
      const completedCount = medicationReminders.filter(r => r.status === 'completed').length
      const percentage = Math.round((completedCount / medicationReminders.length) * 100)
      
      let status = '需要改善'
      if (percentage >= 90) status = '优秀'
      else if (percentage >= 80) status = '良好'
      else if (percentage >= 70) status = '一般'
      
      return { percentage, status }
    } catch (error) {
      console.error('计算用药依从性失败:', error)
      return { percentage: 0, status: '计算失败' }
    }
  },

  // 计算下次体检天数
  calculateNextCheckupDays() {
    // 简化处理，返回随机天数
    return Math.floor(Math.random() * 90) + 30
  },

  // 生成AI健康评分
  generateAIHealthScore() {
    const members = this.data.members
    if (members.length === 0) return
    
    // 计算家庭平均健康评分
    const totalScore = members.reduce((sum, member) => sum + (member.healthSummary?.score || 75), 0)
    const averageScore = Math.round(totalScore / members.length)
    
    // 确定健康等级
    let level = 'fair'
    let levelText = '一般'
    if (averageScore >= 90) {
      level = 'excellent'
      levelText = '优秀'
    } else if (averageScore >= 80) {
      level = 'good'
      levelText = '良好'
    } else if (averageScore >= 70) {
      level = 'fair'
      levelText = '一般'
    } else {
      level = 'poor'
      levelText = '需关注'
    }
    
    // 生成建议
    const suggestions = this.generateHealthSuggestions(members, averageScore)
    
    this.setData({
      aiHealthScore: {
        score: averageScore,
        percentage: averageScore,
        level,
        levelText,
        description: this.getHealthDescription(level, averageScore),
        suggestions
      }
    })
  },

  // 生成健康建议
  generateHealthSuggestions(members, averageScore) {
    const suggestions = []
    
    // 基于评分生成建议
    if (averageScore < 80) {
      suggestions.push('建议增加运动频率')
    }
    
    // 检查是否有成员需要体检
    const needCheckup = members.some(member => 
      member.healthSummary?.lastCheckup?.includes('个月') && 
      parseInt(member.healthSummary.lastCheckup) > 6
    )
    
    if (needCheckup) {
      suggestions.push('部分成员需要定期体检')
    }
    
    // 检查用药情况
    const highMedication = members.some(member => member.healthSummary?.medications > 3)
    if (highMedication) {
      suggestions.push('注意用药安全和依从性')
    }
    
    if (suggestions.length === 0) {
      suggestions.push('保持现有健康生活方式')
    }
    
    return suggestions.slice(0, 3)
  },

  // 获取健康描述
  getHealthDescription(level, score) {
    const descriptions = {
      excellent: '您的家庭健康状况非常优秀，请继续保持！',
      good: '您的家庭健康状况良好，继续保持健康的生活方式。',
      fair: '您的家庭健康状况一般，建议加强健康管理。',
      poor: '您的家庭健康状况需要关注，建议及时就医咨询。'
    }
    return descriptions[level] || '请关注家庭健康状况。'
  },

  // 设置实时更新
  setupRealtimeUpdates() {
    // 监听家庭成员变化
    if (this.data.familyInfo) {
      const watcher = db.collection('family_members')
        .where({ familyId: this.data.familyInfo._id })
        .watch({
          onChange: (snapshot) => {
            console.log('家庭成员数据更新')
            this.loadMembers()
          },
          onError: (error) => {
            console.error('实时监听失败:', error)
          }
        })
      
      // 保存监听器引用，用于页面销毁时取消监听
      this.memberWatcher = watcher
    }
  },

  // 搜索成员
  onSearchMembers(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.applyMemberFilter()
    }, 300)
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchKeyword: '' })
    this.applyMemberFilter()
  },

  // 筛选成员
  onFilterMembers(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ activeFilter: filter })
    this.applyMemberFilter()
  },

  // 应用成员筛选
  applyMemberFilter() {
    let filtered = [...this.data.members]
    
    // 应用搜索关键词
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(keyword) ||
        member.relation.toLowerCase().includes(keyword)
      )
    }
    
    // 应用分类筛选
    switch (this.data.activeFilter) {
      case 'adults':
        filtered = filtered.filter(member => member.age >= 18)
        break
      case 'children':
        filtered = filtered.filter(member => member.age < 18)
        break
      case 'elderly':
        filtered = filtered.filter(member => member.age >= 60)
        break
    }
    
    this.setData({ filteredMembers: filtered })
  },

  // 成员详情
  onMemberDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/family/member-detail/member-detail?id=${id}`
    })
  },

  // 长按成员卡片
  onMemberLongPress(e) {
    const id = e.currentTarget.dataset.id
    const member = this.data.members.find(m => m._id === id)
    
    wx.showActionSheet({
      itemList: ['查看详情', '编辑信息', '健康记录', '设置提醒', '通话联系'],
      success: (res) => {
        this.handleMemberAction(member, res.tapIndex)
      }
    })
  },

  // 处理成员操作
  handleMemberAction(member, actionIndex) {
    switch (actionIndex) {
      case 0: // 查看详情
        wx.navigateTo({
          url: `/pages/family/member-detail/member-detail?id=${member._id}`
        })
        break
      case 1: // 编辑信息
        wx.navigateTo({
          url: `/pages/family/add/add?id=${member._id}&mode=edit`
        })
        break
      case 2: // 健康记录
        wx.navigateTo({
          url: `/pages/record/record?memberId=${member._id}`
        })
        break
      case 3: // 设置提醒
        wx.navigateTo({
          url: `/pages/reminder/add/add?memberId=${member._id}`
        })
        break
      case 4: // 通话联系
        if (member.phone) {
          wx.makePhoneCall({
            phoneNumber: member.phone
          })
        }
        break
    }
  },

  // 快速操作
  onQuickAddRecord(e) {
    const member = e.currentTarget.dataset.member
    wx.navigateTo({
      url: `/pages/record/edit/edit?memberId=${member._id}&memberName=${member.name}`
    })
  },

  onQuickReminder(e) {
    const member = e.currentTarget.dataset.member
    wx.navigateTo({
      url: `/pages/reminder/add/add?memberId=${member._id}&memberName=${member.name}`
    })
  },

  onMemberCall(e) {
    const member = e.currentTarget.dataset.member
    if (member.phone) {
      wx.makePhoneCall({
        phoneNumber: member.phone
      })
    }
  },

  onMoreMemberActions(e) {
    const member = e.currentTarget.dataset.member
    this.handleMemberAction(member, 0) // 默认查看详情
  },

  onViewMemberHistory(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/family/member-history/member-history?id=${id}`
    })
  },

  // 应用建议
  onApplySuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion
    
    switch (suggestion.id) {
      case 1: // 体检提醒
        wx.navigateTo({
          url: '/pages/reminder/add/add?type=checkup'
        })
        break
      case 2: // 用药管理
        wx.navigateTo({
          url: '/pages/medication/medication'
        })
        break
      case 3: // 健康计划
        wx.navigateTo({
          url: '/pages/health-plan/health-plan'
        })
        break
    }
  },

  // 查看成就
  onViewAchievement(e) {
    const achievement = e.currentTarget.dataset.achievement
    wx.showModal({
      title: achievement.title,
      content: achievement.description,
      showCancel: false
    })
  },

  // 添加成员
  onAddMember() {
    if (!this.data.familyInfo) {
      wx.showToast({
        title: '请先创建家庭',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/family/add/add'
    })
  },

  // 批量管理
  onBulkManage() {
    wx.navigateTo({
      url: '/pages/family/bulk-manage/bulk-manage'
    })
  },

  // 家庭设置
  onFamilySettings() {
    wx.navigateTo({
      url: '/pages/family/settings/settings'
    })
  },

  // 家庭分享
  onFamilyShare() {
    wx.showActionSheet({
      itemList: ['邀请成员', '生成分享链接', '导出家庭报告'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.inviteMember()
            break
          case 1:
            this.generateShareLink()
            break
          case 2:
            this.exportFamilyReport()
            break
        }
      }
    })
  },

  // 家庭统计
  onFamilyStats() {
    wx.navigateTo({
      url: '/pages/family/stats/stats'
    })
  },

  // 创建家庭
  onCreateFamily() {
    wx.navigateTo({
      url: '/pages/family/create/create'
    })
  },

  // 加入家庭
  onJoinFamily() {
    wx.navigateTo({
      url: '/pages/family/join/join'
    })
  },

  // 显示快速菜单
  onShowQuickMenu() {
    this.setData({ showQuickMenu: true })
  },

  // 关闭快速菜单
  onCloseQuickMenu() {
    this.setData({ showQuickMenu: false })
  },

  // 快速菜单操作
  onQuickAddMember() {
    this.onCloseQuickMenu()
    this.onAddMember()
  },

  onQuickFamilyRecord() {
    this.onCloseQuickMenu()
    wx.navigateTo({
      url: '/pages/record/record'
    })
  },

  onQuickFamilyReport() {
    this.onCloseQuickMenu()
    wx.navigateTo({
      url: '/pages/family/report/report'
    })
  },

  onQuickEmergencyContacts() {
    this.onCloseQuickMenu()
    wx.navigateTo({
      url: '/pages/family/emergency/emergency'
    })
  },

  // 邀请成员
  async inviteMember() {
    try {
      const familyCode = this.generateFamilyCode()
      
      await wx.setClipboardData({
        data: familyCode
      })
      
      wx.showModal({
        title: '邀请家庭成员',
        content: `邀请码：${familyCode}\n已复制到剪贴板，请分享给家庭成员`,
        showCancel: false
      })
    } catch (error) {
      console.error('生成邀请码失败:', error)
    }
  },

  // 生成家庭邀请码
  generateFamilyCode() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `FAM${timestamp}${random}`.toUpperCase()
  },

  // 生成分享链接
  async generateShareLink() {
    try {
      this.setData({ 
        globalLoading: true,
        loadingText: '生成分享链接中...'
      })
      
      // 模拟生成分享链接
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const shareUrl = `https://app.example.com/family/${this.data.familyInfo._id}`
      
      await wx.setClipboardData({
        data: shareUrl
      })
      
      wx.showToast({
        title: '链接已复制',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('生成分享链接失败:', error)
      wx.showToast({
        title: '生成失败',
        icon: 'error'
      })
    } finally {
      this.setData({ globalLoading: false })
    }
  },

  // 导出家庭报告
  async exportFamilyReport() {
    try {
      this.setData({ 
        globalLoading: true,
        loadingText: '生成家庭健康报告中...'
      })
      
      // 模拟生成报告
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      wx.showToast({
        title: '报告生成完成',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('导出报告失败:', error)
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      })
    } finally {
      this.setData({ globalLoading: false })
    }
  },

  // 刷新数据
  async refreshData() {
    await Promise.all([
      this.loadFamilyInfo(),
      this.loadMembers(),
      this.loadHealthStats()
    ])
    wx.stopPullDownRefresh()
  },

  // 加载更多成员
  loadMoreMembers() {
    if (!this.data.hasMoreMembers || this.data.loadingMembers) return
    // 这里实现加载更多逻辑
  },

  // 获取角色文本
  getRoleText(role) {
    const roleMap = {
      'admin': '管理员',
      'member': '成员',
      'guest': '访客'
    }
    return roleMap[role] || '成员'
  },

  // 页面销毁时清理
  onUnload() {
    // 取消实时监听
    if (this.memberWatcher) {
      this.memberWatcher.close()
    }
    
    // 清除定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  }
}) 