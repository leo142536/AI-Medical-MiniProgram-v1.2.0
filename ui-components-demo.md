# 🎨 UI组件优化示例 - 具体实施方案

这些优化方案专门针对医疗健康类小程序的特点，考虑了用户群体的使用习惯，提供了更好的视觉层次、交互反馈和用户体验。

## 1. 🏠 首页快捷操作优化

### 优化前 vs 优化后对比

#### 当前版本问题
- 图标显示不一致（emoji vs 图片）
- 交互反馈单一
- 信息层级不清晰

#### 优化后的实现

```wxml
<!-- 优化后的快捷操作区域 -->
<view class="quick-actions-enhanced">
  <view class="action-grid">
    <!-- 主要操作 - 添加病历 -->
    <view 
      class="action-item primary" 
      bindtap="onAddRecord"
      data-action="add-record"
    >
      <view class="action-icon-wrapper">
        <view class="action-icon">📋</view>
        <view class="icon-badge" wx:if="{{hasUrgentRecord}}"></view>
      </view>
      <view class="action-content">
        <text class="action-title">添加病历</text>
        <text class="action-subtitle">记录就诊信息</text>
      </view>
      <view class="action-arrow">→</view>
    </view>

    <!-- 次要操作 - 健康提醒 -->
    <view 
      class="action-item secondary" 
      bindtap="onViewReminders"
      data-action="reminders"
    >
      <view class="action-icon-wrapper">
        <view class="action-icon">⏰</view>
        <view class="notification-dot" wx:if="{{todayReminders > 0}}">
          <text class="dot-text">{{todayReminders}}</text>
        </view>
      </view>
      <view class="action-content">
        <text class="action-title">健康提醒</text>
        <text class="action-subtitle">{{todayReminders}}个待办事项</text>
      </view>
    </view>

    <!-- 三级操作 - 家庭管理 -->
    <view 
      class="action-item tertiary" 
      bindtap="onFamilyManage"
      data-action="family"
    >
      <view class="action-icon-wrapper">
        <view class="action-icon">👨‍👩‍👧‍👦</view>
      </view>
      <view class="action-content">
        <text class="action-title">家庭管理</text>
        <text class="action-subtitle">{{familyCount}}位成员</text>
      </view>
    </view>
  </view>
</view>
```

```scss
// 优化后的样式
.quick-actions-enhanced {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 24rpx;
  margin: var(--spacing-lg);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

  .action-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .action-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-lg);
    border-radius: 16rpx;
    background: white;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    position: relative;
    overflow: hidden;

    // 微妙的背景动画
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.5s;
    }

    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
      
      &::before {
        left: 100%;
      }
    }

    // 主要操作样式
    &.primary {
      background: linear-gradient(135deg, #07C160 0%, #029E4A 100%);
      color: white;
      box-shadow: 0 6rpx 24rpx rgba(7, 193, 96, 0.3);

      .action-title {
        color: white;
        font-weight: 600;
      }

      .action-subtitle {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    // 次要操作样式
    &.secondary {
      border: 2rpx solid #e9ecef;
      
      .action-icon-wrapper {
        background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
        
        .action-icon {
          color: white;
        }
      }
    }

    // 三级操作样式
    &.tertiary {
      border: 2rpx solid #f0f0f0;
      
      .action-icon-wrapper {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }
    }
  }

  .action-icon-wrapper {
    position: relative;
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--spacing-lg);
    background: white;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .action-icon {
      font-size: 36rpx;
    }

    // 通知徽章
    .notification-dot {
      position: absolute;
      top: -8rpx;
      right: -8rpx;
      min-width: 32rpx;
      height: 32rpx;
      background: #ff4757;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3rpx solid white;

      .dot-text {
        font-size: 20rpx;
        color: white;
        font-weight: 600;
      }
    }

    // 紧急标识
    .icon-badge {
      position: absolute;
      top: -4rpx;
      right: -4rpx;
      width: 16rpx;
      height: 16rpx;
      background: #ff4757;
      border-radius: 50%;
      border: 2rpx solid white;
    }
  }

  .action-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .action-title {
      font-size: 32rpx;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .action-subtitle {
      font-size: 26rpx;
      color: var(--text-tertiary);
      line-height: 1.4;
    }
  }

  .action-arrow {
    font-size: 24rpx;
    color: var(--text-quaternary);
    opacity: 0.6;
    transition: all 0.3s ease;
  }

  .action-item:active .action-arrow {
    opacity: 1;
    transform: translateX(4rpx);
  }
}
```

