# 专四网页练习平台技术架构开发方案

> 基于 `hajimeru.txt` 编写。本文档定位为技术架构型开发方案，用于研发评审、技术选型、成本评估和后续拆分实施计划。

## 1. 项目目标

建设一个网页式专四练习平台，覆盖专四考试中的听写、访谈、听力、单选、完形、阅读、写作等题型。平台以统一“试卷”模型承载所有练习，每一次练习都形成可归档记录，包含用时、得分、标准答案、学生作答、讲解和批改结果。

首要技术重点是支持写作训练中的拍照识别、导入、AI 批改、讲解展示和试卷存档；其他题型通过统一题型引擎逐步扩展。

## 2. 建设原则

1. **网页优先**：优先实现浏览器可访问的 Web 应用，不先做原生 App。
2. **统一试卷模型**：所有题型都通过“题目模板 + 试卷实例 + 作答记录 + 评分结果”表达。
3. **题型可扩展**：不同题型差异通过配置和题型渲染器处理，避免每个题型单独重建业务链路。
4. **写作能力优先**：OCR、AI 批改、老师评分标准、讲解生成先服务写作模块，再沉淀为平台能力。
5. **老师可控**：评分标准由老师维护，AI 批改基于老师配置执行，不直接替代教学判断。
6. **结果可追溯**：每次练习的原始作答、OCR 文本、AI 输出、最终得分都应被保存。
7. **安全合规**：学生上传图片、作文内容和评分结果属于敏感学习数据，必须进行访问控制和最小化存储。

## 3. 用户角色

### 3.1 学生

学生使用平台完成练习、上传答案、查看计时、提交试卷、查看得分、讲解、标准答案和历史试卷。

### 3.2 老师

老师维护题目、标准答案、讲解、写作评分标准和全真模拟评分规则，并查看学生练习结果。

### 3.3 管理员

管理员管理用户、课程、题库权限、系统配置、AI/OCR 服务配置和数据导出权限。

## 4. 功能范围

### 4.1 题型范围

平台规划支持以下专四题型：

- 听写
- 访谈
- 听力
- 单选
- 完形
- 阅读
- 写作

其中写作模块优先实现以下练习类型：

1. **缩写练习**
   
   - 给定文章。
   - 要求学生写出或概括 topic sentence。

2. **段落组织练习**
   
   - 给定若干 topic sentence。
   - 要求学生连成约 80 词段落。

3. **提纲练习**
   
   - 给定文章。
   - 要求学生写出符合要求的 thesis statement。
   - 要求学生写出支撑 thesis statement 的分论点。

4. **框架练习**
   
   - 给定一组有关联的分论点。
   - 要求学生用有效关联词结构串联分论点。
   - 要求学生用补充性语言扩展分论点。

5. **全真模拟**
   
   - 老师维护评分标准。
   - 系统根据评分标准辅助批改并生成反馈。

### 4.2 通用练习功能

- 做题考试界面。
- 答题界面。
- 手动输入答案。
- 拍照识别或文件导入答案。
- 可显示或隐藏的计时器。
- 可配置限时器。
- 标准答案展示。
- 讲解展示。
- AI 批改。
- 试卷存档。
- 历史试卷查看。

## 5. 总体架构

系统采用分层架构：

```text
Browser Web App
   |
   v
Frontend Application
   |
   v
Backend API / BFF
   |
   +--> Auth & User Service
   +--> Question Bank Service
   +--> Exam Paper Service
   +--> Answer Service
   +--> Scoring Service
   +--> Explanation Service
   +--> AI Orchestration Service
   +--> OCR/File Service
   |
   v
PostgreSQL + Object Storage + External AI/OCR Providers
```

### 5.1 前端层

前端负责考试体验和结果展示，核心页面包括：

- 登录页。
- 学生练习列表页。
- 题型练习入口页。
- 考试/做题页。
- 拍照或导入答案页。
- 提交确认页。
- 批改结果页。
- 讲解页。
- 历史试卷页。
- 老师题库管理页。
- 老师评分标准管理页。

