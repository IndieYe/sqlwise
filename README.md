## 介绍
通过简洁的自然语言描述，生成精准的SQL查询语句。

### 支持情况
- 界面语言：中文，英文（后续会支持更多）
- 支持数据库：任意类型
   - 查询导入示例脚本那里，目前只添加了：SQLite, MySQL, PostgreSQL, SQLServer
- 支持向量数据库：chroma（后续会支持更多）
- 支持LLM：OpenAI（后续会支持更多）
- 支持翻译（可选）：Azure Translator（后续会支持更多）

### 生成SQL流程
类似工作流的概念，按步骤一步步执行:

1. 匹配业务文档
2. 匹配生成记录
3. AI生成可能相关的字段
4. 根据AI生成的字段匹配出最相似的表与字段
5. AI生成SQL
6. 学习，根据结果学习表备注，字段备注，字段关系

## 特点
- 渐进式完善，越用越准确
- 方便快捷，容易理解
- 功能丰富且精细

## 使用
### 项目结构说明
- `backend`: 后端项目，使用python, flask框架
- `frontend`: 前端项目，使用react，tailwindcss框架

### 依赖要求
后端项目依赖以下内容：

- 数据库，存放应用数据，默认配置的sqlite数据库连接(会生成在`backend/instance`目录)，可以自行修改连接为其他数据库，第一次启动会自动创建表
- 向量数据库，存放应用数据，可以先启动一个chroma的docker容器，然后修改配置连接到chroma
- LLM，默认使用OpenAI，可以自行修改apikey等配置
- 翻译，默认使用Azure Translator，可以自行修改配置，如果你使用的是英语，可以不用配置，否则非常推荐配置上，会大大提高向量数据库匹配的准确性

### 后端部署
- 安装依赖: `pip install -r requirements.txt`
- 本地开发调试：进入backend目录，`python app.py`
- 线上部署：使用gunicorn部署，参考脚本`./start.sh`
- Docker部署：
   - 参考脚本`./docker_build.sh`，构建Docker镜像
   - 参考脚本`./docker_run.sh`，运行Docker镜像

### 前端部署
- 本地开发调试：进入frontend目录，`npm run dev`开启开发调试，或者`npm run start`拉取后端接口重新生成接口定义并开启调试
- 线上部署：使用vite打包，`npm run build`

### 开发网址
本地开发调试情况下，前端网址：`http://localhost:5173`