## 2. 📋 病历卡片组件优化

### 智能病历卡片

```wxml
<!-- 优化后的病历卡片 -->
<view class="record-card-enhanced" data-id="{{record.id}}" bindtap="onViewRecord">
  <!-- 卡片状态指示器 -->
  <view class="card-status-bar {{record.priority}}"></view>
  
  <!-- 卡片头部 -->
  <view class="card-header">
    <view class="member-section">
      <image 
        class="member-avatar" 
        src="{{record.memberAvatar}}" 
        lazy-load
        mode="aspectFill"
      />
      <view class="member-info">
        <text class="member-name">{{record.memberName}}</text>
        <text class="member-relation">{{record.memberRelation}}</text>
      </view>
    </view>
    
    <view class="record-meta">
      <text class="record-date">{{record.formattedDate}}</text>
      <view class="priority-indicator {{record.priority}}" wx:if="{{record.priority !== 'normal'}}">
        <text class="priority-text">{{record.priorityText}}</text>
      </view>
    </view>
  </view>

  <!-- 医疗信息 -->
  <view class="medical-section">
    <view class="hospital-info">
      <view class="hospital-main">
        <text class="hospital-icon">🏥</text>
        <text class="hospital-name">{{record.hospital}}</text>
      </view>
      <text class="department" wx:if="{{record.department}}">{{record.department}}</text>
    </view>
    
    <text class="diagnosis" wx:if="{{record.diagnosis}}">
      {{record.diagnosis}}
    </text>
  </view>

  <!-- 关键信息标签 -->
  <view class="info-tags" wx:if="{{record.tags && record.tags.length > 0}}">
    <text 
      class="info-tag {{tag.type}}"
      wx:for="{{record.tags}}"
      wx:for-item="tag"
      wx:key="id"
    >{{tag.label}}</text>
  </view>

  <!-- 卡片底部操作 -->
  <view class="card-footer">
    <view class="record-stats">
      <text class="stat-item" wx:if="{{record.cost}}">
        <text class="stat-icon">💰</text>
        <text class="stat-value">¥{{record.cost}}</text>
      </text>
      <text class="stat-item" wx:if="{{record.imageCount > 0}}">
        <text class="stat-icon">📷</text>
        <text class="stat-value">{{record.imageCount}}张</text>
      </text>
      <text class="stat-item" wx:if="{{record.prescriptionCount > 0}}">
        <text class="stat-icon">💊</text>
        <text class="stat-value">{{record.prescriptionCount}}个处方</text>
      </text>
    </view>
    
    <view class="quick-actions">
      <button 
        class="action-btn secondary" 
        catchtap="onEditRecord" 
        data-id="{{record.id}}"
      >
        <text class="btn-icon">✏️</text>
      </button>
      <button 
        class="action-btn secondary" 
        catchtap="onShareRecord" 
        data-id="{{record.id}}"
      >
        <text class="btn-icon">📤</text>
      </button>
      <button 
        class="action-btn primary" 
        catchtap="onViewRecord" 
        data-id="{{record.id}}"
      >
        <text class="btn-text">查看详情</text>
      </button>
    </view>
  </view>
</view>
```