### 5.2 后端 API 层

后端负责业务规则、权限控制、数据持久化、AI/OCR 调度和结果归档。

核心 API 模块：

- 用户与权限 API。
- 题库 API。
- 试卷实例 API。
- 作答 API。
- 文件上传 API。
- OCR 任务 API。
- AI 批改 API。
- 评分结果 API。
- 讲解 API。
- 历史记录 API。

### 5.3 题型引擎

题型引擎将不同题型抽象为统一结构：

- 题型标识。
- 题干内容。
- 输入方式。
- 标准答案。
- 评分规则。
- 资源附件。
- 渲染配置。
- 批改配置。

不同题型通过前端题型渲染器和后端评分策略进行扩展。

### 5.4 AI 服务层

AI 服务层不直接暴露给前端，由后端统一调用。它负责：

- 写作评分。
- 语法与表达反馈。
- topic sentence 评价。
- thesis statement 评价。
- 分论点评价。
- 段落连贯性评价。
- 关联词与补充性语言评价。
- 讲解生成。
- 学习建议生成。

AI 调用应统一记录输入摘要、模型版本、输出结果和调用状态，便于追踪质量和成本。

### 5.5 OCR 与文件服务层

OCR 与文件服务层负责：

- 学生上传图片。
- 图片保存到对象存储。
- OCR 识别。
- OCR 文本回填到作答记录。
- 保存原图、识别文本、识别置信度和人工修正文本。

OCR 识别结果必须允许学生在提交前查看和修改。

### 5.6 数据存储层

- PostgreSQL 保存用户、题库、试卷、作答、评分、讲解、任务状态等结构化数据。
- 对象存储保存图片、音频、附件和可能的大文件。
- Redis 可作为后续增强项，用于异步任务状态、限流和缓存。

## 6. 推荐技术栈

### 6.1 前端

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod

Next.js 适合快速搭建网页式应用，并可同时提供服务端渲染、API Routes 和部署便利性。

### 6.2 后端

小团队优先选择：

- Next.js API Routes / Route Handlers
- Prisma
- PostgreSQL

当业务复杂度增加后，可迁移或拆分为：

- NestJS
- PostgreSQL
- Prisma 或 TypeORM
- 独立 Worker 服务

### 6.3 AI 与 OCR

- AI：Anthropic Claude API 或同类大模型 API。
- OCR：云 OCR API 优先，例如腾讯云 OCR、阿里云 OCR、Google Vision、AWS Textract 等。
- 文件：S3 兼容对象存储。

### 6.4 部署

MVP 阶段推荐：

- 前端和轻量后端：Vercel 或 Node.js 托管平台。
- 数据库：托管 PostgreSQL。
- 文件：S3 兼容对象存储。
- 后台任务：托管队列或独立 Node Worker。

生产阶段推荐：

- Web 服务与 Worker 分离。
- 数据库开启自动备份。
- 对象存储配置生命周期策略。
- AI/OCR 调用增加限流和成本监控。

## 7. 核心领域模型

### 7.1 User

用户表保存学生、老师、管理员的基础信息。

关键字段：

- id
- name
- email 或 phone
- role
- createdAt
- updatedAt

### 7.2 Question

题目表保存单个题目的基础信息。

关键字段：

- id
- type
- title
- prompt
- content
- standardAnswer
- explanation
- scoringRubricId
- metadata
- createdBy
- createdAt
- updatedAt

### 7.3 ExamTemplate

试卷模板表定义一次练习包含哪些题目和配置。

关键字段：

- id
- title
- description
- examType
- timeLimitSeconds
- questionIds
- visibility
- createdBy
- createdAt
- updatedAt

### 7.4 ExamAttempt

试卷实例表记录学生每一次练习。

关键字段：

- id
- examTemplateId
- studentId
- status
- startedAt
- submittedAt
- durationSeconds
- totalScore
- standardAnswerSnapshot
- explanationSnapshot
- createdAt
- updatedAt

