// 现代化卡片组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 卡片类型
    type: {
      type: String,
      value: 'default' // primary, success, warning, error, default
    },
    
    // 卡片大小
    size: {
      type: String,
      value: 'medium' // small, medium, large
    },
    
    // 标题
    title: {
      type: String,
      value: ''
    },
    
    // 副标题
    subtitle: {
      type: String,
      value: ''
    },
    
    // 头像
    avatar: {
      type: String,
      value: ''
    },
    
    // 图标
    icon: {
      type: String,
      value: ''
    },
    
    // 内容
    content: {
      type: String,
      value: ''
    },
    
    // 图片
    image: {
      type: String,
      value: ''
    },
    
    // 图片模式
    imageMode: {
      type: String,
      value: 'aspectFill'
    },
    
    // 图片覆盖文字
    imageOverlay: {
      type: String,
      value: ''
    },
    
    // 是否显示头部
    showHeader: {
      type: Boolean,
      value: false
    },
    
    // 是否显示底部
    showFooter: {
      type: Boolean,
      value: false
    },
    
    // 操作按钮
    actions: {
      type: Array,
      value: []
    },
    
    // 标签
    tags: {
      type: Array,
      value: []
    },
    
    // 元数据
    meta: {
      type: Array,
      value: []
    },
    
    // 底部按钮
    buttons: {
      type: Array,
      value: []
    },
    
    // 徽章
    badge: {
      type: Object,
      value: null
    },
    
    // 悬浮操作按钮
    fab: {
      type: Object,
      value: null
    },
    
    // 是否加载中
    loading: {
      type: Boolean,
      value: false
    },
    
    // 自定义样式类
    extClass: {
      type: String,
      value: ''
    },
    
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    bodyStyle: ''
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateBodyStyle();
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'size': function(size) {
      this.updateBodyStyle();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新卡片主体样式
     */
    updateBodyStyle() {
      const { size } = this.data;
      let padding = 'var(--spacing-lg)';
      
      switch (size) {
        case 'small':
          padding = 'var(--spacing-md)';
          break;
        case 'large':
          padding = 'var(--spacing-xl)';
          break;
        default:
          padding = 'var(--spacing-lg)';
      }
      
      this.setData({
        bodyStyle: `padding: ${padding};`
      });
    },

    /**
     * 卡片点击事件
     */
    onCardTap(e) {
      if (this.data.loading) return;
      
      this.triggerEvent('cardtap', {
        data: this.data,
        detail: e.detail
      });
    },

    /**
     * 操作按钮点击
     */
    onActionTap(e) {
      e.stopPropagation();
      const { action } = e.currentTarget.dataset;
      
      this.triggerEvent('actiontap', {
        action,
        data: this.data
      });
    },

    /**
     * 底部按钮点击
     */
    onButtonTap(e) {
      e.stopPropagation();
      const { button } = e.currentTarget.dataset;
      
      this.triggerEvent('buttontap', {
        button,
        data: this.data
      });
    },

    /**
     * 悬浮按钮点击
     */
    onFabTap(e) {
      e.stopPropagation();
      
      this.triggerEvent('fabtap', {
        fab: this.data.fab,
        data: this.data
      });
    },

    /**
     * 设置加载状态
     */
    setLoading(loading) {
      this.setData({
        loading
      });
    },

    /**
     * 更新卡片数据
     */
    updateCard(data) {
      this.setData(data);
    },

    /**
     * 添加动画类
     */
    addAnimation(animationClass = 'animated') {
      const currentClass = this.data.extClass;
      if (!currentClass.includes(animationClass)) {
        this.setData({
          extClass: `${currentClass} ${animationClass}`.trim()
        });
      }
    },

    /**
     * 移除动画类
     */
    removeAnimation(animationClass = 'animated') {
      const currentClass = this.data.extClass;
      this.setData({
        extClass: currentClass.replace(animationClass, '').trim()
      });
    }
  }
}); 