```scss
.record-card-enhanced {
  position: relative;
  background: white;
  border-radius: 20rpx;
  margin: var(--spacing-md) var(--spacing-lg);
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  &:active {
    transform: translateY(-2rpx) scale(0.995);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  }

  // 状态指示条
  .card-status-bar {
    height: 6rpx;
    width: 100%;
    
    &.high {
      background: linear-gradient(90deg, #ff4757 0%, #ff6b7a 100%);
    }
    
    &.medium {
      background: linear-gradient(90deg, #ffa502 0%, #ffb627 100%);
    }
    
    &.normal {
      background: linear-gradient(90deg, #07c160 0%, #33d174 100%);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);

    .member-section {
      display: flex;
      align-items: center;
      flex: 1;

      .member-avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 32rpx;
        margin-right: var(--spacing-md);
        border: 3rpx solid #f0f0f0;
      }

      .member-info {
        display: flex;
        flex-direction: column;
        gap: 4rpx;

        .member-name {
          font-size: 30rpx;
          font-weight: 600;
          color: var(--text-primary);
        }

        .member-relation {
          font-size: 24rpx;
          color: var(--text-tertiary);
          background: #f8f9fa;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
          align-self: flex-start;
        }
      }
    }

    .record-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8rpx;

      .record-date {
        font-size: 26rpx;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .priority-indicator {
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        font-size: 22rpx;
        font-weight: 500;

        &.high {
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
        }

        &.medium {
          background: rgba(255, 165, 2, 0.1);
          color: #ffa502;
        }
      }
    }
  }

  .medical-section {
    padding: 0 var(--spacing-lg) var(--spacing-md);

    .hospital-info {
      margin-bottom: var(--spacing-sm);

      .hospital-main {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: 8rpx;

        .hospital-icon {
          font-size: 28rpx;
        }

        .hospital-name {
          font-size: 28rpx;
          font-weight: 500;
          color: var(--text-primary);
        }
      }

      .department {
        font-size: 24rpx;
        color: var(--text-tertiary);
        margin-left: 40rpx;
      }
    }

    .diagnosis {
      font-size: 26rpx;
      color: var(--text-secondary);
      line-height: 1.5;
      background: #f8f9fa;
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: 12rpx;
      border-left: 4rpx solid #07c160;
    }
  }

  .info-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-lg) var(--spacing-md);

    .info-tag {
      padding: 6rpx 12rpx;
      border-radius: 16rpx;
      font-size: 22rpx;
      font-weight: 500;

      &.symptom {
        background: rgba(255, 107, 122, 0.1);
        color: #ff6b7a;
      }

      &.treatment {
        background: rgba(7, 193, 96, 0.1);
        color: #07c160;
      }

      &.medicine {
        background: rgba(74, 144, 226, 0.1);
        color: #4a90e2;
      }

      &.followup {
        background: rgba(255, 165, 2, 0.1);
        color: #ffa502;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
    border-top: 1rpx solid #f0f0f0;

    .record-stats {
      display: flex;
      gap: var(--spacing-md);

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6rpx;
        font-size: 24rpx;
        color: var(--text-tertiary);

        .stat-icon {
          font-size: 20rpx;
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: var(--spacing-sm);

      .action-btn {
        height: 56rpx;
        border-radius: 28rpx;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        font-size: 24rpx;

        &.secondary {
          width: 56rpx;
          background: #f8f9fa;
          color: var(--text-secondary);

          &:active {
            background: #e9ecef;
            transform: scale(0.95);
          }

          .btn-icon {
            font-size: 28rpx;
          }
        }

        &.primary {
          padding: 0 var(--spacing-md);
          background: var(--color-primary);
          color: white;
          font-weight: 500;

          &:active {
            background: var(--color-primary-dark);
            transform: scale(0.95);
          }
        }
      }
    }
  }
}
```

## 3. 🔍 智能搜索组件