### 7.5 Answer

作答表记录学生对每道题的答案。

关键字段：

- id
- examAttemptId
- questionId
- inputMethod
- rawText
- ocrText
- finalText
- attachmentIds
- submittedAt
- createdAt
- updatedAt

### 7.6 Attachment

附件表记录图片、音频和导入文件。

关键字段：

- id
- ownerId
- fileType
- storageKey
- originalFilename
- mimeType
- sizeBytes
- createdAt

### 7.7 OcrJob

OCR 任务表记录识别状态。

关键字段：

- id
- attachmentId
- answerId
- status
- provider
- recognizedText
- confidence
- errorMessage
- createdAt
- completedAt

### 7.8 ScoringRubric

评分标准表由老师维护。

关键字段：

- id
- title
- questionType
- criteria
- maxScore
- createdBy
- createdAt
- updatedAt

### 7.9 ScoringResult

评分结果表保存 AI 或老师批改结果。

关键字段：

- id
- examAttemptId
- answerId
- scorerType
- score
- maxScore
- rubricBreakdown
- feedback
- modelName
- modelVersion
- createdAt

## 8. 关键业务流程

### 8.1 学生做题流程

1. 学生选择练习。
2. 系统创建 `ExamAttempt`。
3. 前端加载试卷模板、题目、资源和计时配置。
4. 学生作答。
5. 学生可手动输入，也可上传图片或文件。
6. 若上传图片，系统创建附件和 OCR 任务。
7. OCR 返回识别文本。
8. 学生确认或修改识别文本。
9. 学生提交试卷。
10. 系统保存最终作答并触发评分。
11. 系统生成得分、讲解和反馈。
12. 试卷进入归档状态。
13. 学生查看历史试卷。

### 8.2 写作 AI 批改流程

1. 后端读取题目、标准答案、老师评分标准和学生最终答案。
2. 后端构造受控 AI 请求。
3. AI 返回结构化评分结果。
4. 后端校验 AI 输出结构。
5. 后端保存 `ScoringResult`。
6. 前端展示总分、分项得分、问题说明和修改建议。

### 8.3 OCR 导入流程

1. 前端上传图片。
2. 后端校验文件类型和大小。
3. 后端保存文件到对象存储。
4. 后端创建 `Attachment` 和 `OcrJob`。
5. Worker 调用 OCR Provider。
6. Worker 保存识别结果。
7. 前端轮询或订阅任务状态。
8. 学生确认识别文本后写入 `Answer.finalText`。

### 8.4 老师维护评分标准流程

1. 老师创建或编辑评分标准。
2. 老师为题目或试卷关联评分标准。
3. 学生提交后，AI 使用该评分标准进行批改。
4. 老师可查看 AI 批改结果，并在后续版本中支持人工覆盖。

## 9. API 设计草案

### 9.1 学生端 API

```http
GET /api/student/exams
GET /api/student/exams/:examTemplateId
POST /api/student/exam-attempts
GET /api/student/exam-attempts/:attemptId
PATCH /api/student/exam-attempts/:attemptId/answers/:answerId
POST /api/student/exam-attempts/:attemptId/submit
GET /api/student/exam-attempts/:attemptId/result
GET /api/student/exam-attempts/history
```

### 9.2 文件与 OCR API

```http
POST /api/files/upload
POST /api/ocr/jobs
GET /api/ocr/jobs/:jobId
PATCH /api/answers/:answerId/ocr-confirmation
```

### 9.3 老师端 API

```http
GET /api/teacher/questions
POST /api/teacher/questions
PATCH /api/teacher/questions/:questionId
GET /api/teacher/exam-templates
POST /api/teacher/exam-templates
PATCH /api/teacher/exam-templates/:examTemplateId
GET /api/teacher/scoring-rubrics
POST /api/teacher/scoring-rubrics
PATCH /api/teacher/scoring-rubrics/:rubricId
GET /api/teacher/exam-attempts
GET /api/teacher/exam-attempts/:attemptId
```

