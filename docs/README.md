# 项目文档目录

## 📚 文档概述

本目录包含AI病例管理微信小程序项目的完整需求文档，支持离线查看和本地开发参考。

## 📁 文档结构

```
docs/
├── README.md                    # 本文档
├── requirements/                # 需求文档
│   ├── 01_总览与规范.md
│   ├── 02_FR1_用户家庭管理.md
│   ├── 03_FR2_病历管理.md
│   ├── 04_FR3_健康提醒.md
│   ├── 05_FR4_安全设置.md
│   ├── 06_状态机设计.md
│   └── 07_验收要求.md
├── api/                         # API文档
│   ├── api-overview.md
│   └── postman-collection.json
├── design/                      # 设计文档
│   ├── ui-design.md
│   └── database-design.md
├── development/                 # 开发文档
│   ├── setup-guide.md
│   ├── coding-standards.md
│   └── deployment-guide.md
└── assets/                      # 文档资源
    ├── images/
    └── diagrams/
```

## 🔄 文档同步

### 自动同步脚本
使用 `sync-docs.js` 脚本可以自动同步 bingli/ 目录中的文档到本地 docs/ 目录：

```bash
node scripts/sync-docs.js
```

### 手动同步
如果需要手动同步，可以执行：

```bash
cp -r bingli/*.md docs/requirements/
```

## 📖 离线查看

### 方法1：Markdown阅读器
推荐使用以下工具离线查看：
- **Typora** - 优秀的Markdown编辑器
- **Mark Text** - 开源Markdown编辑器
- **VS Code** - 配合Markdown预览插件

### 方法2：静态网站生成
使用以下工具生成静态文档网站：

```bash
# 使用 docsify
npm install -g docsify-cli
docsify serve docs

# 使用 VuePress
npm install -g vuepress
vuepress dev docs
```

### 方法3：PDF导出
将文档导出为PDF便于打印和分享：

```bash
# 使用 pandoc
pandoc docs/requirements/*.md -o project-requirements.pdf
```

## 🔍 快速查找

### 按功能模块查找
- **用户管理** → `02_FR1_用户家庭管理.md`
- **病历管理** → `03_FR2_病历管理.md`
- **健康提醒** → `04_FR3_健康提醒.md`
- **安全设置** → `05_FR4_安全设置.md`

### 按开发阶段查找
- **需求分析** → `requirements/` 目录
- **系统设计** → `design/` 目录
- **开发指南** → `development/` 目录
- **API接口** → `api/` 目录

## 📝 文档维护

### 更新流程
1. 修改 `bingli/` 目录中的源文档
2. 运行同步脚本更新本地文档
3. 提交更改到版本控制

### 版本控制
- 所有文档变更都会记录在Git历史中
- 使用语义化版本号标记重要更新
- 保持文档与代码同步更新

## 🛠 工具推荐

### 编辑工具
- **Typora** - 所见即所得Markdown编辑
- **VS Code** - 强大的代码编辑器
- **Notion** - 团队协作文档平台

### 查看工具
- **GitBook** - 在线文档平台
- **Docsify** - 轻量级文档网站
- **VuePress** - Vue驱动的静态网站生成器

## 📱 移动端查看

### 手机查看
- 使用GitHub移动应用查看
- 使用Markdown阅读器应用
- 通过浏览器访问在线文档

### 平板查看
- 推荐使用专业的Markdown应用
- 支持分屏查看多个文档
- 可以进行标注和笔记

## 🔗 相关链接

- [项目GitHub仓库](https://github.com/your-username/ai-medical-records)
- [在线文档网站](https://your-username.github.io/ai-medical-records)
- [API接口文档](https://api-docs.your-domain.com)

---

**最后更新时间**: 2024年6月8日  
**文档版本**: v1.0.0 