```wxml
<!-- 智能搜索栏 -->
<view class="smart-search-container">
  <view class="search-bar {{searchFocused ? 'focused' : ''}}">
    <view class="search-icon">
      <text class="icon">🔍</text>
    </view>
    
    <input 
      class="search-input"
      placeholder="{{searchPlaceholder}}"
      value="{{searchKeyword}}"
      bindinput="onSearchInput"
      bindfocus="onSearchFocus"
      bindblur="onSearchBlur"
      bindconfirm="onSearchConfirm"
    />
    
    <view class="search-actions" wx:if="{{searchKeyword}}">
      <button class="clear-btn" bindtap="onClearSearch">
        <text class="clear-icon">×</text>
      </button>
    </view>
    
    <view class="search-actions" wx:else>
      <button class="voice-btn" bindtap="onVoiceSearch">
        <text class="voice-icon">🎤</text>
      </button>
    </view>
  </view>

  <!-- 搜索建议 -->
  <view class="search-suggestions" wx:if="{{searchFocused && suggestions.length > 0}}">
    <view class="suggestions-header">
      <text class="suggestions-title">搜索建议</text>
    </view>
    <scroll-view class="suggestions-list" scroll-y>
      <view 
        class="suggestion-item"
        wx:for="{{suggestions}}"
        wx:key="id"
        data-keyword="{{item.keyword}}"
        bindtap="onSelectSuggestion"
      >
        <view class="suggestion-icon">{{item.icon}}</view>
        <view class="suggestion-content">
          <text class="suggestion-text">{{item.text}}</text>
          <text class="suggestion-desc" wx:if="{{item.desc}}">{{item.desc}}</text>
        </view>
        <view class="suggestion-arrow">→</view>
      </view>
    </scroll-view>
  </view>

  <!-- 快捷筛选标签 -->
  <scroll-view 
    class="filter-tags" 
    scroll-x 
    wx:if="{{filterTags.length > 0}}"
    show-scrollbar="{{false}}"
  >
    <view class="tags-container">
      <view 
        class="filter-tag {{tag.active ? 'active' : ''}}"
        wx:for="{{filterTags}}"
        wx:key="id"
        data-id="{{item.id}}"
        bindtap="onToggleTag"
      >
        <text class="tag-text">{{item.label}}</text>
        <view class="tag-count" wx:if="{{item.count > 0}}">
          <text class="count-text">{{item.count}}</text>
        </view>
      </view>
    </view>
  </scroll-view>
</view>
```

```scss
.smart-search-container {
  position: relative;
  z-index: 100;

  .search-bar {
    display: flex;
    align-items: center;
    height: 72rpx;
    background: #f8f9fa;
    border-radius: 36rpx;
    margin: var(--spacing-lg);
    padding: 0 var(--spacing-md);
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    border: 2rpx solid transparent;

    &.focused {
      background: white;
      border-color: var(--color-primary);
      box-shadow: 0 4rpx 20rpx rgba(7, 193, 96, 0.15);
      transform: translateY(-2rpx);
    }

    .search-icon {
      margin-right: var(--spacing-sm);
      
      .icon {
        font-size: 28rpx;
        color: var(--text-tertiary);
      }
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: var(--text-primary);
      
      &::placeholder {
        color: var(--text-quaternary);
      }
    }

    .search-actions {
      margin-left: var(--spacing-sm);

      .clear-btn, .voice-btn {
        width: 48rpx;
        height: 48rpx;
        border-radius: 24rpx;
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:active {
          background: rgba(0, 0, 0, 0.05);
          transform: scale(0.9);
        }

        .clear-icon {
          font-size: 32rpx;
          color: var(--text-tertiary);
          font-weight: 300;
        }

        .voice-icon {
          font-size: 24rpx;
        }
      }
    }
  }

  .search-suggestions {
    position: absolute;
    top: 100%;
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    background: white;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
    max-height: 400rpx;
    overflow: hidden;
    z-index: 1000;

    .suggestions-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1rpx solid #f0f0f0;

      .suggestions-title {
        font-size: 26rpx;
        color: var(--text-tertiary);
        font-weight: 500;
      }
    }

    .suggestions-list {
      max-height: 320rpx;

      .suggestion-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-md) var(--spacing-lg);
        transition: background 0.2s ease;

        &:active {
          background: #f8f9fa;
        }

        .suggestion-icon {
          font-size: 28rpx;
          margin-right: var(--spacing-md);
        }

        .suggestion-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4rpx;

          .suggestion-text {
            font-size: 28rpx;
            color: var(--text-primary);
          }

          .suggestion-desc {
            font-size: 24rpx;
            color: var(--text-tertiary);
          }
        }

        .suggestion-arrow {
          font-size: 24rpx;
          color: var(--text-quaternary);
          opacity: 0.6;
        }
      }
    }
  }

  .filter-tags {
    padding: var(--spacing-sm) 0;
    white-space: nowrap;

    .tags-container {
      display: inline-flex;
      gap: var(--spacing-sm);
      padding: 0 var(--spacing-lg);

      .filter-tag {
        display: inline-flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        background: white;
        border: 2rpx solid #e9ecef;
        border-radius: 20rpx;
        font-size: 26rpx;
        color: var(--text-secondary);
        transition: all 0.2s ease;
        white-space: nowrap;

        &:active {
          transform: scale(0.95);
        }

        &.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
          box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
        }

        .tag-text {
          font-weight: 500;
        }

        .tag-count {
          margin-left: var(--spacing-xs);
          background: rgba(0, 0, 0, 0.1);
          border-radius: 12rpx;
          min-width: 24rpx;
          height: 24rpx;
          display: flex;
          align-items: center;
          justify-content: center;

          .count-text {
            font-size: 20rpx;
            font-weight: 600;
          }
        }

        &.active .tag-count {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}
```