### 9.4 管理端 API

```http
GET /api/admin/users
PATCH /api/admin/users/:userId
GET /api/admin/system/ai-usage
GET /api/admin/system/ocr-usage
```

## 10. 前端页面结构

```text
/app
  /(auth)
    /login
  /(student)
    /dashboard
    /exams
    /exams/[examTemplateId]
    /attempts/[attemptId]
    /attempts/[attemptId]/result
    /history
  /(teacher)
    /questions
    /questions/[questionId]
    /exam-templates
    /exam-templates/[examTemplateId]
    /rubrics
    /rubrics/[rubricId]
  /(admin)
    /users
    /system
```

核心前端组件：

- `ExamTimer`
- `QuestionRenderer`
- `WritingAnswerEditor`
- `ImageUploadInput`
- `OcrReviewPanel`
- `SubmitExamDialog`
- `ScoringResultView`
- `ExplanationPanel`
- `AttemptHistoryList`
- `RubricEditor`

## 11. 后端模块结构

```text
/src
  /auth
  /users
  /questions
  /exam-templates
  /exam-attempts
  /answers
  /attachments
  /ocr
  /scoring
  /ai
  /rubrics
  /history
  /workers
```

模块职责：

- `auth`：登录、会话、权限。
- `users`：用户资料与角色。
- `questions`：题目创建、编辑、查询。
- `exam-templates`：试卷模板与题目组合。
- `exam-attempts`：学生练习实例、计时、提交、归档。
- `answers`：学生作答保存和修改。
- `attachments`：文件元数据和对象存储访问。
- `ocr`：OCR 任务创建、状态查询和结果保存。
- `scoring`：评分任务、评分结果和分项反馈。
- `ai`：模型调用封装、提示词模板、结构化输出校验。
- `rubrics`：老师评分标准管理。
- `history`：历史试卷查询。
- `workers`：异步 OCR 和 AI 批改任务。

## 12. AI 批改设计

### 12.1 输入

AI 批改请求应包含：

- 题型。
- 题干。
- 学生答案。
- 标准答案。
- 老师评分标准。
- 满分。
- 输出语言。
- 需要返回的结构化字段。

### 12.2 输出

AI 输出应为结构化 JSON：

```json
{
  "score": 8,
  "maxScore": 10,
  "summary": "答案基本切题，但论证展开不足。",
  "criteria": [
    {
      "name": "内容完整性",
      "score": 3,
      "maxScore": 4,
      "feedback": "覆盖了核心观点，但缺少具体支撑。"
    },
    {
      "name": "语言表达",
      "score": 3,
      "maxScore": 3,
      "feedback": "语法错误较少，表达清晰。"
    },
    {
      "name": "结构连贯",
      "score": 2,
      "maxScore": 3,
      "feedback": "段落衔接可以增加过渡表达。"
    }
  ],
  "suggestions": [
    "增加一个具体例子支撑主题句。",
    "使用 therefore、in addition 等连接词增强连贯性。"
  ]
}
```

### 12.3 质量控制

- 后端必须校验 AI 返回 JSON 结构。
- AI 分数不得超过评分标准满分。
- 老师评分标准缺失时，不应进行正式 AI 评分，只能生成非正式建议。
- 保存模型名称、版本、输入摘要和输出，便于问题追踪。
- 对低置信度或结构异常结果标记为需要人工复核。

## 13. OCR 设计

### 13.1 上传限制

- 仅允许图片和明确支持的文档格式。
- 文件大小设置上限。
- 文件名不作为可信输入。
- 对象存储路径由后端生成。

### 13.2 识别结果处理

OCR 结果不直接作为最终答案。系统应展示识别文本，由学生确认或修改后再提交。

### 13.3 失败处理

- OCR 失败时显示可理解错误信息。
- 学生可重新上传。
- 学生可改用手动输入。
- 失败任务保留错误原因，便于排查。

## 14. 权限与安全

### 14.1 访问控制

- 学生只能访问自己的试卷、答案、附件和评分结果。
- 老师只能访问自己管理范围内的题库、试卷和学生结果。
- 管理员可访问系统配置和用户管理。

### 14.2 数据安全

- 上传文件使用私有对象存储桶。
- 文件访问使用短期签名 URL。
- 敏感字段避免写入前端日志。
- AI/OCR 请求避免发送不必要的用户身份信息。
- 数据库定期备份。

### 14.3 滥用控制

- 限制单用户上传频率。
- 限制 AI 批改频率。
- 限制 OCR 调用频率。
- 对异常高成本账号进行告警。

## 15. 异步任务设计

OCR 和 AI 批改都应支持异步处理。

任务状态：

- `pending`
- `processing`
- `succeeded`
- `failed`

前端策略：

- OCR：上传后在答题页展示识别进度。
- AI 批改：提交后进入结果生成状态，完成后展示结果。

后端策略：

- 任务创建与业务提交分离。
- Worker 幂等处理任务。
- 失败任务记录错误原因。
- 支持有限次数重试。

## 16. 试卷存档设计

每一次练习都是一份归档试卷。归档内容包括：

- 试卷模板快照。
- 题目快照。
- 标准答案快照。
- 讲解快照。
- 学生作答。
- 上传附件引用。
- OCR 识别结果。
- 用时。
- 得分。
- AI 批改结果。
- 提交时间。

使用快照的原因是题库和讲解后续可能被老师修改，历史试卷必须保持当时状态。

## 17. 测试策略

### 17.1 单元测试

重点覆盖：

- 题型数据结构校验。
- 计时和用时计算。
- 评分结果结构校验。
- 权限判断。
- OCR/AI 任务状态流转。

### 17.2 集成测试

重点覆盖：

- 创建试卷实例。
- 保存作答。
- 上传附件。
- 创建 OCR 任务。
- 提交试卷。
- 生成评分结果。
- 查询历史试卷。

### 17.3 端到端测试

重点覆盖学生主流程：

1. 登录。
2. 选择写作练习。
3. 上传答案图片。
4. 查看 OCR 识别结果。
5. 修改识别文本。
6. 提交试卷。
7. 查看 AI 批改结果。
8. 查看历史试卷。

### 17.4 AI/OCR 测试

- 使用固定样例验证 AI 输出结构。
- 使用真实手写或打印图片验证 OCR 效果。
- 对 AI/OCR Provider 做 mock，避免常规测试依赖外部服务。
- 保留少量手动验收用例验证真实服务质量。

## 18. 可观测性与运营指标

### 18.1 技术指标

- API 错误率。
- OCR 成功率。
- AI 批改成功率。
- 平均批改耗时。
- 平均 OCR 耗时。
- 文件上传失败率。
- 数据库慢查询。

### 18.2 产品指标

- 学生练习次数。
- 试卷提交率。
- OCR 后人工修改比例。
- AI 批改查看率。
- 历史试卷回看率。
- 每种题型使用量。

### 18.3 成本指标

- 单次 OCR 平均成本。
- 单次 AI 批改平均成本。
- 每用户月均 AI/OCR 成本。
- 文件存储增长量。

## 19. 开发阶段建议

### 19.1 第一阶段：基础平台与写作闭环

目标：完成学生写作练习从进入、作答、上传、OCR、提交、AI 批改到归档的完整闭环。

范围：

- 登录与角色。
- 写作题库。
- 试卷模板。
- 试卷实例。
- 手动输入。
- 图片上传。
- OCR 识别与确认。
- AI 批改。
- 结果页。
- 历史试卷。
- 老师评分标准。

### 19.2 第二阶段：老师题库与多写作类型

目标：完善老师端能力，覆盖缩写、段落组织、提纲、框架、全真模拟。

范围：

- 老师题目管理。
- 老师试卷模板管理。
- 老师评分标准管理。
- 写作细分题型配置。
- 批改结果复核。

### 19.3 第三阶段：客观题和阅读题型

目标：扩展单选、完形、阅读等文本类题型。