## 4. 📱 交互反馈系统

```javascript
// 统一的交互反馈管理器
class InteractionFeedback {
  constructor() {
    this.hapticEnabled = true;
    this.soundEnabled = true;
    this.init();
  }

  init() {
    // 检查设备支持
    wx.getSystemInfo({
      success: (res) => {
        this.platform = res.platform;
        this.version = res.version;
      }
    });
  }

  // 轻触反馈
  light() {
    if (this.hapticEnabled) {
      wx.vibrateShort({
        type: 'light'
      });
    }
  }

  // 中等反馈
  medium() {
    if (this.hapticEnabled) {
      wx.vibrateShort({
        type: 'medium'
      });
    }
  }

  // 重触反馈
  heavy() {
    if (this.hapticEnabled) {
      wx.vibrateShort({
        type: 'heavy'
      });
    }
  }

  // 成功反馈
  success(message, options = {}) {
    this.light();
    
    wx.showToast({
      title: message,
      icon: 'success',
      duration: options.duration || 2000,
      mask: options.mask || false
    });
  }

  // 错误反馈
  error(message, options = {}) {
    this.heavy();
    
    wx.showToast({
      title: message,
      icon: 'error',
      duration: options.duration || 3000,
      mask: options.mask || false
    });
  }

  // 加载反馈
  loading(message = '加载中...', options = {}) {
    wx.showLoading({
      title: message,
      mask: options.mask !== false
    });
  }

  // 隐藏加载
  hideLoading() {
    wx.hideLoading();
  }

  // 确认对话框
  async confirm(options) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || '确认操作',
        content: options.content,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        confirmColor: options.confirmColor || '#07C160',
        cancelColor: options.cancelColor || '#666666',
        success: (res) => {
          if (res.confirm) {
            this.light();
          }
          resolve(res.confirm);
        }
      });
    });
  }

  // 操作菜单
  async actionSheet(options) {
    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList: options.items,
        itemColor: options.itemColor || '#333333',
        success: (res) => {
          this.light();
          resolve(res.tapIndex);
        },
        fail: () => {
          resolve(-1);
        }
      });
    });
  }

  // 自定义提示
  toast(message, type = 'none', duration = 2000) {
    const iconMap = {
      success: 'success',
      error: 'error',
      loading: 'loading',
      none: 'none'
    };

    wx.showToast({
      title: message,
      icon: iconMap[type] || 'none',
      duration,
      mask: false
    });

    // 根据类型提供不同的触觉反馈
    switch (type) {
      case 'success':
        this.light();
        break;
      case 'error':
        this.heavy();
        break;
      default:
        break;
    }
  }
}

// 全局实例
const feedback = new InteractionFeedback();

// 导出给页面使用
module.exports = feedback;
```