范围：

- 客观题渲染器。
- 自动判分。
- 阅读材料展示。
- 多题组合试卷。
- 标准答案和讲解展示。

### 19.4 第四阶段：听力类题型

目标：支持听写、访谈、听力。

范围：

- 音频资源上传。
- 音频播放器。
- 播放限制。
- 听力答题界面。
- 听写题判分和讲解。

### 19.5 第五阶段：运营与规模化

目标：提升稳定性、成本控制和教学运营能力。

范围：

- 班级管理。
- 学习统计。
- 批量导入题库。
- AI/OCR 成本看板。
- 数据导出。
- 更细粒度权限。

## 20. 主要技术风险

### 20.1 OCR 识别质量不稳定

学生拍照质量、手写体、光线和角度会影响识别结果。解决方式是将 OCR 作为辅助输入，必须允许学生确认和修改。

### 20.2 AI 评分一致性

AI 评分可能受提示词、模型版本和评分标准表达影响。解决方式是结构化评分标准、保存模型版本、提供老师复核能力。

### 20.3 成本失控

OCR 和 AI 调用按量计费。解决方式是限流、缓存、成本看板和异常告警。

### 20.4 历史试卷一致性

题目、标准答案和讲解可能后续修改。解决方式是试卷提交时保存快照。

### 20.5 题型扩展复杂度

不同题型交互差异较大。解决方式是统一底层试卷模型，题型 UI 和评分策略独立扩展。

## 21. 验收标准

### 21.1 第一阶段验收标准

- 学生可以进入写作练习。
- 学生可以手动输入答案。
- 学生可以上传图片并获得 OCR 识别文本。
- 学生可以修改 OCR 文本后提交。
- 系统可以根据老师评分标准生成 AI 批改结果。
- 系统可以显示得分、分项反馈、讲解和标准答案。
- 系统可以保存每次练习的用时、得分和答案快照。
- 学生可以查看历史试卷。
- 老师可以维护写作评分标准。

### 21.2 平台级验收标准

- 新增题型不需要重写用户、试卷、作答、存档主流程。
- 每次 AI/OCR 调用都有可追踪记录。
- 学生不能访问他人试卷和附件。
- 老师不能访问无权限班级或学生数据。
- 上传文件不会公开暴露。
- 历史试卷不受题库后续修改影响。

## 22. 推荐实施顺序

1. 搭建 Next.js + TypeScript + PostgreSQL + Prisma 基础项目。
2. 实现用户、角色和权限。
3. 实现题库、试卷模板、试卷实例和作答模型。
4. 实现学生写作练习页面。
5. 实现计时、提交和试卷归档。
6. 实现文件上传和对象存储。
7. 实现 OCR 任务和识别结果确认。
8. 实现老师评分标准管理。
9. 实现 AI 批改服务和结构化结果保存。
10. 实现结果页和历史试卷页。
11. 补充老师端题库管理。
12. 扩展写作细分练习类型。
13. 扩展客观题、阅读和听力题型。

## 23. 后续需要进一步确定的问题

1. 登录方式使用手机号、邮箱还是学校账号体系。
2. 是否需要班级、课程、作业发布功能。
3. 老师评分标准是否需要版本管理。
4. AI 批改结果是否允许老师人工覆盖。
5. OCR 优先服务打印体、手写体，还是两者都支持。
6. 是否需要移动端浏览器专项适配。
7. 是否需要支持音频播放次数限制。
8. 数据是否有本地化部署或特定合规要求。

## 24. 结论

该平台应以统一试卷模型作为技术底座，以写作模块的 OCR 和 AI 批改作为第一优先级能力，逐步扩展到专四其他题型。技术上建议从 Next.js 全栈架构起步，使用 PostgreSQL 承载核心业务数据，使用对象存储保存图片和音频，通过独立 AI/OCR 服务层隔离外部模型与识别能力。这样可以在早期快速验证教学闭环，并为后续题型扩展和规模化运营保留清晰边界。