## 5. 🎭 动画效果系统

```javascript
// 动画管理器
class AnimationManager {
  constructor() {
    this.animations = new Map();
    this.defaultDuration = 300;
    this.defaultEasing = 'cubic-bezier(0.25, 1, 0.5, 1)';
  }

  // 创建动画实例
  create(selector, options = {}) {
    const animation = wx.createAnimation({
      duration: options.duration || this.defaultDuration,
      timingFunction: options.easing || this.defaultEasing,
      delay: options.delay || 0,
      transformOrigin: options.origin || '50% 50% 0'
    });

    this.animations.set(selector, animation);
    return animation;
  }

  // 淡入动画
  fadeIn(selector, options = {}) {
    const animation = this.create(selector, options);
    
    animation.opacity(0).step({ duration: 0 });
    animation.opacity(1).step();
    
    return animation.export();
  }

  // 淡出动画
  fadeOut(selector, options = {}) {
    const animation = this.create(selector, options);
    
    animation.opacity(1).step({ duration: 0 });
    animation.opacity(0).step();
    
    return animation.export();
  }

  // 滑入动画
  slideInUp(selector, options = {}) {
    const animation = this.create(selector, options);
    
    animation.translateY(50).opacity(0).step({ duration: 0 });
    animation.translateY(0).opacity(1).step();
    
    return animation.export();
  }

  // 滑出动画
  slideOutDown(selector, options = {}) {
    const animation = this.create(selector, options);
    
    animation.translateY(0).opacity(1).step({ duration: 0 });
    animation.translateY(50).opacity(0).step();
    
    return animation.export();
  }

  // 缩放进入
  scaleIn(selector, options = {}) {
    const animation = this.create(selector, options);
    
    animation.scale(0.8).opacity(0).step({ duration: 0 });
    animation.scale(1).opacity(1).step();
    
    return animation.export();
  }

  // 缩放退出
  scaleOut(selector, options = {}) {
    const animation = this.create(selector, options);
    
    animation.scale(1).opacity(1).step({ duration: 0 });
    animation.scale(0.8).opacity(0).step();
    
    return animation.export();
  }

  // 弹性动画
  bounce(selector, options = {}) {
    const animation = this.create(selector, {
      ...options,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
    
    animation.scale(0.9).step({ duration: 100 });
    animation.scale(1.05).step({ duration: 100 });
    animation.scale(1).step({ duration: 100 });
    
    return animation.export();
  }

  // 摇摆动画
  shake(selector, options = {}) {
    const animation = this.create(selector, {
      ...options,
      duration: 50
    });
    
    animation.translateX(-5).step();
    animation.translateX(5).step();
    animation.translateX(-5).step();
    animation.translateX(5).step();
    animation.translateX(0).step();
    
    return animation.export();
  }

  // 脉冲动画
  pulse(selector, options = {}) {
    const animation = this.create(selector, {
      ...options,
      duration: 600
    });
    
    animation.scale(1).step({ duration: 0 });
    animation.scale(1.05).step({ duration: 300 });
    animation.scale(1).step({ duration: 300 });
    
    return animation.export();
  }

  // 列表项依次动画
  staggerIn(selectors, options = {}) {
    const delay = options.stagger || 100;
    const animations = [];
    
    selectors.forEach((selector, index) => {
      const animation = this.slideInUp(selector, {
        ...options,
        delay: index * delay
      });
      animations.push(animation);
    });
    
    return animations;
  }

  // 清理动画
  clear(selector) {
    if (this.animations.has(selector)) {
      this.animations.delete(selector);
    }
  }

  // 清理所有动画
  clearAll() {
    this.animations.clear();
  }
}

// 全局动画管理器实例
const animator = new AnimationManager();

module.exports = animator;
``` 